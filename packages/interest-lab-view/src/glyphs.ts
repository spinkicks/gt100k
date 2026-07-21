import type { WorkMode } from "@gt100k/interest-lab";

export const WORK_MODE_GLYPHS = {
  build: "glyph-hammer",
  investigate: "glyph-lens",
  compose: "glyph-quill",
  explain: "glyph-speech",
  perform: "glyph-star-stage",
  debug: "glyph-wrench-bug",
  collaborate: "glyph-hands",
  care: "glyph-heart",
  persuade: "glyph-flag",
} as const satisfies Record<WorkMode, string>;
