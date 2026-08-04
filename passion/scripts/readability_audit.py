#!/usr/bin/env python3
"""Extract user-facing copy from PassionLab apps and score readability.

Produces: Flesch-Kincaid grade, avg sentence length, jargon hits, panel density,
and the longest sentences — with file:line citations.
"""
from __future__ import annotations

import ast
import json
import math
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path("/home/malice/code/gt100k/passion")

# App scopes → directories (relative to ROOT) that feed user-facing text for that audience.
APP_SCOPES: dict[str, list[str]] = {
    "discovery": ["apps/discovery/app", "apps/discovery/runtime"],
    "project-studio": ["apps/project-studio/app"],
    "guide-console": ["apps/guide-console/app"],
    "parent-guide": ["apps/parent-guide/app"],
    # home surfaces pull labels/blurbs from the shared UI package
    "home": ["apps/home/app", "packages/ui/src/surfaces.ts", "packages/ui/src/product-header.tsx"],
}

# Engine packages that emit user-visible prose (attributed to the app that surfaces them).
ENGINE_PACKAGES: dict[str, list[str]] = {
    "engine:wellbeing": ["packages/wellbeing/src/assess.ts"],
    "engine:hypothesis-store": ["packages/hypothesis-store/src/view.ts"],
    "engine:motivation": ["packages/motivation/src/probes.ts"],
    "engine:specialization-planner": [
        "packages/specialization-planner/src/plan.ts",
        "packages/specialization-planner/src/stub-generator.ts",
    ],
}

# Which audience consumes which engine package's prose.
ENGINE_AUDIENCE: dict[str, str] = {
    "engine:wellbeing": "guide-console",
    "engine:hypothesis-store": "guide-console",
    "engine:motivation": "guide-console",
    "engine:specialization-planner": "guide-console",
}

AUDIENCE: dict[str, str] = {
    "discovery": "child",
    "project-studio": "child",
    "guide-console": "adult",
    "parent-guide": "adult",
    "home": "adult",
}

# Property keys whose string values are user-facing.
USER_KEYS = {
    "label",
    "desc",
    "description",
    "heading",
    "body",
    "title",
    "how",
    "why",
    "blurb",
    "prompt",
    "placeholder",
    "aria-label",
    "ariaLabel",
    "aria-labelledby",
    "alt",
    "cannotTell",
    "ifYouSee",
    "consistentWith",
    "does",
    "rationale",
    "escalationReason",
    "terminalNote",
    "craftScaffold",
    "drivingQuestion",
    "authenticMethod",
    "successLooksLike",
    "craftFloorHint",
    "nextProbe",
    "lede",
    "foot",
    "hint",
    "empty",
    "emptyHint",
    "subtitle",
    "caption",
    "message",
    "summary",
    "detail",
    "action",
    "cta",
    "noun",
    "verb",
    "question",
    "answer",
    "note",
    "tip",
    "helper",
    "help",
    "instruction",
    "instructions",
    "eyebrow",
    "kicker",
    "lead",
    "copy",
    "prose",
    "text",
    "name",  # sometimes kid-facing display names; filtered later if camelCase
}

# JSX / HTML attribute names that hold user-facing strings.
ATTR_KEYS = {
    "aria-label",
    "aria-labelledby",
    "placeholder",
    "title",
    "alt",
    "label",
}

SUSPECT_JARGON = [
    "hypothesis",
    "specialization",
    "spike",
    "cell",
    "lower bound",
    "confidence",
    "confident",
    "evidence mass",
    "autonomy",
    "scaffold",
    "scaffolding",
    "conditional regard",
    "ignition",
    "rungs",
    "rung",
    "gate",
    "validator",
    "attestation",
    "provenance",
    "synthetic",
    "ingested",
    "work-mode",
    "work mode",
    "dose",
    "cadence",
    "deload",
    "replan",
    "PCDE",
    "dp dose",
    "deliberate practice",
    "attribution",
    "disconfirming",
    "coverage gap",
    "promote",
    "park",
    "contest",
    "reopen",
    "burnout",
    "wellbeing",
    "mastery map",
    "mastery-map",
    "domain path",
    "cellKey",
    "cell key",
    "evidence graph",
    "surfacing",
    "evaluative",
    "non-contingent",
    "rage to master",
    "Type III",
    "flagship",
    "producer identity",
    "relatedness",
    "self-regulation",
    "self_regulation",
    "stretch-seeking",
    "stretch seeking",
    "voluntary return",
    "depth accumulation",
    "readiness signals",
    "counter-cyclical",
    "setpoint",
    "guardrail",
    "escalate",
    "escalation",
    "hypothesis card",
    "console view",
    "work-style",
    "work style",
    "attestation",
    "ledger",
    "observatory",
    "constellation",
    "commit log",
    "milestone",
    "artifact",
    "perseverance",
    "devaluation",
    "over-identification",
    "overidentification",
    "parental over-valuation",
    "family control",
    "posture",
    "knob",
    "probe",
    "adult move",
    "subtraction",
    "correlational",
    "certified",
    "plannable",
    "craft scaffold",
    "craft floor",
    "audience level",
    "mentor relay",
    "investment load",
    "bounded DP",
    "DP",
    "S1_IGNITION",
    "S2_FOUNDATIONS",
    "S3_AUTHORSHIP",
    "S4_SIGNATURE",
    "AUTONOMY_UP",
    "SCAFFOLD",
    "HOLD",
    "PUSH",
    "STEADY",
]

SKIP_DIR_PARTS = {
    "node_modules",
    ".next",
    "test",
    "e2e",
    "__fixtures__",
    "dist",
    "coverage",
    ".turbo",
}

# Strings that are clearly not prose for end users.
SKIP_STRING_RE = re.compile(
    r"^("
    r"[\w./:@#-]+$"  # bare identifiers / paths / urls without spaces
    r"|https?://"
    r"|data-testid"
    r"|className"
    r"|#[0-9a-fA-F]{3,8}"
    r"|\d+(\.\d+)?(%)?"
    r"|[A-Z][A-Z0-9_]{2,}"  # ENUM_TOKENS alone
    r")$"
)

CODEY_RE = re.compile(
    r"^(import |export |from |const |let |var |function |return |type |interface |"
    r"class |if \(|for \(|while \(|switch |case |default:|await |async |"
    r"use[A-Z]|React\.|console\.|JSON\.|Object\.|Array\.|Math\.|Number\.|"
    r"String\.|Boolean\.|Error\(|throw |new |typeof |instanceof )"
)

# Reject strings that are clearly leaked source code, not UI copy.
CODE_LEAK_RE = re.compile(
    r"(?:\bconst\b|\blet\b|\bvar\b|\bfunction\b|\breturn\b|\bexport\b|\bimport\b|"
    r"\buseState\b|\buseRef\b|\buseEffect\b|\buseMemo\b|\buseCallback\b|"
    r"=>|\?\.\s*\w|\bnew Map\b|\bnew Set\b|\bclassName\b|\bdata-testid\b|"
    r"\bonClick\b|\bonSolve\b|\bonExit\b|\bonOpen\b|\bonAttempt\b|\bonHarder\b|"
    r"\bsetSelected\b|\bpreventDefault\b|\.filter\(|\.map\(|\.find\(|"
    r"\?\? |\|\| |\bnull\b\s*;|\bundefined\b|"
    r"S1_IGNITION\s*:|WARM\s*:|TECHNICAL\s*:|"  # enum map dumps
    r"M12 3v3|viewBox|"  # SVG path dumps
    r"gated?\?\.|done:\s*gate)",
    re.IGNORECASE,
)

# Files that hold engine/puzzle logic, not user-facing chrome.
LOGIC_FILE_RE = re.compile(
    r"(?:^|/)(?:logic|generate|naive|split|world|types|model|derive|stage|gate|"
    r"actions|store|index|deps|live-deps|ask-handler|ask-seed|seed|maps-seed|"
    r"maps-seed-chess-resources|console-data|console-state|decisions|recovery-log|"
    r"family-reviews|family\.ts|engagement|attention|offer-next|plan-library|"
    r"plan-milestone|map-evidence|overview\.ts|wellbeing\.ts|recovery\.ts|"
    r"interview\.ts|puzzles\.data)\.ts$"
)

COPY_FILE_ALLOW = re.compile(
    r"(?:vocab|studio-state|copy|probes|assess|view|plan|stub-generator|"
    r"surfaces|sections|decide)\.ts$"
)

# Template / format junk
TEMPLATE_JUNK = re.compile(r"^\$\{|^[`'\"]$|^\s*$")


@dataclass
class Hit:
    app: str
    path: str
    line: int
    kind: str
    text: str
    panel: str = ""


@dataclass
class PanelBucket:
    app: str
    panel: str
    path: str
    texts: list[str] = field(default_factory=list)
    lines: list[int] = field(default_factory=list)


def should_skip_path(p: Path) -> bool:
    parts = set(p.parts)
    if parts & SKIP_DIR_PARTS:
        return True
    name = p.name
    if name.endswith(".d.ts") or name == "next-env.d.ts":
        return True
    if name.endswith(".test.ts") or name.endswith(".test.tsx") or name.endswith(".spec.ts"):
        return True
    return False


def unescape_js_string(s: str) -> str:
    """Best-effort unescape of a JS/TS string literal body (no surrounding quotes)."""
    # Use unicode_escape via a fake Python string when possible.
    try:
        # Represent as a Python triple-quoted raw-ish string via codecs.
        return bytes(s, "utf-8").decode("unicode_escape")
    except Exception:
        return (
            s.replace("\\n", "\n")
            .replace("\\t", "\t")
            .replace("\\'", "'")
            .replace('\\"', '"')
            .replace("\\`", "`")
            .replace("\\\\", "\\")
        )


def looks_like_prose(s: str) -> bool:
    s = s.strip()
    if len(s) < 2:
        return False
    if TEMPLATE_JUNK.match(s):
        return False
    if SKIP_STRING_RE.match(s):
        return False
    if CODEY_RE.match(s):
        return False
    if CODE_LEAK_RE.search(s):
        return False
    # Must contain at least one letter
    if not re.search(r"[A-Za-z]", s):
        return False
    # Ratio of letters to total — SVG paths / code crumbs fail this
    letters = len(re.findall(r"[A-Za-z]", s))
    if letters / max(1, len(s)) < 0.55 and " " in s and word_count(s) > 8:
        return False
    # Too many code punctuation marks
    if s.count("{") + s.count("}") + s.count(";") + s.count("=") >= 3:
        return False
    # Pure camelCase / snake_case identifiers with no spaces and short
    if " " not in s and "_" in s and s.lower() == s:
        return False
    if " " not in s and re.match(r"^[a-z]+([A-Z][a-z0-9]+)+$", s):
        return False
    # CSS-ish
    if re.match(r"^[\w-]+__[\w-]+$", s) or re.match(r"^[\w-]+--[\w-]+$", s):
        return False
    # Import paths
    if s.startswith("@") or s.startswith("./") or s.startswith("../"):
        return False
    # Concatenated label-map dump (many Colon-quoted pairs)
    if s.count(': "') + s.count(": '") >= 4:
        return False
    return True


def is_comment_line(line: str) -> bool:
    t = line.lstrip()
    return t.startswith("//") or t.startswith("*") or t.startswith("/*") or t.startswith("*/")


STRING_LIT_RE = re.compile(
    r"""(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)"""
)

# key: "value" or key: `value` or key: 'value'
KEYED_STRING_RE = re.compile(
    r"""(?P<key>["']?[\w-]+["']?)\s*:\s*(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)""",
    re.MULTILINE,
)

# JSX attributes: aria-label="..." placeholder='...' title={`...`}
ATTR_RE = re.compile(
    r"""(?P<attr>aria-label|aria-labelledby|placeholder|title|alt)\s*=\s*(?:\{)?(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)\}?""",
    re.IGNORECASE,
)

# JSX text nodes between tags (may span lines; stop at { or <)
JSX_TEXT_RE = re.compile(
    r""">(?P<body>[^<>{}]+)<""",
    re.DOTALL,
)

# Standalone exported/const string assignments that are clearly copy
CONST_STRING_RE = re.compile(
    r"""(?:export\s+)?const\s+(?P<name>[A-Z][A-Z0-9_]*(?:_NOTE|_COPY|_LABEL|_TITLE|_BODY|_HINT|_MSG|_TEXT)?|[a-z]+(?:Label|Copy|Title|Heading|Body|Hint|Message|Text|Blurb|Lede|Foot|Note|Prompt|Desc))\s*=\s*(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)""",
)


def panel_from_path(path: Path, line: int, text_around: str = "") -> str:
    """Heuristic panel/screen name from file + nearby aria-label."""
    stem = path.stem
    # Prefer component/file name as panel id
    return stem


def strip_ts_comments(src: str) -> str:
    """Remove // and /* */ comments without destroying string literals.

    A small state machine: track whether we are inside ', ", or ` so that
    comment markers inside strings survive (placeholders, regexes, etc.).
    """
    out: list[str] = []
    i = 0
    n = len(src)
    state = "code"  # code | squote | dquote | template | linecomment | blockcomment
    while i < n:
        ch = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if state == "code":
            if ch == "/" and nxt == "/":
                state = "linecomment"
                out.append(" ")
                i += 2
                continue
            if ch == "/" and nxt == "*":
                state = "blockcomment"
                out.append(" ")
                i += 2
                continue
            if ch == "'":
                state = "squote"
                out.append(ch)
                i += 1
                continue
            if ch == '"':
                state = "dquote"
                out.append(ch)
                i += 1
                continue
            if ch == "`":
                state = "template"
                out.append(ch)
                i += 1
                continue
            out.append(ch)
            i += 1
            continue
        if state == "linecomment":
            if ch == "\n":
                state = "code"
                out.append("\n")
            else:
                out.append(" ")
            i += 1
            continue
        if state == "blockcomment":
            if ch == "*" and nxt == "/":
                state = "code"
                out.append("  ")
                i += 2
                continue
            out.append("\n" if ch == "\n" else " ")
            i += 1
            continue
        # string / template states
        out.append(ch)
        if ch == "\\" and i + 1 < n:
            out.append(src[i + 1])
            i += 2
            continue
        if state == "squote" and ch == "'":
            state = "code"
        elif state == "dquote" and ch == '"':
            state = "code"
        elif state == "template" and ch == "`":
            state = "code"
        i += 1
    return "".join(out)


def extract_from_file(app: str, path: Path) -> list[Hit]:
    hits: list[Hit] = []
    try:
        original = path.read_text(encoding="utf-8")
    except Exception:
        return hits
    # Work on a comment-stripped view so developer essays never score as UI copy.
    # Keep original only for line-number mapping (same length: comments → spaces).
    raw = strip_ts_comments(original)
    lines = raw.splitlines()
    rel = str(path)
    # Skip pure seed/fixture content that is domain curriculum, not chrome —
    # still extract it but tag the app panel; maps-seed IS guide-visible.
    _ = original

    # Track which (line, text) we've already recorded to avoid double-count
    seen: set[tuple[int, str]] = set()

    def add(line_no: int, kind: str, text: str) -> None:
        text = text.strip()
        # Collapse whitespace inside
        text = re.sub(r"\s+", " ", text)
        if not looks_like_prose(text):
            return
        # Skip if the whole line is a comment (string in a comment)
        if 0 <= line_no - 1 < len(lines) and is_comment_line(lines[line_no - 1]):
            # Allow JSDoc @example? No — skip comments entirely
            return
        # Also skip block-comment interiors: if previous non-empty lines are still in /*
        # Simple heuristic: if line contains only comment markers around the string
        ln = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
        if "//" in ln:
            before = ln.split("//")[0]
            # if the string isn't in the code part before //, skip
            # (rough: if quote appears only after //)
            code_part = before
            if text[:20] not in code_part and text not in code_part:
                # might still be in a string before //; check quotes
                if ln.lstrip().startswith("//"):
                    return

        key = (line_no, text)
        if key in seen:
            return
        seen.add(key)
        hits.append(
            Hit(
                app=app,
                path=rel,
                line=line_no,
                kind=kind,
                text=text,
                panel=panel_from_path(path, line_no),
            )
        )

    # 1) Keyed property strings (label/desc/body/…)
    for m in KEYED_STRING_RE.finditer(raw):
        key = m.group("key").strip("\"'")
        body = unescape_js_string(m.group("body"))
        line_no = raw.count("\n", 0, m.start()) + 1
        # Skip if inside a line comment
        ln = lines[line_no - 1] if line_no - 1 < len(lines) else ""
        if ln.lstrip().startswith("//") or ln.lstrip().startswith("*"):
            continue
        if key in USER_KEYS or key in ATTR_KEYS:
            add(line_no, f"prop:{key}", body)
        elif key.endswith("Label") or key.endswith("Copy") or key.endswith("Title"):
            add(line_no, f"prop:{key}", body)

    # 2) JSX / HTML attributes
    for m in ATTR_RE.finditer(raw):
        body = unescape_js_string(m.group("body"))
        # Skip template expressions that are mostly ${...}
        if "${" in body and len(re.sub(r"\$\{[^}]*\}", "", body).strip()) < 3:
            # keep if there's surrounding prose; strip interpolations for scoring
            cleaned = re.sub(r"\$\{[^}]*\}", "…", body)
            if not looks_like_prose(cleaned):
                continue
            body = cleaned
        line_no = raw.count("\n", 0, m.start()) + 1
        ln = lines[line_no - 1] if line_no - 1 < len(lines) else ""
        if ln.lstrip().startswith("//") or ln.lstrip().startswith("*"):
            continue
        add(line_no, f"attr:{m.group('attr')}", body)

    # 3) JSX text nodes
    for m in JSX_TEXT_RE.finditer(raw):
        body = m.group("body")
        # Decode HTML entities common in JSX text
        body = (
            body.replace("&apos;", "'")
            .replace("&quot;", '"')
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("{/*", "")
        )
        line_no = raw.count("\n", 0, m.start()) + 1
        ln = lines[line_no - 1] if line_no - 1 < len(lines) else ""
        if ln.lstrip().startswith("//") or ln.lstrip().startswith("*"):
            continue
        # Skip JSX that is only punctuation / braces leftovers
        if not re.search(r"[A-Za-z]{2,}", body):
            continue
        add(line_no, "jsx-text", body)

    # 3b) Dense prose documents only (parent-guide). Elsewhere, keyed strings + JSX
    # text + attrs are enough; tag-stripping on component files leaks code.
    if path.suffix == ".tsx" and "parent-guide" in rel:
        stripped = raw
        # Remove block comments and line comments
        stripped = re.sub(r"/\*.*?\*/", " ", stripped, flags=re.DOTALL)
        stripped = re.sub(r"^\s*//.*$", " ", stripped, flags=re.MULTILINE)
        # Remove imports
        stripped = re.sub(r"^import\s.+?;\s*$", " ", stripped, flags=re.MULTILINE)
        # Remove JSX expressions that are not string literals
        stripped = re.sub(r"\{[^}\"']*?\}", " ", stripped)
        # Keep string literals inside {}, drop the braces
        stripped = re.sub(
            r"""\{(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)\}""",
            lambda m: " " + unescape_js_string(m.group("body")) + " ",
            stripped,
        )
        # Drop tags
        stripped = re.sub(r"</?[A-Za-z][^>]*>", "\n", stripped)
        stripped = (
            stripped.replace("&apos;", "'")
            .replace("&quot;", '"')
            .replace("&amp;", "&")
            .replace("&nbsp;", " ")
        )
        # Reassemble lines into paragraph blocks
        buf: list[str] = []
        block_start = 1
        line_cursor = 0
        for i, line in enumerate(stripped.splitlines(), 1):
            t = re.sub(r"\s+", " ", line).strip()
            if not t:
                if buf:
                    para = " ".join(buf)
                    if word_count(para) >= 6:
                        add(block_start, "tsx-prose-block", para)
                    buf = []
                continue
            if not re.search(r"[A-Za-z]{3,}", t):
                continue
            # Skip leftover code crumbs
            if re.match(
                r"^(export |function |const |return |className|data-testid|type |interface )",
                t,
            ):
                continue
            if not buf:
                # Approximate source line: search first 40 chars in original
                needle = t[:40]
                idx = raw.find(needle)
                block_start = raw.count("\n", 0, idx) + 1 if idx >= 0 else i
            buf.append(t)
        if buf:
            para = " ".join(buf)
            if word_count(para) >= 6:
                add(block_start, "tsx-prose-block", para)

    # 4) Named const copy strings
    for m in CONST_STRING_RE.finditer(raw):
        body = unescape_js_string(m.group("body"))
        line_no = raw.count("\n", 0, m.start()) + 1
        ln = lines[line_no - 1] if line_no - 1 < len(lines) else ""
        if ln.lstrip().startswith("//") or ln.lstrip().startswith("*"):
            continue
        add(line_no, f"const:{m.group('name')}", body)

    # 5) For engine packages: also pull rationale / escalationReason template literals more aggressively
    if "packages/" in rel:
        for m in re.finditer(
            r"""(?:rationale|escalationReason|terminalNote|craftScaffold|drivingQuestion|authenticMethod|successLooksLike|cannotTell|does|why|how|ifYouSee|consistentWith|nextProbe)\s*[:=]\s*(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)""",
            raw,
            re.DOTALL,
        ):
            body = unescape_js_string(m.group("body"))
            # For multiline template literals, take first ~500 chars as one unit then split sentences later
            body = re.sub(r"\$\{[^}]*\}", "…", body)
            body = re.sub(r"\s+", " ", body).strip()
            line_no = raw.count("\n", 0, m.start()) + 1
            add(line_no, "engine-prose", body)

        # Record STAGE_PURPOSE / CRAFT_FLOOR etc.
        for m in re.finditer(
            r"""(?:S1_IGNITION|S2_FOUNDATIONS|S3_AUTHORSHIP|S4_SIGNATURE)\s*:\s*(?P<q>["'`])(?P<body>(?:\\.|(?!(?P=q)).)*?)(?P=q)""",
            raw,
        ):
            body = unescape_js_string(m.group("body"))
            line_no = raw.count("\n", 0, m.start()) + 1
            add(line_no, "engine-stage-copy", body)

        # notes arrays with string literals that look like guide-facing (filter NEVER_GAMIFY etc.)
        for m in STRING_LIT_RE.finditer(raw):
            body = unescape_js_string(m.group("body"))
            line_no = raw.count("\n", 0, m.start()) + 1
            ln = lines[line_no - 1] if line_no - 1 < len(lines) else ""
            if ln.lstrip().startswith("//") or ln.lstrip().startswith("*"):
                continue
            # Only keep note-like prose in engines if it has spaces and verbs
            if " " in body and len(body) > 40 and looks_like_prose(body):
                # Avoid pulling type/interface docs that snuck in
                if any(
                    x in body.lower()
                    for x in (
                        "never gamify",
                        "human disposes",
                        "pressure half",
                        "setpoint",
                        "counter-cyclical",
                        "push only",
                        "missingness",
                        "weight devaluation",
                        "back off =",
                        "dp is bounded",
                        "rest is not optional",
                        "child owns",
                        "plan protects",
                        "strain present",
                        "rage to master",
                    )
                ):
                    add(line_no, "engine-note", body)

    return hits


def count_syllables(word: str) -> int:
    w = re.sub(r"[^a-zA-Z]", "", word).lower()
    if not w:
        return 0
    # Classic heuristic
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in w:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if w.endswith("e") and count > 1:
        count -= 1
    if w.endswith("le") and len(w) > 2 and w[-3] not in vowels:
        count += 1
    return max(1, count)


def split_sentences(text: str) -> list[str]:
    # Normalize
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    # Split on sentence-ending punctuation followed by space + capital or end
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"“‘(\[])|(?<=[.!?])\s*$", text)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # Treat fragments without terminal punct as sentences if they have 4+ words
        out.append(p)
    # If no split happened and text has no period, keep as one sentence
    if not out and text:
        out = [text]
    return out


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text))


def flesch_kincaid_grade(text: str) -> tuple[float, float, int, int, int]:
    """Return (grade, avg_sentence_len, words, sentences, syllables)."""
    sentences = split_sentences(text)
    # Filter tiny non-sentences
    sentences = [s for s in sentences if word_count(s) >= 3]
    words_list = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text)
    n_words = len(words_list)
    n_sent = max(1, len(sentences))
    n_syll = sum(count_syllables(w) for w in words_list)
    if n_words == 0:
        return (0.0, 0.0, 0, 0, 0)
    asl = n_words / n_sent
    asw = n_syll / n_words
    grade = 0.39 * asl + 11.8 * asw - 15.59
    return (grade, asl, n_words, n_sent, n_syll)


def gather_files() -> dict[str, list[Path]]:
    out: dict[str, list[Path]] = {}
    for app, rels in APP_SCOPES.items():
        files: list[Path] = []
        for rel in rels:
            base = ROOT / rel
            if not base.exists():
                continue
            if base.is_file():
                files.append(base)
                continue
            for p in base.rglob("*"):
                if p.suffix not in {".ts", ".tsx"}:
                    continue
                if should_skip_path(p):
                    continue
                # .ts files: only known copy modules; puzzle logic/generators excluded
                if p.suffix == ".ts":
                    if LOGIC_FILE_RE.search(p.name) and not COPY_FILE_ALLOW.search(p.name):
                        continue
                    # Allow copy-ish .ts; skip other infra .ts unless named allow
                    if not COPY_FILE_ALLOW.search(p.name) and not any(
                        x in p.name
                        for x in (
                            "label",
                            "copy",
                            "vocab",
                            "probe",
                            "brief",
                            "overview",
                            "recovery",
                            "family",
                            "engagement",
                            "attention",
                            "offer",
                            "plan-",
                            "maps",
                            "wellbeing",
                            "interview",
                            "ask-",
                            "seed",
                        )
                    ):
                        # Still allow app-level .ts that often hold UI strings
                        if "/app/" not in str(p) and "/components/" not in str(p):
                            continue
                files.append(p)
        out[app] = sorted(set(files))
    for eng, rels in ENGINE_PACKAGES.items():
        files = []
        for rel in rels:
            p = ROOT / rel
            if p.exists():
                files.append(p)
        out[eng] = files
    return out


def main() -> int:
    files = gather_files()
    all_hits: list[Hit] = []
    for app, paths in files.items():
        for p in paths:
            all_hits.extend(extract_from_file(app, p))

    # Also fold engine hits into their consuming app for combined scores, but keep separate buckets.
    by_app: dict[str, list[Hit]] = defaultdict(list)
    for h in all_hits:
        by_app[h.app].append(h)

    report: dict = {"apps": {}, "jargon": {}, "panels": {}, "longest": []}

    # Per-app readability
    for app in list(APP_SCOPES) + list(ENGINE_PACKAGES):
        hits = by_app.get(app, [])
        # Deduplicate identical texts within an app (keep first occurrence)
        unique: list[Hit] = []
        seen_text: set[str] = set()
        for h in hits:
            # Keep short UI labels too, but for FK grade prefer sentence-like prose
            key = h.text.lower()
            if key in seen_text:
                continue
            seen_text.add(key)
            unique.append(h)

        prose_hits = [h for h in unique if word_count(h.text) >= 4]
        corpus = " ".join(h.text for h in prose_hits)
        grade, asl, n_words, n_sent, n_syll = flesch_kincaid_grade(corpus)

        # Also score only "sentence-like" (≥8 words or ending with punct)
        sent_like = [
            h
            for h in prose_hits
            if word_count(h.text) >= 8 or re.search(r"[.!?]$", h.text)
        ]
        corpus2 = " ".join(h.text for h in sent_like)
        grade2, asl2, nw2, ns2, _ = flesch_kincaid_grade(corpus2)

        audience = AUDIENCE.get(app) or AUDIENCE.get(ENGINE_AUDIENCE.get(app, ""), "?")
        threshold = 4 if audience == "child" else 10
        report["apps"][app] = {
            "audience": audience,
            "threshold": threshold,
            "n_strings": len(unique),
            "n_prose_strings": len(prose_hits),
            "n_sentence_like": len(sent_like),
            "total_words": n_words,
            "fk_grade_all_prose": round(grade, 2),
            "avg_sentence_len_all": round(asl, 2),
            "fk_grade_sentence_like": round(grade2, 2),
            "avg_sentence_len_sentence_like": round(asl2, 2),
            "sentence_like_words": nw2,
            "sentence_like_sentences": ns2,
            "over_threshold": (grade2 if sent_like else grade) > threshold,
            "sample_files": sorted({h.path for h in unique})[:12],
        }

    # Combined child / adult rolls including engines into guide-console
    for roll_name, apps in {
        "CHILD_facing_combined": ["discovery", "project-studio"],
        "ADULT_facing_combined": [
            "guide-console",
            "parent-guide",
            "home",
            "engine:wellbeing",
            "engine:hypothesis-store",
            "engine:motivation",
            "engine:specialization-planner",
        ],
    }.items():
        hits = []
        for a in apps:
            hits.extend(by_app.get(a, []))
        unique = []
        seen = set()
        for h in hits:
            k = h.text.lower()
            if k in seen:
                continue
            seen.add(k)
            unique.append(h)
        sent_like = [
            h
            for h in unique
            if word_count(h.text) >= 4
            and (word_count(h.text) >= 8 or re.search(r"[.!?]$", h.text))
        ]
        corpus = " ".join(h.text for h in sent_like)
        grade, asl, nw, ns, _ = flesch_kincaid_grade(corpus)
        report["apps"][roll_name] = {
            "audience": "child" if "CHILD" in roll_name else "adult",
            "threshold": 4 if "CHILD" in roll_name else 10,
            "n_strings": len(unique),
            "fk_grade_sentence_like": round(grade, 2),
            "avg_sentence_len_sentence_like": round(asl, 2),
            "sentence_like_words": nw,
            "sentence_like_sentences": ns,
            "over_threshold": grade > (4 if "CHILD" in roll_name else 10),
        }

    # Jargon search across all hits + full file content for user-facing files
    jargon_hits: dict[str, list[dict]] = defaultdict(list)
    # Search in extracted strings first (high confidence user-facing)
    for h in all_hits:
        low = h.text.lower()
        for term in SUSPECT_JARGON:
            if term.lower() in low:
                # Avoid false positive on "cell" inside "excellent" etc. — use word boundary
                if not re.search(rf"\b{re.escape(term)}\b", h.text, re.IGNORECASE):
                    # allow hyphenated variants already in list
                    continue
                jargon_hits[term].append(
                    {
                        "app": h.app,
                        "audience": AUDIENCE.get(h.app)
                        or AUDIENCE.get(ENGINE_AUDIENCE.get(h.app, ""), "?"),
                        "path": h.path,
                        "line": h.line,
                        "kind": h.kind,
                        "text": h.text[:220],
                    }
                )

    # Deduplicate jargon locations
    for term, locs in jargon_hits.items():
        dedup = []
        seen = set()
        for loc in locs:
            k = (loc["path"], loc["line"], loc["text"][:80])
            if k in seen:
                continue
            seen.add(k)
            dedup.append(loc)
        report["jargon"][term] = dedup

    # Extra jargon candidates: uncommon academic words in adult/child copy
    # Collect words that appear in user-facing text and are rare/long
    EXTRA_CANDIDATES = [
        "calibrat",
        "instrument",
        "meta-analysis",
        "correlational",
        "punitive",
        "reinforcement",
        "contingent",
        "non-contingent",
        "devaluation",
        "obsessive",
        "exhaustion",
        "setpoint",
        "counter-cyclical",
        "authenticity",
        "deliberate",
        "trajectory",
        "eminence",
        "portfolio-defining",
        "ratify",
        "disposition",
        "disposes",
        "propose",
        "surfacing",
        "evaluative",
        "voluntary",
        "durable",
        "artifact",
        "perseverance",
        "competence",
        "attribution",
        "disconfirm",
        "lifecycle",
        "hypothesis",
        "specializ",
        "ignition",
        "foundations",
        "authorship",
        "signature",
        "scaffold",
        "autonomy",
        "cadence",
        "dose",
        "deload",
        "burnout",
        "wellbeing",
        "well-being",
        "provenance",
        "attestation",
        "ledger",
        "constellation",
        "observatory",
        "synthetic",
        "ingest",
        "validator",
        "gate",
        "rung",
        "spike",
        "cell",
        "probe",
        "posture",
        "knob",
        "promote",  # UI verb may be ok
        "contest",
        "parked",
        "emerging",
        "candidate",
        "certified",
        "plannable",
        "mastery",
        "relatedness",
        "self-regulation",
        "self-advocacy",
        "producer",
        "flagship",
        "type iii",
        "type 3",
        "bounded",
        "investment-year",
        "rage to master",
        "co-engagement",
        "coengagement",
        "over-identification",
        "overvaluation",
        "conditional regard",
        "family control",
        "stretch-seeking",
        "work-mode",
        "domain",
        "mode",
        "segment",
        "crosswalk",
        "uplink",
        "teach-in",
        "teachin",
        "gadget",
        "cabin",
        "quest",
        "showtime",
        "checkpoint",
    ]
    extra: dict[str, list[dict]] = defaultdict(list)
    for h in all_hits:
        for term in EXTRA_CANDIDATES:
            if re.search(rf"\b{re.escape(term)}", h.text, re.IGNORECASE):
                extra[term].append(
                    {
                        "app": h.app,
                        "audience": AUDIENCE.get(h.app)
                        or AUDIENCE.get(ENGINE_AUDIENCE.get(h.app, ""), "?"),
                        "path": h.path,
                        "line": h.line,
                        "text": h.text[:200],
                    }
                )
    # Keep only terms with ≥1 hit that aren't purely UI chrome
    report["jargon_extra"] = {
        t: list({(x["path"], x["line"]): x for x in locs}.values())
        for t, locs in extra.items()
        if locs
    }

    # Panel density: group by (app, file stem) and sum words of unique strings
    panels: list[dict] = []
    by_panel: dict[tuple[str, str, str], list[Hit]] = defaultdict(list)
    for h in all_hits:
        # Use path stem as panel
        stem = Path(h.path).stem
        by_panel[(h.app, stem, h.path)].append(h)

    for (app, stem, path), hits in by_panel.items():
        seen = set()
        words = 0
        texts = []
        for h in hits:
            k = h.text.lower()
            if k in seen:
                continue
            seen.add(k)
            wc = word_count(h.text)
            words += wc
            texts.append(h.text)
        panels.append(
            {
                "app": app,
                "panel": stem,
                "path": path,
                "word_count": words,
                "n_strings": len(texts),
                "flagged": words > 150,
                "preview": " | ".join(texts[:3])[:240],
            }
        )
    # Section-level density for parent-guide (the whole page is one "panel" otherwise)
    pg = ROOT / "apps/parent-guide/app/page.tsx"
    if pg.exists():
        raw = pg.read_text(encoding="utf-8")
        # Split on <section id="...">
        parts = re.split(r'<section\s+id="([^"]+)"', raw)
        # parts[0]=preamble, then id, body, id, body, ...
        i = 1
        while i + 1 < len(parts):
            sec_id = parts[i]
            body = parts[i + 1]
            # cut at next section already done by split; trim at </section>
            body = body.split("</section>")[0]
            text = re.sub(r"\{/\*.*?\*/\}", " ", body, flags=re.DOTALL)
            text = re.sub(r"\{[^}\"']*?\}", " ", text)
            text = re.sub(r"</?[A-Za-z][^>]*>", " ", text)
            text = (
                text.replace("&apos;", "'")
                .replace("&quot;", '"')
                .replace("&amp;", "&")
            )
            text = re.sub(r"\s+", " ", text).strip()
            wc = word_count(text)
            panels.append(
                {
                    "app": "parent-guide",
                    "panel": f"section:{sec_id}",
                    "path": str(pg),
                    "word_count": wc,
                    "n_strings": 1,
                    "flagged": wc > 150,
                    "preview": text[:240],
                }
            )
            i += 2

    panels.sort(key=lambda p: -p["word_count"])
    report["panels"] = panels
    report["panels_over_150"] = [p for p in panels if p["flagged"]]

    # Longest sentences across all user-facing prose
    sentences: list[dict] = []
    for h in all_hits:
        for s in split_sentences(h.text):
            wc = word_count(s)
            if wc < 8:
                continue
            sentences.append(
                {
                    "words": wc,
                    "text": s,
                    "app": h.app,
                    "audience": AUDIENCE.get(h.app)
                    or AUDIENCE.get(ENGINE_AUDIENCE.get(h.app, ""), "?"),
                    "path": h.path,
                    "line": h.line,
                    "kind": h.kind,
                }
            )
    # Dedup by text
    dedup_s = []
    seen_s = set()
    for s in sorted(sentences, key=lambda x: -x["words"]):
        k = s["text"].lower()
        if k in seen_s:
            continue
        seen_s.add(k)
        dedup_s.append(s)
    report["longest"] = dedup_s[:40]
    report["longest_over_25"] = [s for s in dedup_s if s["words"] > 25][:50]
    report["longest_over_40"] = [s for s in dedup_s if s["words"] > 40]

    out_path = ROOT / "scripts" / "readability_audit_report.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    # Human-readable summary to stdout
    print("=" * 72)
    print("READABILITY AUDIT — PassionLab")
    print("=" * 72)
    for app, stats in report["apps"].items():
        flag = "⚠ OVER" if stats.get("over_threshold") else "ok"
        print(
            f"\n[{app}] audience={stats.get('audience')} threshold=grade {stats.get('threshold')}  [{flag}]"
        )
        print(
            f"  strings={stats.get('n_strings')} prose={stats.get('n_prose_strings', '?')} "
            f"sentence-like={stats.get('n_sentence_like', stats.get('sentence_like_sentences'))}"
        )
        if "fk_grade_sentence_like" in stats:
            print(
                f"  FK grade (sentence-like): {stats['fk_grade_sentence_like']}  "
                f"avg sent len: {stats['avg_sentence_len_sentence_like']}  "
                f"words: {stats.get('sentence_like_words')}"
            )
        if "fk_grade_all_prose" in stats:
            print(
                f"  FK grade (all prose≥4w):  {stats['fk_grade_all_prose']}  "
                f"avg sent len: {stats['avg_sentence_len_all']}  "
                f"words: {stats.get('total_words')}"
            )

    print("\n" + "=" * 72)
    print("PANELS OVER 150 WORDS")
    print("=" * 72)
    for p in report["panels_over_150"][:30]:
        print(f"  {p['word_count']:4d}w  [{p['app']}] {p['panel']}  {p['path']}")

    print("\n" + "=" * 72)
    print("TOP 20 LONGEST SENTENCES")
    print("=" * 72)
    for i, s in enumerate(report["longest"][:20], 1):
        print(f"\n{i}. ({s['words']} words) [{s['app']}] {s['path']}:{s['line']}")
        print(f"   {s['text']}")

    print("\n" + "=" * 72)
    print("JARGON HITS (suspect list, user-facing strings only)")
    print("=" * 72)
    for term in SUSPECT_JARGON:
        locs = report["jargon"].get(term, [])
        if not locs:
            continue
        audiences = sorted({x["audience"] for x in locs})
        apps = sorted({x["app"] for x in locs})
        print(f"\n  «{term}»  n={len(locs)}  apps={apps}  audiences={audiences}")
        for loc in locs[:5]:
            print(f"    - {loc['path']}:{loc['line']} ({loc['audience']}) {loc['text'][:120]}")

    print(f"\n\nFull JSON written to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
