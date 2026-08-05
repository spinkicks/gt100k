/* GT100K final deck — boot + signature mount + Act-pivot morph.
   Uses UMD globals `Reveal` and `RevealNotes` (loaded via <script> tags),
   so the deck runs offline with no build step and even from file://. */

/* ---------------------------------------------------------------------------
   Signature SVG — one node field, two readings.
   Same 8 nodes are a warm undirected constellation (Act I) or a cool directed
   DAG converging on a verified root (Act II). Mounted from one template so the
   markup lives in exactly one place.
   ------------------------------------------------------------------------- */
const NODES = {
  n1: [90, 110],  n2: [95, 255],  n3: [230, 60],  n4: [250, 190],
  n5: [240, 320], n6: [410, 140], n7: [415, 285], n8: [560, 205], // n8 = root
};

// undirected, poetic connections (Act I)
const ORGANIC = [
  ['n1', 'n3'], ['n1', 'n4'], ['n3', 'n4'], ['n2', 'n4'], ['n4', 'n5'],
  ['n4', 'n6'], ['n4', 'n7'], ['n6', 'n8'], ['n7', 'n8'], ['n5', 'n7'],
];

// directed, converging on the root (Act II)
const DAG = [
  ['n1', 'n3'], ['n1', 'n4'], ['n2', 'n4'], ['n2', 'n5'], ['n3', 'n6'],
  ['n4', 'n6'], ['n4', 'n7'], ['n5', 'n7'], ['n6', 'n8'], ['n7', 'n8'],
];

function line(a, b) {
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}

// slight curve + stop short of the target so the arrowhead sits clean
function dagPath(a, b) {
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const gap = 12; // leave room for the node + arrow
  const ex = x2 - (dx / len) * gap, ey = y2 - (dy / len) * gap;
  // gentle control point offset perpendicular to the edge
  const mx = (x1 + ex) / 2, my = (y1 + ey) / 2;
  const cx = mx - dy * 0.08, cy = my + dx * 0.08;
  return `<path pathLength="1" d="M ${x1} ${y1} Q ${cx} ${cy} ${ex} ${ey}" marker-end="url(#sig-arrow)"/>`;
}

function node(id) {
  const [x, y] = NODES[id];
  const isRoot = id === 'n8';
  const r = isRoot ? 9 : 6;
  return `<g class="node ${id}${isRoot ? ' root' : ''}" transform="translate(${x} ${y})">
    <g class="float">
      <circle class="halo" r="${r + 7}"></circle>
      <circle r="${r}"></circle>
    </g>
  </g>`;
}

function sigMarkup(state) {
  // "morph" starts as a constellation but carries the class the pivot toggles
  const cls = state === 'morph' ? 'state-constellation morph' : `state-${state}`;
  return `<svg class="sig ${cls}" viewBox="0 0 640 380"
       role="img" aria-label="A field of nodes shown as a constellation in Act I and as a directed provenance graph in Act II">
    <defs>
      <marker id="sig-arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path class="arrowhead" d="M 0 1 L 9 5 L 0 9 z"></path>
      </marker>
    </defs>
    <g class="edges-organic">${ORGANIC.map(([a, b]) => line(a, b)).join('')}</g>
    <g class="edges-dag">${DAG.map(([a, b]) => dagPath(a, b)).join('')}</g>
    ${Object.keys(NODES).map(node).join('')}
  </svg>`;
}

function mountSignatures() {
  document.querySelectorAll('.sig-slot').forEach((slot) => {
    slot.innerHTML = sigMarkup(slot.dataset.state || 'constellation');
  });
}

/* ---------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------- */
mountSignatures();

Reveal.initialize({
  width: 1280,
  height: 720,
  margin: 0.04,
  minScale: 0.2,
  maxScale: 2.0,
  hash: true,
  controls: true,
  progress: true,
  slideNumber: 'c/t',
  transition: 'fade',
  transitionSpeed: 'default',
  backgroundTransition: 'fade',
  plugins: [RevealNotes],
});

/* ---------------------------------------------------------------------------
   Act pivot — on the PROVE slide the constellation crystallizes into the DAG.
   Reset on leave so re-entering the slide replays the morph in rehearsal.
   ------------------------------------------------------------------------- */
let morphTimer = null;

function updateMorph(slide) {
  document.querySelectorAll('.sig.morph').forEach((sig) => {
    sig.classList.remove('to-dag');
  });
  clearTimeout(morphTimer);

  if (slide && slide.hasAttribute('data-morph')) {
    const sig = slide.querySelector('.sig.morph');
    if (sig) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      morphTimer = setTimeout(() => sig.classList.add('to-dag'), reduce ? 0 : 650);
    }
  }
}

Reveal.on('ready', (e) => updateMorph(e.currentSlide));
Reveal.on('slidechanged', (e) => updateMorph(e.currentSlide));
