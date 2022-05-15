import { ScoreInput, config } from "@0xflicker/ranker";
import { SQSHandler } from "aws-lambda";
import { Experiences } from "../commands/leaderboard/common";
import { createRankerInstance } from "../ranker";
import { createLogger } from "../utils/logging";

const KNOWN_LEADERBOARDS = [Experiences.POTATO];
const logger = createLogger();

export const handler: SQSHandler = async (event) => {
  for (const request of event.Records) {
    const { body } = request;
    const { Message: message } = JSON.parse(body);
    const {
      boardName,
      scores,
    }: { boardName: Experiences; scores: ScoreInput[] } = JSON.parse(message);
    if (!KNOWN_LEADERBOARDS.includes(boardName)) {
      logger.info("Unknown leaderboard");
      continue;
    }

    try {
      const l = await createRankerInstance(boardName);
      const [scoresToAdd, scoresToRemove] = await l.setScores(scores);
      await l.leaderboardUpdate(scoresToAdd, scoresToRemove);
    } catch (err: any) {
      logger.error(err);
    }
  }
};
