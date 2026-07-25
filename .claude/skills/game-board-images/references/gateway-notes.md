# TrueFoundry gateway — image and vision notes

Empirically checked on 2026-07-25 from this repo's environment. Read this when a
call starts failing or you need a capability `scripts/board.mjs` doesn't expose.

## Auth

The gateway credentials are already in the environment — no second API key.

- Base: `https://tfy.promptlens.trilogy.com/api/llm` (override with `TFY_GATEWAY_BASE`).
- Key lives in `ANTHROPIC_CUSTOM_HEADERS` as `x-tfy-api-key: tfy_...`. Extract it
  and send it as **both** `x-tfy-api-key` and `Authorization: Bearer`.
- Never log it, print it, or write it to a file. This repo is public; gitleaks
  runs in CI.

## Routes

| Route | Method | Notes |
|---|---|---|
| `images/generations` | POST JSON | Text-to-image. **No `/v1`** — `/v1/images/generations` 404s. |
| `images/edits` | POST **multipart/form-data** | Image-to-image. The only route here that accepts an input image. Sending JSON returns HTTP 500 complaining the Content-Type is not multipart. |
| `v1/messages` | POST JSON | Anthropic Messages API, incl. vision. This one *does* take `/v1`. |
| `v1/models` | GET | Model listing. |

For `images/edits` with `fetch`, build a `FormData` with a `Blob` for `image` and
**do not** set `Content-Type` yourself — fetch has to add the multipart boundary.

## Models that work

- **Image generation / editing:** `gpt-image-2` (default), `gpt-image-1.5`,
  `gpt-image-1`. `gemini-3-pro-image-preview` also generates (returns JPEG).
- **Vision + text:** `claude-opus-5`, `claude-sonnet-5`, and the 4-x families.

`gpt-image-2` returns PNG as `data[0].b64_json`. Some models return `data[0].url`
instead, so handle both.

## Models that are listed but do NOT work

`v1/models` advertises the whole Stability toolkit on Bedrock —
`stable-image-control-structure`, `control-sketch`, `style-transfer`,
`stable-image-ultra`, inpaint, upscale, remove-background. **They are not usable
from this environment.**

- `us.stability.stable-image-control-structure-v1-0` → HTTP 403, "Model access is
  denied due to IAM user or service role is not authorized to perform the required
  AWS Marketplace actions". Not a request-shape problem — the subscription isn't
  there.
- `stability.stable-image-ultra-v1-1` → HTTP 400 "provided model identifier is
  invalid".
- `us.stability.stable-style-transfer-v1-0` → HTTP 400, wants Stability-native
  fields (`text_prompts`) rather than the OpenAI-compatible shape.

This matters because control-structure would be the *right* tool for holding a
board's geometry while restyling it. Since it 403s, `stylize` uses `images/edits`
with `gpt-image-2` instead — good layout preservation, but a soft constraint, so
the result must be verified rather than trusted. Re-test control-structure if the
Bedrock subscription is ever added; it would be a strict improvement.

Unsupported parameters worth knowing: `gpt-image-2` rejects `input_fidelity`
("does not support the 'input_fidelity' parameter"), so preservation is driven by
prompt wording alone.

## Vision response trap

Claude models on this gateway think before answering, and **thinking tokens are
drawn from the same `max_tokens` budget**. With a tight budget the whole
allowance goes to reasoning and the response comes back with an empty text block
and `stop_reason: "max_tokens"` — which reads like a silent success and will hand
you an empty critique.

Two defences, both in `lib/gateway.mjs`:

- Ask for a generous `max_tokens` (2500 for a board check).
- Filter `content` for `type === "text"` and **throw if the result is empty**
  rather than returning `""`.

`content` may contain a `thinking` block first, so never assume `content[0].text`.

## Cost and latency

Rough, from the runs used to build this skill: a `gpt-image-2` generation or edit
takes ~1-2 minutes at 1024x1024 and returns ~2 MB of PNG; a vision check takes
~15-30 seconds. Budget accordingly — a 3-iteration `generate` can run several
minutes. `render` is local and effectively instant, which is another reason to
prefer it.
