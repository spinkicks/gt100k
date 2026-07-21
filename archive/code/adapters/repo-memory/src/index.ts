import type { DailyProgress, DailyProgressRepository } from "@gt100k/learning-loop";

/**
 * In-memory DailyProgressRepository for the synthetic slice (no real persistence, no PII).
 * A Postgres adapter can replace this later without touching the domain.
 */
export class InMemoryDailyProgressRepository implements DailyProgressRepository {
  private readonly store = new Map<string, DailyProgress>();

  private key(learnerRef: string, day: string): string {
    return `${learnerRef}::${day}`;
  }

  async load(learnerRef: string, day: string): Promise<DailyProgress | null> {
    return this.store.get(this.key(learnerRef, day)) ?? null;
  }

  async save(progress: DailyProgress): Promise<void> {
    // Deep-copy so callers can't mutate stored state through their reference.
    // DailyProgress is plain JSON data, so a JSON round-trip is a safe clone (no Node/DOM globals).
    const copy = JSON.parse(JSON.stringify(progress)) as DailyProgress;
    this.store.set(this.key(progress.learnerRef, progress.day), copy);
  }

  async history(learnerRef: string): Promise<DailyProgress[]> {
    return [...this.store.values()]
      .filter((p) => p.learnerRef === learnerRef)
      .sort((a, b) => a.day.localeCompare(b.day));
  }
}
