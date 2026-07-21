import { type IslandView, QUALITY_TIERS, SCENE3D, type Vector3 } from "@gt100k/interest-lab-view";
import { isValidElement } from "react";
import { Texture } from "three";
import { describe, expect, it, vi } from "vitest";
import { Island } from "../app/child/world3d/Island";
import { IslandMotif } from "../app/child/world3d/IslandMotif";
import {
  DOMAIN_MOTIF_SHAPES,
  type DomainMotif,
  resolveDomainMotif,
} from "../app/child/world3d/motif";

// The eight seed domains (spec §"Probe taxonomy") — the world must read as eight distinct places.
const SEED_DOMAINS = [
  "making",
  "living_systems",
  "symbols_math",
  "word_craft",
  "sound_music",
  "movement_body",
  "visual_design",
  "social_world",
] as const;

const island: IslandView = {
  domain: "making",
  hue: "#FF8A66",
  center: [0, -0.6, -9],
  baseRadius: 2.2,
  markers: [
    {
      probeId: "p1",
      familyId: "f1",
      workModeGlyph: "hammer",
      position: [1, 2, 3],
      returnState: "new",
      tone: "neutral",
      motionKind: "markerGlow",
      provenance: "RULE",
      whyCopy: "A new kind to try.",
      helpAffordance: true,
    },
  ],
};

const isFinite3 = (v: Vector3) => v.every((n) => Number.isFinite(n));

describe("per-domain island motifs", () => {
  it("maps each of the eight seed domains to a distinct silhouette", () => {
    const motifs = SEED_DOMAINS.map(resolveDomainMotif);

    // Eight distinct shape labels — no two islands share a silhouette family.
    const shapes = new Set(motifs.map((m) => m.shape));
    expect(shapes.size).toBe(SEED_DOMAINS.length);

    // And the full descriptors are pairwise distinct (props/arrangement differ, not just the label).
    const serialized = new Set(motifs.map((m) => JSON.stringify(m)));
    expect(serialized.size).toBe(SEED_DOMAINS.length);

    // Every shape label is drawn from the published union.
    for (const motif of motifs) {
      expect(DOMAIN_MOTIF_SHAPES).toContain(motif.shape);
    }
  });

  it("returns a renderable, finite descriptor for every domain", () => {
    for (const domain of SEED_DOMAINS) {
      const motif = resolveDomainMotif(domain);
      expect(motif.domain).toBe(domain);
      expect(motif.props.length).toBeGreaterThan(0);
      expect(motif.emissiveIntensity).toBeGreaterThan(0);
      expect(motif.spinSpeed).toBeGreaterThanOrEqual(0);
      for (const prop of motif.props) {
        expect(prop.geometry.args.length).toBeGreaterThan(0);
        expect(prop.geometry.args.every((n) => Number.isFinite(n))).toBe(true);
        expect(isFinite3(prop.position)).toBe(true);
        expect(isFinite3(prop.rotation)).toBe(true);
        expect(prop.scale).toBeGreaterThan(0);
      }
    }
  });

  it("is pure and deterministic (same domain ⇒ deep-equal descriptor)", () => {
    for (const domain of SEED_DOMAINS) {
      expect(resolveDomainMotif(domain)).toEqual(resolveDomainMotif(domain));
    }
  });

  it("falls back to a deterministic default for an unknown domain (never throws)", () => {
    const unknown = resolveDomainMotif("a_brand_new_catalog_domain");
    expect(unknown.props.length).toBeGreaterThan(0);
    expect(DOMAIN_MOTIF_SHAPES).toContain(unknown.shape);
    expect(resolveDomainMotif("a_brand_new_catalog_domain")).toEqual(unknown);
  });

  it("exposes IslandMotif as a component (hook-owning, not called directly)", () => {
    // IslandMotif owns a useFrame spin, so it is rendered as an element — never invoked as a fn.
    expect(IslandMotif).toEqual(expect.any(Function));
  });

  it("layers the domain motif onto the island so it is not just three primitives", () => {
    // Island stays a hook-free function we can call directly (see IslandLift lesson).
    const element = Island({
      island,
      quality: QUALITY_TIERS.full,
      scene3d: SCENE3D,
      haloTexture: new Texture(),
      pickedProbeIds: new Set(),
      onPick: vi.fn(),
    });
    expect(isValidElement(element)).toBe(true);

    // Walk the element tree (Float → group → IslandLift → children[]) and find the wired motif.
    const collect = (node: unknown, out: unknown[]) => {
      if (Array.isArray(node)) {
        for (const child of node) collect(child, out);
      } else if (isValidElement(node)) {
        out.push(node);
        collect((node.props as { children?: unknown }).children, out);
      }
    };
    const all: unknown[] = [];
    collect(element, all);
    const motifEl = all.find(
      (n): n is { props: { motif: DomainMotif } } => isValidElement(n) && n.type === IslandMotif,
    );
    expect(motifEl).toBeDefined();
    // It carries this island's domain motif (making → the anvil silhouette).
    expect(motifEl?.props.motif).toEqual(resolveDomainMotif(island.domain));
  });
});
