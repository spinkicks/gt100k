import type { Facet, QuestionSet } from "./model.js";

export const QUESTION_BANK = {
  what: {
    base: [
      { id: "what-1", text: "What are you making?" },
      { id: "what-2", text: "How would you describe your project to someone new?" },
      { id: "what-3", text: "What does your project do?" },
    ],
    followUp: [{ id: "what-follow-up", text: "What is one detail that makes it your project?" }],
  },
  why: {
    base: [
      { id: "why-1", text: "Why does this project matter to you?" },
      { id: "why-2", text: "What made you want to work on this idea?" },
      { id: "why-3", text: "What keeps you interested in this project?" },
    ],
    followUp: [{ id: "why-follow-up", text: "Say a little more about why that matters to you." }],
  },
  how: {
    base: [
      { id: "how-1", text: "How does your project work?" },
      { id: "how-2", text: "What steps or parts make your idea work?" },
      { id: "how-3", text: "How did you approach building it?" },
    ],
    followUp: [{ id: "how-follow-up", text: "What is one step you could explain in more detail?" }],
  },
  challenge: {
    base: [
      { id: "challenge-1", text: "What has been the hardest part so far?" },
      { id: "challenge-2", text: "Where have you felt stuck?" },
      { id: "challenge-3", text: "What problem have you had to work through?" },
    ],
    followUp: [{ id: "challenge-follow-up", text: "What makes that part especially challenging?" }],
  },
  next: {
    base: [
      { id: "next-1", text: "What would you like to try next?" },
      { id: "next-2", text: "What is your next small step?" },
      { id: "next-3", text: "If you kept going, what would you improve first?" },
    ],
    followUp: [{ id: "next-follow-up", text: "What could make that next step more specific?" }],
  },
  audience: {
    base: [
      { id: "audience-1", text: "Who do you hope this project helps or reaches?" },
      { id: "audience-2", text: "Who would you most like to show this to?" },
      { id: "audience-3", text: "Who is this project for?" },
    ],
    followUp: [{ id: "audience-follow-up", text: "What might that person care about most?" }],
  },
} as const satisfies Record<Facet, QuestionSet>;
