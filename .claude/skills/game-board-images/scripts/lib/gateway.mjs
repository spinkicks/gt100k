/**
 * TrueFoundry gateway client: image generation, structure-guided restyling, and
 * Claude vision.
 *
 * Auth reuses the gateway credentials already present in the environment, so
 * nothing here needs a second API key. The key is read out of
 * ANTHROPIC_CUSTOM_HEADERS and is never logged, printed or written to disk — this
 * repo is public and gitleaks runs in CI.
 */

import { shrinkForUpload } from "./png.mjs";

const DEFAULT_BASE = "https://tfy.promptlens.trilogy.com/api/llm";

export const MODELS = {
  // Text-to-image. gpt-image-2 follows dense positional instructions far better
  // than earlier diffusion models, which is why it is the default.
  image: "gpt-image-2",
  imageAlternatives: ["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gemini-3-pro-image-preview"],
  // Image-to-image, used to repaint an exact render photorealistically while
  // holding its layout. Stability's control-structure model would be the more
  // precise tool and is listed by the gateway, but the Bedrock subscription
  // behind it returns 403, so gpt-image edits is what actually works here.
  edit: "gpt-image-2",
  editAlternatives: ["gpt-image-2", "gpt-image-1.5", "gpt-image-1"],
  // Vision checker.
  vision: "claude-opus-5",
};

export function apiKey() {
  const raw = process.env.ANTHROPIC_CUSTOM_HEADERS;
  if (!raw) {
    throw new Error(
      "ANTHROPIC_CUSTOM_HEADERS is not set — expected it to contain \"x-tfy-api-key: tfy_...\". " +
        "This script relies on the gateway credentials already in the environment.",
    );
  }
  const m = raw.match(/x-tfy-api-key:\s*([^,;\s]+)/i);
  if (!m) throw new Error("ANTHROPIC_CUSTOM_HEADERS is set but has no x-tfy-api-key entry.");
  return m[1].trim();
}

function baseUrl() {
  return (process.env.TFY_GATEWAY_BASE || DEFAULT_BASE).replace(/\/$/, "");
}

function headers(key) {
  return {
    "Content-Type": "application/json",
    "x-tfy-api-key": key,
    Authorization: `Bearer ${key}`,
  };
}

const RETRY_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Retry transient failures. Board images run to a couple of megabytes once
 * base64-encoded, and the gateway intermittently closes the socket mid-upload
 * ("other side closed", zero bytes read). That is not a bug in the request, so a
 * multi-minute generate/verify run should not die on it.
 */
async function withRetry(label, attempt, tries = 3) {
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
      if (!err.retryable || i === tries) break;
      const waitMs = 1500 * 2 ** (i - 1);
      console.error(`  ${label}: ${err.message.split("\n")[0]} — retrying in ${waitMs}ms (${i}/${tries - 1})`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

/** Wrap a fetch so network errors and transient HTTP statuses are marked retryable. */
async function send(url, init, label) {
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const e = new Error(`Gateway ${label} network error: ${err.message}${err.cause ? ` (${err.cause.code || err.cause.message})` : ""}`);
    e.retryable = true;
    throw e;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    const e = new Error(`Gateway ${label} failed: HTTP ${res.status} ${res.statusText}\n${text.slice(0, 600)}`);
    e.retryable = RETRY_STATUS.has(res.status);
    throw e;
  }
  return res;
}

async function postJSON(path, body, key) {
  const payload = JSON.stringify(body);
  const res = await withRetry(path, () =>
    send(`${baseUrl()}/${path}`, { method: "POST", headers: headers(key), body: payload }, path),
  );
  return res.json();
}

/** Pull image bytes out of an OpenAI-shaped images response. */
async function imageBytes(json) {
  const item = json?.data?.[0];
  if (!item) throw new Error(`Unexpected image response: ${JSON.stringify(json).slice(0, 400)}`);
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) {
    const r = await fetch(item.url);
    if (!r.ok) throw new Error(`Failed to download generated image: HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("Image response contained neither b64_json nor url.");
}

/** Text-to-image. */
export async function generateImage({ prompt, model = MODELS.image, size = "1024x1024", key = apiKey() }) {
  const json = await postJSON("images/generations", { model, prompt, n: 1, size }, key);
  return imageBytes(json);
}

/**
 * Repaint `imagePng` from a prompt, keeping its layout. Sent as multipart to
 * images/edits, which is the only route on this gateway that accepts an input
 * image (the JSON route rejects it, and the Stability structure models 403).
 *
 * Layout preservation here is a property of the model honouring the reference
 * image, not a hard constraint — which is exactly why the caller verifies the
 * result instead of trusting it.
 */
export async function restyleImage({ imagePng, prompt, model = MODELS.edit, size = "1024x1024", key = apiKey() }) {
  // Rebuilt per attempt: a FormData carrying a Blob cannot be replayed reliably
  // once a request has consumed it.
  const build = () => {
    const form = new FormData();
    form.set("model", model);
    form.set("prompt", prompt);
    form.set("image", new Blob([imagePng], { type: "image/png" }), "board.png");
    if (size) form.set("size", size);
    return form;
  };
  const res = await withRetry("images/edits", () =>
    send(
      `${baseUrl()}/images/edits`,
      {
        method: "POST",
        // No Content-Type: fetch sets the multipart boundary itself.
        headers: { "x-tfy-api-key": key, Authorization: `Bearer ${key}` },
        body: build(),
      },
      "images/edits",
    ),
  );
  return imageBytes(await res.json());
}

/** True if the buffer starts with a PNG signature (else assume JPEG). */
export function mediaTypeOf(bytes) {
  return bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg";
}

/**
 * Ask Claude to look at an image and answer `prompt`.
 *
 * maxTokens is generous on purpose: the vision models think before answering and
 * a tight budget gets spent entirely on reasoning, returning an empty text block
 * that reads like a silent success.
 */
export async function askVision({ imageBytes: bytes, prompt, model = MODELS.vision, maxTokens = 6000, key = apiKey() }) {
  // Downscale before upload: full-size generated PNGs are large enough that the
  // gateway drops the connection, and a board only needs to be legible.
  const upload = shrinkForUpload(bytes);
  const json = await postJSON(
    "v1/messages",
    {
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaTypeOf(upload), data: upload.toString("base64") } },
            { type: "text", text: prompt },
          ],
        },
      ],
    },
    key,
  );
  const text = (json.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
  if (!text) {
    throw new Error(
      `Vision model returned no text (stop_reason=${json.stop_reason}). ` +
        "If stop_reason is max_tokens, raise maxTokens — thinking tokens are drawn from the same budget.",
    );
  }
  return text;
}

/** Ask Claude a text-only question (used to rewrite prompts between attempts). */
export async function askText({ prompt, model = MODELS.vision, maxTokens = 2000, key = apiKey() }) {
  const json = await postJSON(
    "v1/messages",
    { model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] },
    key,
  );
  const text = (json.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
  if (!text) throw new Error(`Model returned no text (stop_reason=${json.stop_reason}).`);
  return text;
}
