import { createRanker } from "@0xflicker/ranker";
import { getDb } from "../storage/db/dynamo";
import { Experiences } from "../swagger-gen";

const rankerOptions = {
  [Experiences.POTATO]: {
    rootKey: Experiences.POTATO,
    branchingFactor: 100,
    leaderboardSize: 100,
    scoreRange: [0, 100000],
  },
};

export async function createRankerInstance(name: Experiences) {
  return await createRanker({
    db: getDb(),
    ...rankerOptions[name],
  });
}
