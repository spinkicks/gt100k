import { InterviewClient } from "../src/interview-client.js";
import { loadSeededInterview } from "../src/load-seeded-interview.js";

export default async function Page() {
  const { project, session } = await loadSeededInterview();
  const question = session.currentQuestion;

  if (!question) throw new Error("SEEDED_SESSION_COMPLETE");

  return (
    <main className="interview-shell">
      <aside className="project-panel" aria-label="Current passion project">
        <div className="wordmark">
          <Mark />
          <span>Passion Tutor</span>
        </div>

        <div className="project-context">
          <p className="project-kicker">Your project</p>
          <p className="project-title">{project.title}</p>
          <span>{project.domain}</span>
        </div>

        <p className="synthetic-note">Synthetic practice project</p>
      </aside>

      <InterviewClient initialSession={session} />
    </main>
  );
}

function Mark() {
  return (
    <svg aria-hidden="true" className="mark" viewBox="0 0 32 32">
      <path d="M16 3v26M3 16h26M6.8 6.8l18.4 18.4M25.2 6.8 6.8 25.2" />
      <circle cx="16" cy="16" r="4.5" />
    </svg>
  );
}
