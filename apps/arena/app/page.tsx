import ArenaClient from "./ArenaClient";

export default function Page() {
  return (
    <main className="arena-shell">
      <header className="arena-heading">
        <h1 id="arena-title">GT100K Arena</h1>
        <p className="arena-intro">Synthetic mastery-gated quest world · Independence Isles</p>
      </header>
      <ArenaClient />
    </main>
  );
}
