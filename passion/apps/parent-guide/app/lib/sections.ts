export interface SectionRef {
  readonly id: string;
  readonly label: string;
}

// Single source of truth for section ids, shared by the page and the table of contents.
export const SECTIONS: readonly SectionRef[] = [
  { id: "start", label: "Start here" },
  { id: "stance", label: "Why it matters, and the stance" },
  { id: "read-your-child", label: "How to read your child" },
  { id: "how-talent-develops", label: "How talent develops" },
  { id: "the-moves", label: "The five moves" },
  { id: "the-traps", label: "The four traps" },
  { id: "big-questions", label: "The big questions" },
  { id: "when-it-gets-hard", label: "When it gets hard" },
  { id: "checkin", label: "Family Check-In" },
  { id: "sources", label: "Sources" },
  { id: "self-assessment", label: "Your self-assessment" },
];
