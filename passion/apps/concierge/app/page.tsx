import type { JSX } from "react";

import { Concierge } from "./console.js";

// The concierge chat page. Installs the `window.__qa` contract (via Concierge) that the LOOP_QA
// usability gate drives.
export default function Page(): JSX.Element {
  return <Concierge />;
}
