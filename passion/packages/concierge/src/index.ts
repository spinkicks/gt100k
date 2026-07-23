// @gt100k/concierge — child-safe RAG concierge: pure 10-stage pipeline + curated
// library + typed ports + deterministic stub adapters. No network; SYNTHETIC data only.
// Barrel filled in task-by-task (model → library → safety → ports/stubs → pipeline → promote).
export * from "./model.js";
export * from "./library.js";
export * from "./safety.js";
export * from "./ports.js";
export * from "./stubs.js";
export * from "./pipeline.js";
export * from "./promote.js";
