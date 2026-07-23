import type { JSX } from "react";

import { GuideConsole } from "./console.js";

// The guide console. Installs the `window.__qa` contract (via useConsole) that the LOOP_QA usability
// gate drives.
export default function Page(): JSX.Element {
  return <GuideConsole />;
}
