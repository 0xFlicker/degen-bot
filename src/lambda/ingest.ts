import { ScoreInput, config } from "@0xflicker/ranker";
import { TableScores } from "@0xflicker/ranker/lib/db/dynamodb";
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
      scoreDeltas,
    }: {
      boardName: Experiences;
      scores?: ScoreInput[];
      scoreDeltas?: ScoreInput[];
    } = JSON.parse(message);
    if (!KNOWN_LEADERBOARDS.includes(boardName)) {
      logger.info("Unknown leaderboard");
      continue;
    }
    try {
      const l = await createRankerInstance(boardName);
      if (scores) {
        logger.debug("Adding scores", { scores });
        const [scoresToAdd, scoresToRemove] = await l.setScores(scores);
        await l.leaderboardUpdate(scoresToAdd, scoresToRemove);
      }
      if (scoreDeltas) {
        logger.debug(
          `Adding score deltas ${scoreDeltas
            .map(({ playerId, score }) => `${playerId}: [${score.join(", ")}]`)
            .join(" | ")}`
        );
        const oldScores = (
          await Promise.all(
            scoreDeltas.map(({ playerId }) => l.fetchScore(playerId))
          )
        ).filter((s) => s !== null) as TableScores[];
        logger.debug(
          `Oldscores ${oldScores
            .map(
              ({ Player_ID: playerId, Score: score }) =>
                `${playerId}: [${score.join(", ")}]`
            )
            .join(" | ")}`
        );
        const oldScoreMap = new Map<string, TableScores>();
        for (const score of oldScores) {
          oldScoreMap.set(score.Player_ID, score);
        }
        for (const score of scoreDeltas) {
          const oldScore = oldScoreMap.get(score.playerId);
          if (oldScore) {
            oldScore.Score.forEach((s, i) => {
              logger.debug(
                `Updating score ${i}: score=${s} delta=${score.score[i]}`
              );
              oldScore.Score[i] += score.score[i];
            });
          }
        }
        logger.info(`Applying score delta`);
        const [scoresToAdd, scoresToRemove] = await l.setScores(
          [...oldScoreMap.values()].map((s) => ({
            playerId: s.Player_ID,
            score: s.Score,
            date: s.Date,
          }))
        );
        await l.leaderboardUpdate(scoresToAdd, scoresToRemove);
      }
    } catch (err: any) {
      logger.error(err);
    }
  }
};
