/**
 * The loop's per-turn suite: shoot every canonical framing at fixed params, run all gates
 * (image + semantic + fps), composite each against its reference, and verify determinism by
 * re-shooting the hero framing and diffing. Prints a pass/fail table; exits nonzero on any fail.
 * Ported from ~/code/test/tools/battery.ts; interior framings + semantic + determinism gates.
 *
 *   pnpm battery
 *
 * NOTE: cam poses + ref filenames are refined as the scene evolves (LAAS pattern). They are
 * placeholders until the scaffold lands real geometry + the reference/ set is finalized.
 */
import { writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { meanAbsDiff, sideBySide } from "./compare";
import {
  type GateOpts,
  type GateResult,
  gateCatPresent,
  gateFireLit,
  gateFpsFloor,
  runImageGates,
} from "./gates";
import { PROJECT_ROOT } from "./launch";
import { shoot } from "./shoot";
import type { CabinStats } from "./types";

interface Framing {
  name: string;
  seed: string;
  cam: string;
  ref: string;
  assert?: GateOpts;
}

// Fixed poses per framing. cam = x,y,z,yaw,pitch,fov. Poses are inside the room (|x|<3.5, |z|<3.0);
// yaw=0 looks -Z (toward the fireplace wall). Refined as the scene evolves.
const FRAMINGS: Framing[] = [
  // stand near the +Z wall, look at the hearth on the -Z wall
  {
    name: "hero",
    seed: "1337",
    cam: "0,1.6,2.4,0,-0.05,60",
    ref: "reference/01_cabin_fireplace_dusk.jpg",
    assert: { fire: true },
  },
  // near centre-left, look at the desk on the -X wall
  {
    name: "desk",
    seed: "1337",
    cam: "-1.2,1.5,-0.6,1.57,-0.12,58",
    ref: "reference/06_desk_nook_coding.jpg",
  },
  // near centre-right, look at the window on the +X wall
  {
    name: "window",
    seed: "1337",
    cam: "1.4,1.6,0.4,-1.57,-0.02,62",
    ref: "reference/05_window_daylight_logcabin.jpg",
  },
  // left-front corner, wide, look diagonally to catch fire (-Z) and window (+X)
  {
    name: "wide",
    seed: "1337",
    cam: "-2.6,1.95,2.4,-0.785,-0.06,80",
    ref: "reference/02_workshop_workbench_tools.jpg",
    assert: { fire: true, warmCool: true },
  },
  // close-up on the cat + hearth
  {
    name: "detail",
    seed: "1337",
    cam: "0.7,1.05,-0.2,0.1,-0.45,48",
    ref: "reference/04_cat_curled_sleeping.jpg",
    assert: { fire: true },
  },
];

async function main(): Promise<void> {
  const report: Array<{
    framing: string;
    gates: GateResult[];
    stats: CabinStats | null;
    error: string | null;
  }> = [];

  for (const f of FRAMINGS) {
    const out = `shots/${f.name}.png`;
    const r = await shoot({
      seed: f.seed,
      cam: f.cam,
      preset: "high",
      w: "1280",
      h: "720",
      out,
      stats: `shots/${f.name}.json`,
      settle: "16",
    });
    if (r.error) {
      report.push({ framing: f.name, gates: [], stats: null, error: r.error });
      continue;
    }
    const gates = await runImageGates(resolve(PROJECT_ROOT, out), f.assert);
    if (r.stats) {
      gates.push(gateFireLit(r.stats), gateCatPresent(r.stats), gateFpsFloor(r.stats.fps));
    }
    const refPath = resolve(PROJECT_ROOT, f.ref);
    if (existsSync(refPath)) {
      await sideBySide(out, f.ref, `shots/cmp_${f.name}.png`).catch((e) =>
        console.warn(`[battery] compare skipped for ${f.name}: ${String(e)}`),
      );
    } else {
      console.warn(`[battery] no reference at ${f.ref} — skipping side-by-side`);
    }
    report.push({ framing: f.name, gates, stats: r.stats, error: null });
  }

  // determinism: re-shoot hero, diff against the first hero shot.
  const hero = FRAMINGS[0]!;
  const r2 = await shoot({
    seed: hero.seed,
    cam: hero.cam,
    preset: "high",
    w: "1280",
    h: "720",
    out: "shots/hero_2.png",
    settle: "16",
  });
  let determinism: GateResult;
  if (r2.error) {
    determinism = {
      name: "determinism",
      pass: false,
      value: Number.POSITIVE_INFINITY,
      threshold: "< 1.0 mean/ch",
    };
  } else {
    const d = await meanAbsDiff("shots/hero.png", "shots/hero_2.png");
    determinism = {
      name: "determinism",
      pass: d < 1.0,
      value: +d.toFixed(3),
      threshold: "< 1.0 mean/ch",
    };
  }

  // report table
  let allPass = true;
  console.log("\n===== BATTERY REPORT =====");
  for (const row of report) {
    if (row.error) {
      allPass = false;
      console.log(`\n${row.framing}: ERROR ${row.error.split("\n")[0]}`);
      continue;
    }
    const info = row.stats
      ? `${row.stats.fps}fps ${row.stats.triangles}tris ${row.stats.memMB}MB`
      : "";
    console.log(`\n${row.framing}  (${info})`);
    for (const g of row.gates) {
      if (!g.pass) allPass = false;
      const extra = g.detail ? `  ${g.detail}` : "";
      console.log(
        `  ${g.pass ? "PASS" : "FAIL"}  ${g.name.padEnd(18)} ${String(g.value).padStart(9)}  ${g.threshold}${extra}`,
      );
    }
  }
  if (!determinism.pass) allPass = false;
  console.log(
    `\ndeterminism  ${determinism.pass ? "PASS" : "FAIL"}  ${determinism.value}  ${determinism.threshold}`,
  );

  writeFileSync(
    resolve(PROJECT_ROOT, "shots/battery-report.json"),
    JSON.stringify({ report, determinism }, null, 2),
  );
  console.log(`\n===== ${allPass ? "ALL GATES PASS" : "SOME GATES FAILED"} =====\n`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e: unknown) => {
  console.error("[battery] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
