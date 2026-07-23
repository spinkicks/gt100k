import type { JSX } from "react";

import { FamilyConsole } from "./console.js";

// The family co-engagement surface. Installs the `window.__qa` contract (via useFamily) that the
// LOOP_QA usability gate drives.
export default function Page(): JSX.Element {
  return <FamilyConsole />;
}
