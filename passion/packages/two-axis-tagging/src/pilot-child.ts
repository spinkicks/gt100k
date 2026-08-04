/**
 * The one child the apps are all talking about, until real identity exists.
 *
 * WHY THIS IS HERE. Three apps invented three answers. The discovery wall wrote its signals as
 * `local-demo`, the project studio seeded its journeys under `kid-demo`, and the studio's ask path
 * used `kid-synthetic-001`. Nothing was broken in any single app, and the product was quietly
 * incoherent: a child could spend a fortnight returning to chess on the wall, open the studio, and
 * be a different person. Work done in one place could never inform a specialization discovered in
 * another, so the loop the whole product describes could not close even in a demo.
 *
 * WHY A CONSTANT AND NOT A LOOKUP. There is no identity system yet and this is not a stand-in for
 * one. It is the smallest thing that makes the apps agree, so the pipeline can be exercised end to
 * end. When real identity lands, every use of this becomes a session read, and having a single
 * symbol to search for is the point.
 *
 * WHY THIS PACKAGE. It is the only one all three apps already depend on. The alternative was a new
 * shared package for a single string, or three copies that drift apart again.
 */
export const PILOT_KID_ID = "pilot-child";

/** Shown wherever a name is needed. Deliberately not a real child's name. */
export const PILOT_KID_NAME = "Pilot Child";
