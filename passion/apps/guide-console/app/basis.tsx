// What a claim actually rests on, rendered the same way wherever it appears. Deliberately its own
// module rather than part of why.tsx: the Evidence base page renders on the server, and a "use
// client" module's exports cannot be read there.
//
// The three bases are told apart by their words first and their colour second — a guide who cannot
// see the difference between the amber and the blue ground still reads "Our default" and knows the
// number was picked by us rather than found in a study.
import type { JSX } from "react";
import type { Basis } from "@gt100k/research";

const BASIS_TEXT: Record<Basis, string> = {
  evidence: "Research finding",
  chosen: "Our default",
  policy: "Legal requirement",
};

export function BasisTag({ basis }: { basis: Basis }): JSX.Element {
  return <span className={`why-tag why-tag--${basis}`}>{BASIS_TEXT[basis]}</span>;
}
