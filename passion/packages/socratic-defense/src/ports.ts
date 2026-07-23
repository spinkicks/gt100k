import type { Facet, Judgment, ProjectProfile, ReadinessLevel, Turn } from "./model.js";

export interface Interviewer {
  nextQuestion(ctx: {
    profile: ProjectProfile;
    transcript: readonly Turn[];
    targetFacet: Facet;
    isFollowUp: boolean;
    readinessLevel: ReadinessLevel;
  }): Promise<string>;
}

export interface AnswerJudge {
  judge(ctx: {
    profile: ProjectProfile;
    facet: Facet;
    question: string;
    answer: string;
    readinessLevel: ReadinessLevel;
  }): Promise<Judgment>;
}

export interface TutorPorts {
  interviewer: Interviewer;
  judge: AnswerJudge;
}
