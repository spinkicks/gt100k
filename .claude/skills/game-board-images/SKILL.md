---
name: game-board-images
description: Produce accurate images of chess boards and other game boards (checkers/draughts, go, reversi, tic-tac-toe, connect four) where specific pieces must sit on specific squares — as a crisp diagram, as a photorealistic image, or both, with the position machine-verified against the spec. Use this whenever a request involves a board position, a FEN string, a chess puzzle or opening, a "picture/diagram/image of a chess board", or any board where piece placement has to be right rather than merely decorative. Also use it to audit a board image someone else generated. Reach for this instead of calling an image model directly: text-to-image alone silently misplaces pieces, and this skill's whole job is to stop that.
---

# Accurate game-board images

Prompting an image model for "a chess board with the Sicilian Defense" produces
something that *looks* like chess and is usually wrong somewhere — a knight on
the wrong square, nine pawns, a 7x9 grid. The error is invisible unless you count
squares, which is exactly what nobody does before shipping the image.

So this skill separates two things people conflate: **being correct** and
**looking photographic**. Correctness comes from drawing the board locally from a
spec. Photorealism comes from an image model. You can have either alone, or both
by doing them in that order — and every network-generated result gets read back
by a vision model and compared against the spec before it is handed over.

All commands are one script: `scripts/board.mjs`. Run `node scripts/board.mjs help`
for exact flags.

## Pick the path first

This is the only decision that really matters, so make it deliberately rather
than defaulting to image generation because the request said "image".

| If the user needs… | Use | Correctness |
|---|---|---|
| A clear diagram, a puzzle position, teaching material, print, anything embedded in a doc or app | `render` | **Guaranteed.** Drawn locally, no network. |
| A photoreal board *and* the exact position | `render` → `stylize` | Verified before return; falls back to the exact render if it drifts. |
| Photoreal atmosphere where the exact squares don't matter | `generate` | Not guaranteed, even when verified. |
| To check an image that already exists | `verify` | — |

Default to `render`. It is instant, offline, deterministic, and it is the only
option that cannot be wrong. Only reach past it when the user actually wants a
photograph rather than a diagram.

## render — exact, offline, always correct

```bash
node scripts/board.mjs render --fen "r1bqkb1r/ppp2ppp/2n2n2/4p3/4P3/2NP1N2/PP3PPP/R1BQKB1R" \
  --out sicilian.png --svg
```

Emits PNG and (with `--svg`) an SVG of the same geometry, so it scales for print
or the web. It also prints a canonical description of what it drew — that text is
the ground truth the verifier uses, so the image and the claim about the image
come from the same source.

Useful flags: `--theme mono|classic|blue|green|wood` (`mono` is the highest
contrast and the safest for reading a position back), `--square-size`,
`--highlight e2,e4`, `--flip` (view from Black), `--title`, `--no-coords`.

Non-chess boards come from a spec file:

```bash
node scripts/board.mjs render --spec position.json --out board.png
```

```json
{
  "game": "checkers",
  "pieces": [
    { "at": "a1", "shape": "disc",  "color": "white" },
    { "at": "b2", "shape": "crown", "color": "white" },
    { "at": "f6", "shape": "disc",  "color": "black" }
  ]
}
```

- `game`: `chess`, `checkers`, `draughts` (10x10), `go` (19x19, stones on
  intersections), `reversi`/`othello`, `tictactoe`, `connect-four`, or `custom`
  with explicit `rows`/`cols`. Each sets sensible defaults you can override
  (`checkered`, `placement`, `coords`).
- Chess pieces: `{"at","piece":"king|queen|rook|bishop|knight|pawn","color"}`.
- Other games: `{"at","shape":"disc|ring|cross|square|triangle|crown","color","label"}`.
- Squares are algebraic — file letter from the left, rank number from the
  **bottom**, so `a1` is bottom-left.

## stylize — photoreal, position held

Renders the exact board, then has an image model repaint it in the requested
style, then verifies the repaint against the spec. If a piece moved, it retries
naming the squares that drifted.

```bash
node scripts/board.mjs stylize --fen "8/8/4k3/8/8/8/4K3/7R" \
  --out endgame.png --style "walnut and maple board, dramatic side lighting" --keep-attempts
```

Because the model is given the exact render as its reference, layout survives far
better than with a text prompt. It is still not a hard constraint — that is why
the verify step exists. **If it exits non-zero, do not present the image as that
position**; use the `render` output or retry with a simpler style. `--keep-attempts`
also writes the exact render alongside, which is handy when you want both.

## generate — photoreal from text only, verified

The generate → check → refine loop: build a prompt from the spec, generate,
have Claude read the image back, and rewrite the prompt around whatever squares
were wrong.

```bash
node scripts/board.mjs generate --fen "<fen>" --out board.png --iterations 3 --keep-attempts
```

Worth knowing before you choose this: `gpt-image-2` is far better at this than
its predecessors. Spot checks while building this skill had it place a full
30-piece opening and a 20-piece asymmetric middlegame correctly on the first
attempt, square colours included. That is a handful of samples, not a
reliability figure — the failure rate is unmeasured, and the reason the loop
exists is that when these models do get a square wrong the image still looks
completely convincing. The loop keeps the best-scoring attempt rather than the
last one, and exits non-zero if nothing verified — treat that exit code as "do
not publish this as the position".

If the user needs a specific position, prefer `stylize`; `generate` earns its
place when the board is set dressing and the vibe matters more than the squares.

## verify — audit any image

```bash
node scripts/board.mjs verify --image someone-elses-board.png --fen "<fen>"
```

Also accepts `--description "..."` / `--description-file f.txt` for boards with
no spec. The checker reads the board off the image *before* being shown the
target, so it is harder for it to rubber-stamp what it was told to expect, and it
fails closed — an unparseable verdict counts as "not verified", never as a pass.
Exit code `3` means "produced, but did not verify".

## Things that will bite you

- **Exit code 3 is not success.** Every network path can produce a plausible
  image that does not match. The exit code is the signal; the image's appearance
  is not.
- **A verifier pass is evidence, not proof.** It is one vision read, and vision
  reads of fine geometric detail are genuinely shaky: while building this skill,
  two reads of the same image disagreed about whether its checkerboard parity was
  inverted, and the one that sounded most confident was the wrong one. Pixel
  sampling settled it. So for anything high-stakes, `render` is the honest answer,
  and if a specific visual property really matters, measure it rather than asking.
- **Go coordinates include `i`.** Traditional go notation skips that letter; this
  renderer does not, so `k10` here is one file left of where a go player expects.
  The printed description always names the letters it used, so a spec and its
  diagram stay self-consistent — but translate carefully from published games.
- **Piece art is drawn from geometry, not a font.** There is no dependency on an
  installed typeface or rasterizer: `render` needs only `node`. Coordinate labels
  use a built-in pixel font, which is why they are lowercase.
- **Don't hand-write FEN from a prose position.** Convert carefully and then
  `render` it and look at the image — a FEN typo produces a confidently wrong
  board that verifies as "accurate" because the spec itself was wrong. The
  verifier checks image-against-spec, never spec-against-intent.

## Auth and gateway

Everything except `render` calls the TrueFoundry gateway using the key already in
`ANTHROPIC_CUSTOM_HEADERS` — no extra API key, no setup. The key is never logged
or written to disk; this repo is public and gitleaks runs in CI.

Models: `gpt-image-2` for generation and editing, `claude-opus-5` for vision.
See `references/gateway-notes.md` for the routes, the models that are listed but
not actually authorized, and the response-shape traps — read it if a call starts
failing or you need a capability this script doesn't expose.
