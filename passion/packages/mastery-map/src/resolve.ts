/**
 * Which map a domain resolves to. One implementation, exported, because there is more than one
 * caller and the rule is easy to get subtly wrong.
 *
 * `MapStore.get` owns the behaviour (spec §4): the most specific match wins, and where there is no
 * map at the exact path the query WIDENS to the cabin above it. A second caller that compared paths
 * for equality instead would silently miss the cabin map, and the child in front of it would be
 * told there is nothing here rather than being read against the map that actually serves them.
 *
 * Pure and total: string comparison over a two-segment path, no clock and no store.
 */
import { type DomainPath, serializePath } from "@gt100k/two-axis-tagging";

/** The same domain, compared through the taxonomy's own serialisation rather than by hand. */
export function samePath(a: DomainPath, b: DomainPath): boolean {
  return serializePath(a) === serializePath(b);
}

/**
 * Whether a map filed at `mapPath` is one that a query for `queryPath` resolves to: the exact
 * domain, or the cabin above a sub-topic.
 *
 * The fallback only ever widens. A query about a cabin never resolves DOWN to one of its
 * sub-topics, because a map about chess is not a map about strategy games, and answering the wider
 * question with the narrower map is a substitution the caller has no way of noticing.
 *
 * Two maps can both serve one query, the exact one and the cabin above it. Choosing between them is
 * the caller's job and the rule is the same everywhere: prefer the exact match, then widen.
 */
export function servesPath(mapPath: DomainPath, queryPath: DomainPath): boolean {
  if (samePath(mapPath, queryPath)) return true;
  return queryPath.length === 2 && mapPath.length === 1 && mapPath[0] === queryPath[0];
}
