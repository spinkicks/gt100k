// Raw TimeBack signal types (spec §3.2). What the academics platform already knows about a kid:
// per-subject mastery (an aptitude proxy) + discretionary XP (a voluntary-choice proxy) + whether the
// subject is offered in the kid's environment. These are the SOURCE signals; `toDomainPriors` translates
// them into 011's cabin-keyed `DomainPrior[]`. SYNTHETIC ONLY — no real API yet.

/** A TimeBack subject label, e.g. "math", "reading", "writing", "science", "music", "art", "coding". */
export type Subject = string;

export interface SubjectSignal {
  readonly subject: Subject;
  /** [0,1] aptitude proxy (subject performance / mastery). */
  readonly mastery: number;
  /** >= 0 raw free-choice XP the kid spent on this subject. */
  readonly discretionaryXp: number;
  /** is this subject present in the kid's TimeBack environment? */
  readonly offered: boolean;
}

export interface TimeBackSnapshot {
  readonly kidId: string;
  /** ISO-8601 timestamp the snapshot reflects. */
  readonly asOf: string;
  readonly subjects: readonly SubjectSignal[];
}
