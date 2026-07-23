"use client";
import type { ExplorerView, NodeView } from "@gt100k/evidence-explorer-view";
/**
 * Manual **Add** side panel (Phase 4) — a calm 2D drawer in the Observatory rail that lets a human
 * append nodes and edges to the working graph. It reuses the existing HUD drawer visual language
 * (frosted `.panel`, `hud-field` labels, segmented look) rather than inventing a new one.
 *
 * All hashing + validation happen server-side: on submit the panel calls the `addNode` / `addEdge`
 * server action with its current working graph, and on success lifts the returned
 * `{ graph, view, verification }` up to the Observatory so the constellation + Ledger + verify seal
 * re-render. Domain rejections (a cycle, a dangling reference, a blank field) come back as a friendly
 * message and surface inline — never as an accusation, always as guidance. Adds are append-only:
 * there is no edit or delete affordance here.
 */
import {
  ACTOR_KINDS,
  type ActorKind,
  EDGE_TYPES,
  type EdgeType,
  type EvidenceGraph,
  NODE_TYPES,
  type NodeType,
} from "@gt100k/evidence-graph";
import { type JSX, useId, useMemo, useState } from "react";
import { type AddContext, type AddResult, addEdgeAction, addNodeAction } from "../app/actions.js";
import { ChevronIcon } from "./icons.js";
import type { SyntheticVerification } from "./synthetic-view.js";

/** The fresh render bundle the parent lifts into state on a successful add. */
export interface AppliedBundle {
  readonly graph: EvidenceGraph;
  readonly view: ExplorerView;
  readonly verification: SyntheticVerification;
}

/**
 * A monotonic, deterministic ISO timestamp derived from the current node count — never `Date.now()`,
 * so the content-addressed ids stay reproducible. Each add advances the count, so successive nodes
 * get strictly increasing timestamps (and therefore distinct addresses even with identical titles).
 */
function manualTimestamp(nodeCount: number): string {
  const base = Date.UTC(2026, 6, 24, 0, 0, 0, 0); // 2026-07-24T00:00:00Z — a stable synthetic anchor.
  return new Date(base + nodeCount * 60_000).toISOString();
}

export function AddPanel({
  graph,
  nodes,
  projectRef,
  subjectDigest,
  onApply,
}: {
  graph: EvidenceGraph;
  /** Current nodes (id + label) for the edge from/to selects. */
  nodes: readonly NodeView[];
  projectRef: string;
  subjectDigest: string;
  onApply: (next: AppliedBundle) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add-node fields.
  const [nodeType, setNodeType] = useState<NodeType>("Claim");
  const [title, setTitle] = useState("");
  const [actorKind, setActorKind] = useState<ActorKind>("human");
  const [actorRef, setActorRef] = useState("learner-07");

  // Add-edge fields.
  const nodeOptions = useMemo(() => nodes.map((n) => ({ id: n.id, label: n.label })), [nodes]);
  const [edgeType, setEdgeType] = useState<EdgeType>("derived_from");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const panelId = useId();
  const typeId = useId();
  const titleId = useId();
  const actorKindId = useId();
  const actorRefId = useId();
  const fromId = useId();
  const toId = useId();
  const edgeTypeId = useId();

  const ctx: AddContext = { projectRef, subjectDigest };

  const run = async (call: Promise<AddResult>): Promise<void> => {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await call;
      if (res.ok) {
        onApply({ graph: res.graph, view: res.view, verification: res.verification });
        setNotice("Added to the graph.");
      } else {
        setError(res.error);
      }
    } catch {
      setError("That add could not be applied.");
    } finally {
      setPending(false);
    }
  };

  const submitNode = (): void => {
    const timestamp = manualTimestamp(Object.keys(graph.nodes).length);
    void run(
      addNodeAction(graph, { type: nodeType, title, actorKind, actorRef, timestamp }, ctx),
    ).then(() => setTitle(""));
  };

  const submitEdge = (): void => {
    void run(addEdgeAction(graph, { type: edgeType, from, to }, ctx));
  };

  const canAddEdge = from !== "" && to !== "" && !pending;

  return (
    <aside className="panel addp" aria-label="Add to the evidence graph">
      <button
        type="button"
        className={`addp-toggle${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="addp-toggle-text">
          <span className="addp-toggle-title">Add to graph</span>
          <span className="addp-toggle-sub">Append a node or a thread — validated live</span>
        </span>
        <span className="addp-toggle-chevron" aria-hidden="true">
          <ChevronIcon size={16} />
        </span>
      </button>

      {open ? (
        <div className="addp-body" id={panelId}>
          {error ? (
            <p className="addp-error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {notice ?? ""}
          </p>

          {/* ── Add node ─────────────────────────────────────────────────────── */}
          <section className="addp-section" aria-labelledby={`${panelId}-node`}>
            <h3 className="addp-section-title" id={`${panelId}-node`}>
              Add node
            </h3>

            <div className="hud-field">
              <label className="hud-field-label" htmlFor={typeId}>
                Type
              </label>
              <select
                id={typeId}
                className="addp-select"
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as NodeType)}
              >
                {NODE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="hud-field">
              <label className="hud-field-label" htmlFor={titleId}>
                Title
              </label>
              <input
                id={titleId}
                className="addp-input"
                type="text"
                value={title}
                placeholder="What is this node?"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="addp-row">
              <div className="hud-field">
                <label className="hud-field-label" htmlFor={actorKindId}>
                  Actor kind
                </label>
                <select
                  id={actorKindId}
                  className="addp-select"
                  value={actorKind}
                  onChange={(e) => setActorKind(e.target.value as ActorKind)}
                >
                  {ACTOR_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hud-field">
                <label className="hud-field-label" htmlFor={actorRefId}>
                  Actor ref
                </label>
                <input
                  id={actorRefId}
                  className="addp-input"
                  type="text"
                  value={actorRef}
                  onChange={(e) => setActorRef(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="addp-submit"
              onClick={submitNode}
              disabled={pending || title.trim() === "" || actorRef.trim() === ""}
            >
              Add node
            </button>
          </section>

          <div className="addp-divider" aria-hidden="true" />

          {/* ── Add edge ─────────────────────────────────────────────────────── */}
          <section className="addp-section" aria-labelledby={`${panelId}-edge`}>
            <h3 className="addp-section-title" id={`${panelId}-edge`}>
              Add edge
            </h3>

            {nodeOptions.length < 2 ? (
              <p className="hud-caption">Add at least two nodes to connect a thread.</p>
            ) : null}

            <div className="addp-row">
              <div className="hud-field">
                <label className="hud-field-label" htmlFor={fromId}>
                  From
                </label>
                <select
                  id={fromId}
                  className="addp-select"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  <option value="">Select…</option>
                  {nodeOptions.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hud-field">
                <label className="hud-field-label" htmlFor={toId}>
                  To
                </label>
                <select
                  id={toId}
                  className="addp-select"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  <option value="">Select…</option>
                  {nodeOptions.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hud-field">
              <label className="hud-field-label" htmlFor={edgeTypeId}>
                Thread type
              </label>
              <select
                id={edgeTypeId}
                className="addp-select"
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value as EdgeType)}
              >
                {EDGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="addp-submit"
              onClick={submitEdge}
              disabled={!canAddEdge}
            >
              Add edge
            </button>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
