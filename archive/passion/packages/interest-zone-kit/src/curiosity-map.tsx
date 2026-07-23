import type { CuriosityMapReturnState, CuriosityMapView, ZoneId } from "@gt100k/interest-lab-view";
import { CABIN, MAP_COLOR_SCRIPT } from "@gt100k/interest-lab-view";
import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";

export interface CuriosityMapProps {
  view: CuriosityMapView;
  activeZoneId: ZoneId | null;
  dayOffset: number;
  onEnterZone: (zoneId: ZoneId) => void;
  onSetDayOffset: (dayOffset: number) => void;
  /** When true, all ambient motion holds still (a calm frame, never broken). Defaults to false;
   * the scoped stylesheet also honors the OS `prefers-reduced-motion` query unconditionally. */
  reducedMotion?: boolean;
}

const TIME_LAPSE_STEPS = [
  { dayOffset: 0, label: "Right now" },
  { dayOffset: 7, label: "A week later…" },
  { dayOffset: 30, label: "A month later…" },
] as const;

const nextTimeLapseStep = (dayOffset: number) => {
  const currentIndex = TIME_LAPSE_STEPS.findIndex((step) => step.dayOffset === dayOffset);
  return TIME_LAPSE_STEPS[(currentIndex + 1 + TIME_LAPSE_STEPS.length) % TIME_LAPSE_STEPS.length]!;
};

const currentTimeLapseLabel = (dayOffset: number) =>
  TIME_LAPSE_STEPS.find((step) => step.dayOffset === dayOffset)?.label ?? "Right now";

// One flat palette for the map layers: scene colors (sky/ground/path/shadow) + cabin material
// tints (wood/plaster/amber/dusk). Keys are disjoint, so the merge is lossless.
const C = { ...MAP_COLOR_SCRIPT, ...CABIN };

type Craft = "music" | "code" | "art" | "generic";

const craftFromGlyph = (glyph: string): Craft => {
  if (glyph.startsWith("music")) return "music";
  if (glyph.startsWith("code")) return "code";
  if (glyph.startsWith("art")) return "art";
  return "generic";
};

/** Nudge a hex color toward black (amt<0) or white (amt>0) — for roof shading without a bundler. */
const shade = (hex: string, amt: number): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
};

// The three domain cabins sit as a gentle front arc below the Lodge; the winding path threads
// between them (positions in scene %; front-center is nearest so it reads largest). Extra zones
// cycle these lots with a slight lateral drift, so the hamlet never grid-locks.
const CABIN_LOTS = [
  { left: 15, top: 66, scale: 1.02, z: 3 },
  { left: 50, top: 88, scale: 1.16, z: 6 },
  { left: 85, top: 63, scale: 0.96, z: 2 },
] as const;

const lotFor = (index: number) => {
  const base = CABIN_LOTS[index % CABIN_LOTS.length]!;
  const wrap = Math.floor(index / CABIN_LOTS.length);
  return { ...base, left: base.left + wrap * 4, top: base.top - wrap * 3 };
};

// A sparse firefly/mote field — fixed positions + phases (no render-time randomness, so SSR and
// the client agree). Density thickens toward dusk via the [data-day-offset] scene selectors.
const FIREFLIES = [
  { left: 22, top: 40, d: 0, dur: 7.5 },
  { left: 38, top: 30, d: 1.6, dur: 8.5 },
  { left: 61, top: 36, d: 0.7, dur: 6.8 },
  { left: 74, top: 28, d: 2.4, dur: 9.2 },
  { left: 47, top: 44, d: 3.1, dur: 7.1 },
  { left: 30, top: 52, d: 1.1, dur: 8.9 },
  { left: 84, top: 46, d: 2.0, dur: 6.4 },
  { left: 55, top: 25, d: 3.6, dur: 9.8 },
  { left: 12, top: 48, d: 0.4, dur: 7.9 },
] as const;

function CraftMark({ craft }: { craft: Craft }) {
  // A tiny high-contrast glyph on each hanging sign — a fourth identity channel beyond hue,
  // silhouette, and label (§11: never color-only). Drawn dark on the amber plaque.
  if (craft === "music") {
    return (
      <g fill="#4A3320">
        <circle cx="42" cy="52" r="3.1" />
        <rect x="44.2" y="38" width="1.7" height="14" />
        <path d="M44.2 38 L50 36.4 L50 40 L44.2 41.6 Z" />
      </g>
    );
  }
  if (craft === "code") {
    return (
      <g fill="none" stroke="#37503E" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M43 40 L38 47 L43 54" />
        <path d="M53 40 L58 47 L53 54" />
      </g>
    );
  }
  if (craft === "art") {
    return (
      <g fill="#3B3560">
        <rect x="46.4" y="37" width="3.2" height="12" rx="1.4" transform="rotate(20 48 43)" />
        <path d="M40.5 52 q3-5 7-3 l-1.6 3.4 q-3 1.5-5.4-.4 Z" />
      </g>
    );
  }
  return <circle cx="47" cy="47" r="3" fill="#4A3320" />;
}

function CabinSprite({ hue, craft }: { hue: string; craft: Craft }) {
  const roof = hue;
  const roofDark = shade(hue, -0.24);
  const wall = C.plaster;
  const wallShade = shade(C.plaster, -0.12);
  const gid = `cab-${craft}`;
  return (
    <svg
      className="cab__svg"
      viewBox="0 0 100 96"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <linearGradient id={`${gid}-win`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.candle} />
          <stop offset="0.55" stopColor={C.windowSpill} />
          <stop offset="1" stopColor={C.fireSpark} />
        </linearGradient>
        <radialGradient id={`${gid}-spill`} cx="0.5" cy="0.3" r="0.75">
          <stop offset="0" stopColor={C.windowSpill} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.windowSpill} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* warm light spilling from the door onto the ground */}
      <ellipse className="cab__spill" cx="50" cy="82" rx="30" ry="9" fill={`url(#${gid}-spill)`} />

      {/* walls */}
      <path d="M28 50 h44 v30 h-44 Z" fill={wall} />
      <path d="M28 50 h44 v6 h-44 Z" fill={wallShade} opacity="0.55" />
      <path d="M28 64 h44" stroke={wallShade} strokeWidth="0.8" opacity="0.5" />
      <path d="M28 72 h44" stroke={wallShade} strokeWidth="0.8" opacity="0.4" />

      {/* roof (hue) with a lit ridge + shaded underside */}
      <path d="M22 52 L50 24 L78 52 Z" fill={roof} />
      <path d="M50 24 L78 52 L72 52 Z" fill={roofDark} opacity="0.7" />
      <path d="M22 52 L50 24 L52 26 L26 52 Z" fill={shade(hue, 0.22)} opacity="0.85" />
      <path d="M22 52 h56" stroke={roofDark} strokeWidth="1.4" opacity="0.5" />

      {/* door */}
      <path d="M45 62 q0-4 5-4 q5 0 5 4 v18 h-10 Z" fill={C.leather} />
      <circle cx="53" cy="71" r="0.9" fill={C.brass} />

      {/* warm window — the amber that also burns in the Lodge */}
      <g className="cab__window">
        <rect x="32" y="60" width="10" height="11" rx="1.4" fill={`url(#${gid}-win)`} />
        <path d="M37 60 v11 M32 65.5 h10" stroke={C.leather} strokeWidth="0.9" opacity="0.7" />
      </g>

      {/* per-craft roof feature — each gives a DISTINCT roofline silhouette so the craft is
          nameable from shape alone (§11 four-channel identity; not a cloned box). */}
      {craft === "music" ? (
        <g>
          {/* stout chimney + a gramophone-horn cupola catching the last sun */}
          <rect x="62" y="32" width="7" height="14" rx="1" fill={C.woodWalnut} />
          <rect x="61" y="31" width="9" height="3" rx="1" fill={roofDark} />
          <path d="M48 30 q1-8 8-9 q6-1 8 3 l-3 2 q-1-2-4-1 q-5 1-5 6 Z" fill={C.brass} />
          <ellipse cx="61" cy="24" rx="4.6" ry="2.4" fill={C.lantern} transform="rotate(-32 61 24)" />
        </g>
      ) : null}
      {craft === "code" ? (
        <g>
          {/* prominent glass gable catching light + a cool tool-glint + a gear weathervane */}
          <path d="M28 50 L50 27 L72 50 Z" fill={C.duskSkylight} opacity="0.34" />
          <path d="M33 48 L50 31 L43 48 Z" fill="#FFFFFF" opacity="0.4" />
          <line x1="50" y1="27" x2="50" y2="16" stroke={C.woodWalnut} strokeWidth="1.4" />
          <circle cx="50" cy="14" r="3.2" fill="none" stroke={C.verdigris} strokeWidth="1.6" />
          <path d="M50 14 l3 -1 M50 14 l-3 1 M50 14 l1 3 M50 14 l-1 -3" stroke={C.verdigris} strokeWidth="1.4" />
          <circle cx="66" cy="46" r="2" fill={C.verdigris} opacity="0.95" />
        </g>
      ) : null}
      {craft === "art" ? (
        <g>
          {/* big north-light skylight breaking the roof plane, glowing periwinkle at dusk */}
          <path d="M50 46 L64 32 L74 40 L60 54 Z" fill={C.duskSkylight} opacity="0.9" />
          <path d="M50 46 L64 32 L67 34 L53 48 Z" fill="#FFFFFF" opacity="0.45" />
          <path d="M57 39 L67 39 M55 43 L65 43" stroke={C.duskWindow} strokeWidth="0.8" opacity="0.7" />
        </g>
      ) : null}

      {/* hanging sign on a bracket under the eave */}
      <g className="cab__sign">
        <path d="M74 50 h9" stroke={C.woodWalnut} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="79" y1="50" x2="79" y2="55" stroke={C.woodWalnut} strokeWidth="1" />
        <rect x="72" y="55" width="14" height="12" rx="2" fill={C.parchment} stroke={C.woodOak} strokeWidth="1.2" />
        <g transform="translate(32 8) scale(0.9)">
          <CraftMark craft={craft} />
        </g>
      </g>
    </svg>
  );
}

export function CuriosityMap({
  view,
  activeZoneId,
  dayOffset,
  onEnterZone,
  onSetDayOffset,
  reducedMotion = false,
}: CuriosityMapProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rovingIndex = Math.min(focusedIndex, Math.max(view.buildings.length - 1, 0));
  const nextPhase = nextTimeLapseStep(dayOffset);

  const moveFocus = (index: number, direction: -1 | 1) => {
    if (view.buildings.length === 0) {
      return;
    }

    const nextIndex = (index + direction + view.buildings.length) % view.buildings.length;
    setFocusedIndex(nextIndex);
    buttonRefs.current[nextIndex]?.focus();
  };

  const onBuildingKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }

    event.preventDefault();
    moveFocus(index, event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1);
  };

  return (
    <section
      className="clearing"
      aria-label="Curiosity Map"
      data-primary-surface="curiosity-map"
      data-day-offset={dayOffset}
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      {/* Inject via dangerouslySetInnerHTML: a `<style>{text}</style>` child node gets HTML-escaped
          differently on the server (`&quot;`) than the client (`"`), which trips React hydration. */}
      <style dangerouslySetInnerHTML={{ __html: CLEARING_CSS }} />

      <header className="clearing__head">
        <p className="clearing__eyebrow">Your clearing</p>
        <h2 className="clearing__title">The workshops at golden hour</h2>
      </header>

      <div className="clearing__scene" role="presentation">
        {/* sky + low sun bloom */}
        <div className="clearing__sun" aria-hidden="true" />

        {/* hazed pine treeline */}
        <svg className="clearing__treeline" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <g className="clearing__pines" fill={C.treeline}>
            {Array.from({ length: 22 }, (_, i) => {
              const x = 20 + i * 55;
              const h = 92 + ((i * 37) % 46);
              return (
                <path key={i} d={`M${x} 240 L${x + 26} ${240 - h} L${x + 52} 240 Z`} opacity={0.72 - (i % 3) * 0.08} />
              );
            })}
          </g>
        </svg>

        {/* lit ground plate, winding path, pond + footbridge */}
        <svg className="clearing__ground" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id="clr-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.groundShade} />
              <stop offset="0.4" stopColor={C.groundLit} />
              <stop offset="1" stopColor={shade(C.groundLit, 0.06)} />
            </linearGradient>
            <radialGradient id="clr-pond" cx="0.5" cy="0.4" r="0.7">
              <stop offset="0" stopColor={shade(C.waterPond, 0.14)} />
              <stop offset="1" stopColor={C.waterPond} />
            </radialGradient>
          </defs>
          <path d="M0 150 Q300 96 620 132 T1200 120 L1200 520 L0 520 Z" fill="url(#clr-ground)" />
          {/* grass tufts */}
          <g fill={C.grassTuft} opacity="0.85">
            {Array.from({ length: 30 }, (_, i) => {
              const x = 30 + i * 40;
              const y = 210 + ((i * 53) % 250);
              return <path key={i} d={`M${x} ${y} q3 -12 6 0 q3 -14 6 0 q3 -12 6 0 Z`} opacity={0.5 + (i % 3) * 0.16} />;
            })}
          </g>
          {/* winding warm dirt path up to the Lodge, with two branches */}
          <path
            d="M520 520 C 470 420 640 360 600 300 C 566 250 560 220 600 196"
            fill="none"
            stroke={C.path}
            strokeWidth="78"
            strokeLinecap="round"
            opacity="0.96"
          />
          <path d="M600 300 C 420 300 300 340 190 372" fill="none" stroke={C.path} strokeWidth="52" strokeLinecap="round" opacity="0.9" />
          <path d="M600 300 C 780 300 900 320 1010 344" fill="none" stroke={C.path} strokeWidth="50" strokeLinecap="round" opacity="0.9" />
          <path
            d="M520 520 C 470 420 640 360 600 300 C 566 250 560 220 600 196"
            fill="none"
            stroke={shade(C.path, 0.14)}
            strokeWidth="30"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* pond + footbridge, bottom-right */}
          <ellipse cx="1055" cy="452" rx="150" ry="60" fill="url(#clr-pond)" />
          <ellipse cx="1010" cy="438" rx="46" ry="15" fill={C.waterGlint} opacity="0.6" />
          <g stroke={C.pathPlank} strokeWidth="7" strokeLinecap="round">
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={946 + i * 20} y1="470" x2={946 + i * 20} y2="500" opacity="0.92" />
            ))}
            <line x1="940" y1="474" x2="1050" y2="474" strokeWidth="4" opacity="0.7" />
            <line x1="940" y1="498" x2="1050" y2="498" strokeWidth="4" opacity="0.7" />
          </g>
        </svg>

        {/* the Lodge + its lit hearth — "you are here" (the one focal warm mass) */}
        <div className="clearing__lodge" aria-hidden="true">
          <div className="lodge__shadow" />
          <svg className="lodge__svg" viewBox="0 0 160 130" role="presentation">
            <defs>
              <radialGradient id="lodge-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={C.hearthGlow} stopOpacity="0.95" />
                <stop offset="1" stopColor={C.hearthGlow} stopOpacity="0" />
              </radialGradient>
              <linearGradient id="lodge-win" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C.candle} />
                <stop offset="1" stopColor={C.fireSpark} />
              </linearGradient>
            </defs>
            <ellipse className="lodge__hearth" cx="80" cy="86" rx="70" ry="34" fill="url(#lodge-glow)" />
            {/* body */}
            <path d="M34 64 h92 v50 h-92 Z" fill={C.woodHoney} />
            <path d="M34 64 h92 v8 h-92 Z" fill={shade(C.woodHoney, -0.14)} opacity="0.6" />
            {/* roof */}
            <path d="M24 66 L80 26 L136 66 Z" fill={C.terracotta} />
            <path d="M80 26 L136 66 L128 66 Z" fill={shade(C.terracotta, -0.22)} opacity="0.7" />
            <path d="M24 66 L80 26 L83 28 L30 66 Z" fill={shade(C.terracotta, 0.2)} opacity="0.85" />
            {/* chimney */}
            <rect x="104" y="36" width="12" height="20" rx="1.5" fill={C.woodWalnut} />
            {/* big warm windows + door */}
            <rect x="46" y="80" width="18" height="20" rx="2" fill="url(#lodge-win)" />
            <rect x="96" y="80" width="18" height="20" rx="2" fill="url(#lodge-win)" />
            <path d="M72 82 q0-6 8-6 q8 0 8 6 v32 h-16 Z" fill={C.leather} />
            <circle cx="85" cy="98" r="1.4" fill={C.brass} />
          </svg>
          {/* rising hearth smoke */}
          <div className="lodge__smoke" aria-hidden="true">
            <span style={{ ["--d" as string]: "0s" }} />
            <span style={{ ["--d" as string]: "1.3s" }} />
            <span style={{ ["--d" as string]: "2.6s" }} />
            <span style={{ ["--d" as string]: "3.9s" }} />
          </div>
          <p className="lodge__here">Home · you are here</p>
        </div>

        {/* the domain cabins — real focusable buttons along the path */}
        <div className="clearing__cabins">
          {view.buildings.map((building, index) => {
            const lot = lotFor(index);
            const craft = craftFromGlyph(building.glyph);
            const isActive = activeZoneId === building.zoneId;
            const style: CSSProperties = {
              left: `${lot.left}%`,
              top: `${lot.top}%`,
              zIndex: lot.z,
              ["--cabin-scale" as string]: String(lot.scale),
              ["--cabin-hue" as string]: building.hue,
            };
            return (
              <button
                key={building.zoneId}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                type="button"
                className="cabin"
                aria-label={building.ariaLabel}
                aria-pressed={isActive}
                data-return-state={building.returnState}
                data-active={isActive ? "true" : undefined}
                data-unfinished={building.unfinished > 0 ? "true" : undefined}
                tabIndex={index === rovingIndex ? 0 : -1}
                style={style}
                onClick={() => onEnterZone(building.zoneId)}
                onFocus={() => setFocusedIndex(index)}
                onKeyDown={(event) => onBuildingKeyDown(event, index)}
              >
                <span className="cabin__shadow" aria-hidden="true" />
                <span className="cabin__return" aria-hidden="true" />
                <span className="cabin__body">
                  <CabinSprite hue={building.hue} craft={craft} />
                  <span className="cabin__glint" aria-hidden="true" />
                </span>
                <span className="cabin__plate">
                  <strong className="cabin__label">{building.label}</strong>
                  <span className="cabin__verb">{building.enterVerb} →</span>
                </span>
                {isActive ? <span className="cabin__footprint" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>

        {/* drifting fireflies / motes (thicken toward dusk) */}
        <div className="clearing__fireflies" aria-hidden="true">
          {FIREFLIES.map((f, i) => (
            <span
              key={i}
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                ["--d" as string]: `${f.d}s`,
                ["--dur" as string]: `${f.dur}s`,
              }}
            />
          ))}
        </div>

        {/* a cat ambling slowly across the clearing */}
        <div className="clearing__cat" aria-hidden="true">
          <svg viewBox="0 0 40 26" role="presentation">
            <path d="M6 22 q-2-9 3-11 q2-6 4-1 q3-2 6 0 q2-5 4 1 q6 2 4 11 Z" fill={C.woodWalnut} />
            <path d="M9 11 l-1-4 l4 2 Z M17 9 l1-4 l3 3 Z" fill={C.woodWalnut} />
            <path d="M30 20 q7-2 6 3" fill="none" stroke={C.woodWalnut} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="11" cy="14" r="0.9" fill={C.lantern} />
          </svg>
        </div>
      </div>

      {/* time-lapse — a labeled, calm control that quiets the clearing toward dusk */}
      <div className="clearing__timelapse">
        <span className="clearing__phase">
          <span className="clearing__phase-dot" aria-hidden="true" />
          Golden hour · {currentTimeLapseLabel(dayOffset)}
        </span>
        <button
          type="button"
          className="clearing__step"
          aria-label={nextPhase.label}
          onClick={() => onSetDayOffset(nextPhase.dayOffset)}
        >
          {nextPhase.label}
        </button>
      </div>
    </section>
  );
}

const CLEARING_CSS = `
.clearing { --sky-top:${C.skyTop}; --sky-low:${C.skyLow}; --path:${C.path};
  --shadow:${C.softShadow}; --firefly:${C.firefly}; --smoke:${C.chimneySmoke};
  --hearth:${C.hearthGlow}; --spill:${C.windowSpill};
  display:flex; flex-direction:column; gap:0.75rem; }
.clearing__head { display:flex; flex-direction:column; gap:0.1rem; }
.clearing__eyebrow { margin:0; font-size:0.72rem; letter-spacing:0.14em; text-transform:uppercase;
  font-weight:700; color:${C.leafRust}; }
.clearing__title { margin:0; font-size:1.32rem; line-height:1.15; font-weight:650;
  color:${C.woodCocoa}; }

.clearing__scene { position:relative; width:100%; aspect-ratio:16/8.3; min-height:340px;
  border-radius:1.25rem; overflow:hidden; isolation:isolate;
  background:linear-gradient(180deg, var(--sky-top) 0%, #FBDDA6 34%, var(--sky-low) 68%, #EFA268 100%);
  box-shadow: 0 1px 0 rgb(255 255 255 / 55%) inset, 0 26px 60px -34px rgb(74 51 32 / 55%),
    0 2px 0 rgb(74 51 32 / 12%);
  transition: filter 900ms ease; }
.clearing__sun { position:absolute; left:8%; top:1%; width:46%; height:56%;
  background:radial-gradient(circle at 40% 38%, rgb(255 238 194 / 96%), rgb(255 209 133 / 52%) 34%, transparent 70%);
  z-index:0; }
.clearing__treeline { position:absolute; inset:auto 0 42% 0; width:100%; height:34%; z-index:1;
  filter:drop-shadow(0 6px 10px rgb(74 51 32 / 22%)); transform-origin:bottom center; }
.clearing__pines { transform-box:fill-box; transform-origin:bottom center;
  animation: clr-sway 9s ease-in-out infinite; }
.clearing__ground { position:absolute; inset:40% 0 0 0; width:100%; height:60%; z-index:1; }

.clearing__lodge { position:absolute; left:50%; top:24%; width:15%; transform:translate(-50%,-50%);
  z-index:4; }
.lodge__svg { width:100%; height:auto; display:block;
  filter:drop-shadow(0 8px 10px rgb(74 51 32 / 28%)); }
.lodge__shadow { position:absolute; left:44%; bottom:3%; width:96%; height:20%;
  background:radial-gradient(closest-side, var(--shadow) 0%, transparent 76%); opacity:0.42;
  transform:translateX(6%) skewX(40deg) scaleY(0.8); filter:blur(1.5px); z-index:-1; }
.lodge__hearth { animation: clr-hearth 4.5s ease-in-out infinite; transform-origin:center;
  transform-box:fill-box; }
.lodge__here { position:absolute; left:50%; top:104%; transform:translateX(-50%); white-space:nowrap;
  margin:0; font-size:0.7rem; font-weight:650; letter-spacing:0.02em; color:${C.woodCocoa};
  background:rgb(250 238 210 / 78%); padding:0.12rem 0.5rem; border-radius:999px;
  box-shadow:0 1px 0 rgb(255 255 255 / 6%) inset; }
.lodge__smoke { position:absolute; left:66%; top:22%; width:10%; height:40%; z-index:6; }
.lodge__smoke span { position:absolute; bottom:0; left:0; width:0.7rem; height:0.7rem;
  border-radius:999px; background:var(--smoke); opacity:0; filter:blur(2px);
  animation: clr-smoke 5.4s linear infinite; animation-delay:var(--d); }

.clearing__cabins { position:absolute; inset:0; z-index:4; }
.cabin { position:absolute; transform:translate(-50%,-100%) scale(var(--cabin-scale,1));
  transform-origin:bottom center; width:9.6rem; max-width:34%;
  display:flex; flex-direction:column; align-items:center; gap:0.28rem;
  background:none; border:0; padding:0; margin:0; cursor:pointer;
  font:inherit; color:${C.woodCocoa}; -webkit-tap-highlight-color:transparent;
  transition: transform 260ms cubic-bezier(.2,.8,.25,1), filter 260ms ease; }
.cabin__shadow { position:absolute; left:60%; bottom:2.5rem; width:104%; height:1.9rem;
  background:radial-gradient(closest-side, var(--shadow) 0%, transparent 74%);
  opacity:0.44; transform:translateX(6%) skewX(42deg) scaleY(0.62); filter:blur(1.6px);
  z-index:0; pointer-events:none; }
.cabin__body { position:relative; width:100%; z-index:1; }
.cab__svg { width:100%; height:auto; display:block;
  filter:drop-shadow(0 6px 7px rgb(74 51 32 / 26%)); }
.cab__window { animation: clr-flicker 3.6s ease-in-out infinite; transform-origin:center; }
.cabin__return { position:absolute; left:50%; top:38%; width:64%; height:52%;
  transform:translateX(-50%); border-radius:999px; z-index:0; opacity:0; pointer-events:none; }
.cabin[data-return-state="voluntary-return"] .cabin__return {
  background:radial-gradient(circle, rgb(255 158 94 / 55%), transparent 68%);
  opacity:1; animation: clr-halo 3.8s ease-in-out infinite; }
.cabin[data-return-state="prompted-return"] .cabin__return {
  background:radial-gradient(circle, rgb(124 147 184 / 40%), transparent 70%); opacity:0.8; }
.cabin[data-return-state="explored"] .cabin__return {
  background:radial-gradient(circle, rgb(255 216 138 / 34%), transparent 72%);
  opacity:1; animation: clr-shimmer 6s ease-out infinite; }
.cabin[data-return-state="new"] .cabin__body { filter:saturate(0.92) brightness(0.98); }
.cabin__glint { position:absolute; left:34%; top:62%; width:0.5rem; height:0.5rem; border-radius:999px;
  background:var(--spill); box-shadow:0 0 0.5rem 0.15rem rgb(255 192 138 / 75%);
  opacity:0; z-index:2; pointer-events:none; }
.cabin[data-unfinished="true"] .cabin__glint { opacity:1; animation: clr-glint 2.8s ease-in-out infinite; }
.cabin__footprint { position:absolute; left:50%; bottom:1.4rem; width:1.4rem; height:0.5rem;
  transform:translateX(-50%); border-radius:999px; z-index:2;
  background:radial-gradient(closest-side, rgb(255 209 133 / 85%), transparent 78%); }
.cabin__plate { display:flex; flex-direction:column; align-items:center; gap:0.05rem;
  background:rgb(250 238 210 / 90%); padding:0.2rem 0.6rem 0.28rem; border-radius:0.7rem;
  box-shadow:0 1px 0 rgb(255 255 255 / 55%) inset, 0 8px 18px -12px rgb(74 51 32 / 55%);
  z-index:2; }
.cabin__label { font-size:0.9rem; font-weight:700; line-height:1.1; color:${C.woodCocoa};
  letter-spacing:-0.01em; }
.cabin__verb { font-size:0.72rem; font-weight:600; color:${C.leafRust}; letter-spacing:0.01em; }
.cabin:hover, .cabin:focus-visible { outline:none;
  transform:translate(-50%,-100%) scale(calc(var(--cabin-scale,1) * 1.045)); }
.cabin:focus-visible .cabin__plate { box-shadow:0 0 0 3px ${C.terracotta}, 0 8px 18px -12px rgb(74 51 32 / 55%); }
.cabin:hover .cab__window, .cabin:focus-visible .cab__window { filter:brightness(1.12); }

.clearing__fireflies { position:absolute; inset:0; z-index:6; pointer-events:none; }
.clearing__fireflies span { position:absolute; width:0.34rem; height:0.34rem; border-radius:999px;
  background:var(--firefly); box-shadow:0 0 0.4rem 0.12rem rgb(255 217 138 / 70%);
  opacity:0; animation: clr-fly var(--dur,8s) ease-in-out infinite; animation-delay:var(--d,0s); }
.clearing__cat { position:absolute; left:0; bottom:12%; width:3.1rem; z-index:5; pointer-events:none;
  animation: clr-cat 34s linear infinite; filter:drop-shadow(0 3px 3px rgb(74 51 32 / 28%)); }
.clearing__cat svg { width:100%; height:auto; display:block; }

.clearing__timelapse { display:flex; align-items:center; justify-content:space-between; gap:0.75rem;
  flex-wrap:wrap; }
.clearing__phase { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem;
  font-weight:600; color:${C.woodWalnut}; }
.clearing__phase-dot { width:0.5rem; height:0.5rem; border-radius:999px; background:var(--hearth);
  box-shadow:0 0 0.4rem 0.1rem rgb(255 158 94 / 65%); }
.clearing__step { font:inherit; font-size:0.82rem; font-weight:650; color:${C.woodCocoa};
  background:linear-gradient(180deg, #FFE7BE, ${C.windowSpill}); border:1px solid rgb(181 98 58 / 45%);
  padding:0.4rem 0.9rem; border-radius:999px; cursor:pointer;
  box-shadow:0 1px 0 rgb(255 255 255 / 65%) inset, 0 6px 14px -8px rgb(74 51 32 / 55%);
  transition: transform 160ms ease, filter 160ms ease; }
.clearing__step:hover, .clearing__step:focus-visible { outline:none; filter:brightness(1.04);
  transform:translateY(-1px); }
.clearing__step:focus-visible { box-shadow:0 0 0 3px ${C.terracotta}; }

/* time-lapse: stepping toward dusk lowers the sun, cools the sky a touch, brings out fireflies */
.clearing[data-day-offset="7"] .clearing__scene { filter:saturate(1.02) brightness(0.985) hue-rotate(-4deg); }
.clearing[data-day-offset="7"] .clearing__sun { top:10%; opacity:0.85; }
.clearing[data-day-offset="7"] .clearing__fireflies span { opacity:0.85; }
.clearing[data-day-offset="30"] .clearing__scene { filter:saturate(1.05) brightness(0.95) hue-rotate(-8deg); }
.clearing[data-day-offset="30"] .clearing__sun { top:18%; opacity:0.7; }
.clearing[data-day-offset="30"] .clearing__fireflies span { opacity:1; }
.clearing[data-day-offset="30"] .clearing__pines { filter:brightness(0.9); }

@keyframes clr-sway { 0%,100%{ transform:rotate(-0.8deg) } 50%{ transform:rotate(0.8deg) } }
@keyframes clr-smoke { 0%{ opacity:0; transform:translateY(0) scale(0.55) }
  22%{ opacity:0.62 } 60%{ opacity:0.4 } 100%{ opacity:0; transform:translateY(-3.4rem) scale(1.8) } }
@keyframes clr-hearth { 0%,100%{ opacity:0.85 } 50%{ opacity:1 } }
@keyframes clr-flicker { 0%,100%{ opacity:1 } 45%{ opacity:0.975 } 70%{ opacity:0.99 } }
@keyframes clr-halo { 0%,100%{ transform:translateX(-50%) scale(0.94); opacity:0.85 }
  50%{ transform:translateX(-50%) scale(1.06); opacity:1 } }
@keyframes clr-shimmer { 0%{ opacity:0 } 12%{ opacity:0.9 } 40%{ opacity:0 } 100%{ opacity:0 } }
@keyframes clr-glint { 0%,100%{ opacity:0.5; transform:scale(0.85) } 50%{ opacity:1; transform:scale(1.1) } }
@keyframes clr-fly { 0%{ opacity:0; transform:translate(0,0) } 20%{ opacity:0.9 }
  50%{ transform:translate(1.4rem,-1.1rem) } 80%{ opacity:0.7 }
  100%{ opacity:0; transform:translate(2.6rem,0.4rem) } }
@keyframes clr-cat { 0%{ transform:translateX(-8%) scaleX(1) } 44%{ transform:translateX(320%) scaleX(1) }
  50%{ transform:translateX(320%) scaleX(-1) } 94%{ transform:translateX(-8%) scaleX(-1) }
  100%{ transform:translateX(-8%) scaleX(1) } }

@media (prefers-reduced-motion: reduce) {
  .clearing__pines, .lodge__smoke span, .lodge__hearth, .cab__window, .cabin__return,
  .cabin__glint, .clearing__fireflies span, .clearing__cat { animation:none !important; }
  .clearing__fireflies span { opacity:0.7; }
  .clearing__cat { transform:translateX(280%) scaleX(-1); }
}
.clearing[data-reduced-motion="true"] .clearing__pines,
.clearing[data-reduced-motion="true"] .lodge__smoke span,
.clearing[data-reduced-motion="true"] .lodge__hearth,
.clearing[data-reduced-motion="true"] .cab__window,
.clearing[data-reduced-motion="true"] .cabin__return,
.clearing[data-reduced-motion="true"] .cabin__glint,
.clearing[data-reduced-motion="true"] .clearing__fireflies span,
.clearing[data-reduced-motion="true"] .clearing__cat { animation:none !important; }
.clearing[data-reduced-motion="true"] .clearing__fireflies span { opacity:0.7; }
`;
