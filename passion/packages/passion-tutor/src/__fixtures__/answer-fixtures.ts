export const GOLDEN_PROJECT_PROFILE = {
  id: "project-synthetic-robotics",
  studentId: "student-synthetic-01",
  title: "Creek Scout",
  domain: "robotics and environmental science",
  summary: "A synthetic rover concept for checking creek conditions.",
  artifactRefs: ["artifact-synthetic-sketch"],
} as const;

export const GOLDEN_ANSWER_FIXTURES = [
  { name: "empty", answer: "", expectedScore: 0 },
  { name: "filler only", answer: "Um uh erm.", expectedScore: 0 },
  { name: "short generic", answer: "I built it.", expectedScore: 0.03 },
  { name: "domain term", answer: "It monitors robotics.", expectedScore: 0.0925 },
  {
    name: "one reason and one domain term",
    answer: "I chose robotics because it can help.",
    expectedScore: 0.249166667,
  },
  {
    name: "reasoning marker phrase plus concrete details",
    answer: "The rover uses Arduino so that 2 motors move.",
    expectedScore: 0.331666667,
  },
  {
    name: "three reasons and three concrete details",
    answer: "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    expectedScore: 0.6675,
  },
] as const;

export const GOLDEN_SESSION = {
  seed: 7,
  answers: [
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    "I chose robotics because it can help.",
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    "The rover uses Arduino so that 2 motors move.",
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
    "My Arduino checks 3 sensors first, then it uses robotics because failures matter.",
  ],
  expectedQuestionIds: [
    "what-2",
    "why-3",
    "why-follow-up",
    "how-2",
    "challenge-3",
    "challenge-follow-up",
    "next-2",
    "audience-3",
  ],
  expectedCoverage: {
    what: 0.6675,
    why: 0.6675,
    how: 0.6675,
    challenge: 0.6675,
    next: 0.6675,
    audience: 0.6675,
  },
  expectedGaps: [],
} as const;
