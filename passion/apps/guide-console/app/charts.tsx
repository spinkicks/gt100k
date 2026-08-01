/**
 * Small dependency-free SVG chart set. Guides are not technical, so every chart is a
 * plain shape with a legend and a readable label, no interaction required to understand it.
 */

function smoothPath(pts: readonly [number, number][]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [px, py] = pts[i - 1]!;
    const [x, y] = pts[i]!;
    const cx = (px + x) / 2;
    d += ` C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }
  return d;
}

export function AreaChart({
  series,
  labels,
  height = 200,
}: {
  series: readonly { name: string; color: string; data: readonly number[] }[];
  labels: readonly string[];
  height?: number;
}): JSX.Element {
  const w = 560;
  const h = height;
  const pad = { t: 12, r: 20, b: 26, l: 30 };
  const max = Math.max(...series.flatMap((s) => s.data)) * 1.15;
  const n = labels.length;
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / (n - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Returns over time">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + g * (h - pad.t - pad.b)}
          y2={pad.t + g * (h - pad.t - pad.b)}
          className="chart__grid"
        />
      ))}
      {series.map((s) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const line = smoothPath(pts);
        const area = `${line} L ${x(n - 1)} ${h - pad.b} L ${x(0)} ${h - pad.b} Z`;
        return (
          <g key={s.name}>
            <defs>
              <linearGradient id={`g-${s.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#g-${s.name})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={h - 8} className="chart__lab" textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  );
}

export function BarChart({
  data,
  labels,
  color,
  compare,
  compareColor,
  height = 190,
}: {
  data: readonly number[];
  labels: readonly string[];
  color: string;
  compare?: readonly number[];
  compareColor?: string;
  height?: number;
}): JSX.Element {
  const w = 540;
  const h = height;
  const pad = { t: 12, r: 20, b: 26, l: 30 };
  const max = Math.max(...data, ...(compare ?? [])) * 1.2;
  const slot = (w - pad.l - pad.r) / data.length;
  const bw = compare ? slot * 0.3 : slot * 0.45;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Weekly returns">
      {[0, 0.5, 1].map((g) => (
        <line
          key={g}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + g * (h - pad.t - pad.b)}
          y2={pad.t + g * (h - pad.t - pad.b)}
          className="chart__grid"
        />
      ))}
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad.t - pad.b);
        const cx = pad.l + i * slot + slot / 2;
        return (
          <g key={labels[i]}>
            <rect
              x={compare ? cx - bw - 2 : cx - bw / 2}
              y={h - pad.b - bh}
              width={bw}
              height={bh}
              rx="3"
              fill={color}
            />
            {compare ? (
              <rect
                x={cx + 2}
                y={h - pad.b - (compare[i]! / max) * (h - pad.t - pad.b)}
                width={bw}
                height={(compare[i]! / max) * (h - pad.t - pad.b)}
                rx="3"
                fill={compareColor}
              />
            ) : null}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text
          key={l}
          x={pad.l + i * slot + slot / 2}
          y={h - 8}
          className="chart__lab"
          textAnchor="middle"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

export function Donut({
  slices,
  size = 168,
}: {
  slices: readonly { name: string; value: number; color: string }[];
  size?: number;
}): JSX.Element {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let off = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Time by area"
    >
      <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.name}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
            />
          );
          off += len;
          return el;
        })}
      </g>
    </svg>
  );
}

export function Spark({ data, color }: { data: readonly number[]; color: string }): JSX.Element {
  const w = 110;
  const h = 34;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map(
    (v, i) =>
      [(i * w) / (data.length - 1), h - 3 - ((v - min) / (max - min || 1)) * (h - 8)] as [
        number,
        number,
      ],
  );
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" aria-hidden="true">
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
