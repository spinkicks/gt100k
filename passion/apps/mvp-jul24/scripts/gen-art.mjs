#!/usr/bin/env node
/**
 * gen-art.mjs — generate the game's art (world map + cabin backgrounds) via
 * the TrueFoundry image gateway.
 *
 * Usage:
 *   node scripts/gen-art.mjs [target...] [--model <gpt-image-1|gemini-3-pro-image-preview>]
 *
 * With no target, generates every target in TARGETS. Writes PNG/JPEG bytes
 * straight to public/art/<target>.<ext>.
 *
 * Auth: reads the gateway key out of process.env.ANTHROPIC_CUSTOM_HEADERS,
 * which holds a string like "x-tfy-api-key: tfy_...". The key is extracted,
 * trimmed, and sent as both the x-tfy-api-key header and an Authorization:
 * Bearer header. The key is never logged, printed, or written to a file.
 */

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ART_DIR = join(__dirname, '..', 'public', 'art')

const GATEWAY_URL = 'https://tfy.promptlens.trilogy.com/api/llm/images/generations'
const DEFAULT_MODEL = 'gpt-image-1'
const VALID_MODELS = new Set(['gpt-image-1', 'gemini-3-pro-image-preview'])

/** Named art targets: prompt + output filename. */
const TARGETS = {
  map: {
    file: 'map.png',
    prompt:
      'A warm, painterly parchment-style fantasy world map, like an illustrated ' +
      'overworld from a cozy storybook game. Hand-painted, top-down view, aged ' +
      'parchment texture with soft muted colors. Show a handful of distinct, ' +
      'cozy themed island or region nodes scattered across the map: a small ' +
      'math-and-puzzle cabin with geometric shapes and gears nearby, a music ' +
      'cabin with instruments and musical notes in the trees, a code cabin with ' +
      'glowing circuit-like paths and a lantern, and an art cabin with paint ' +
      'splatters and an easel outside. Gentle rolling hills, winding paths ' +
      'connecting the regions, soft clouds, a hand-drawn storybook illustration ' +
      'style. No text, no labels, no words, no UI elements anywhere in the image.',
  },
  'cabin-math': {
    file: 'cabin-math.png',
    prompt:
      'A cozy wooden cabin interior, viewed from a fixed first-person ' +
      'perspective looking toward a stone fireplace. Warm firelight glow, ' +
      'exposed wood-plank walls and beams, a small rug on a wooden floor. On ' +
      'the walls, small framed puzzle gadgets and math curiosities hang like ' +
      'decorations — wooden geometric puzzles, an abacus, a grid-paper sketch in ' +
      'a frame. Soft warm lantern light, inviting and snug, painterly ' +
      'storybook illustration style, rich warm color palette. No people, no ' +
      'characters, no text, no words, no UI elements anywhere in the image.',
  },
}

function parseArgs(argv) {
  const targets = []
  let model = DEFAULT_MODEL
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--model') {
      model = argv[++i]
    } else if (arg.startsWith('--model=')) {
      model = arg.slice('--model='.length)
    } else if (!arg.startsWith('--')) {
      targets.push(arg)
    }
  }
  if (!VALID_MODELS.has(model)) {
    console.error(`Unknown --model "${model}". Valid models: ${[...VALID_MODELS].join(', ')}`)
    process.exit(1)
  }
  return { targets: targets.length > 0 ? targets : Object.keys(TARGETS), model }
}

function extractApiKey() {
  const raw = process.env.ANTHROPIC_CUSTOM_HEADERS
  if (!raw) {
    throw new Error(
      'ANTHROPIC_CUSTOM_HEADERS is not set. Expected something like "x-tfy-api-key: tfy_...".'
    )
  }
  const match = raw.match(/x-tfy-api-key:\s*(.+)/i)
  if (!match) {
    throw new Error('ANTHROPIC_CUSTOM_HEADERS is set but does not contain an x-tfy-api-key entry.')
  }
  const key = match[1].trim()
  if (!key) {
    throw new Error('Extracted x-tfy-api-key value is empty.')
  }
  return key
}

async function generateImage({ model, prompt, apiKey }) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tfy-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024' }),
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '<no body>')
    const snippet = bodyText.slice(0, 500)
    throw new Error(`Gateway request failed: HTTP ${res.status} ${res.statusText}\n${snippet}`)
  }

  const json = await res.json()
  const item = json?.data?.[0]
  if (!item) {
    throw new Error(`Unexpected gateway response shape: ${JSON.stringify(json).slice(0, 500)}`)
  }

  if (item.b64_json) {
    return Buffer.from(item.b64_json, 'base64')
  }

  if (item.url) {
    const imgRes = await fetch(item.url)
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch generated image URL: HTTP ${imgRes.status}`)
    }
    return Buffer.from(await imgRes.arrayBuffer())
  }

  throw new Error('Gateway response contained neither b64_json nor url.')
}

async function main() {
  const { targets, model } = parseArgs(process.argv.slice(2))

  const unknown = targets.filter((t) => !(t in TARGETS))
  if (unknown.length > 0) {
    console.error(`Unknown target(s): ${unknown.join(', ')}`)
    console.error(`Valid targets: ${Object.keys(TARGETS).join(', ')}`)
    process.exit(1)
  }

  let apiKey
  try {
    apiKey = extractApiKey()
  } catch (err) {
    console.error(`Auth error: ${err.message}`)
    process.exit(1)
  }

  mkdirSync(ART_DIR, { recursive: true })

  console.log(`Generating ${targets.length} art target(s) with model "${model}"...`)

  let hadError = false
  for (const name of targets) {
    const { file, prompt } = TARGETS[name]
    const outPath = join(ART_DIR, file)
    try {
      console.log(`  -> ${name}: requesting...`)
      const bytes = await generateImage({ model, prompt, apiKey })
      writeFileSync(outPath, bytes)
      console.log(`  -> ${name}: wrote ${outPath} (${bytes.length} bytes)`)
    } catch (err) {
      hadError = true
      console.error(`  -> ${name}: FAILED — ${err.message}`)
    }
  }

  if (hadError) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`)
  process.exit(1)
})
