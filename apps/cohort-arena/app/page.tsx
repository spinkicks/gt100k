import dynamic from "next/dynamic";

const CohortArena = dynamic(() => import("../components/CohortArena.client"), {
  ssr: false,
});

export default function Page() {
  return <CohortArena />;
}
