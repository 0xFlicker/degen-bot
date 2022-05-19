import Ranker, * as ranker from "@0xflicker/ranker";
import { getDb } from "../storage/db/dynamo";

export async function initRanker(name: string) {
  return await Ranker({
    db: getDb(),
    rootKey: name,
  });
}

export type ICreateRanker = Omit<ranker.ICreateRanker, "db">;

export async function createRanker(options: ICreateRanker) {
  return await ranker.createRanker({
    db: getDb(),
    ...options,
  });
}

export async function fetchBoard(name: string) {
  return await ranker.fetchBoard(getDb(), name);
}

export async function fetchBoardNames() {
  return await ranker.fetchBoardNames(getDb());
}

export async function isKnownLeaderboard(name: string) {
  return (await fetchBoardNames()).includes(name);
}
