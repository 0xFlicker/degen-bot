import { ScoreInput, config } from "@0xflicker/ranker";
import { SQSHandler } from "aws-lambda";
import { initRanker } from "../ranker";
import { createLogger } from "../utils/logging";

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
      boardName: string;
      scores?: ScoreInput[];
      scoreDeltas?: ScoreInput[];
    } = JSON.parse(message);
    try {
      const l = await initRanker(boardName);
      if (scores) {
        logger.debug("Adding scores", { scores });
        const [scoresToAdd, scoresToRemove] = await l.setScores(scores);
        await l.leaderboardUpdate(scoresToAdd, scoresToRemove);
      }
      if (scoreDeltas) {
        const oldScores = await Promise.all(
          scoreDeltas.map(({ playerId }) => l.fetchScore(playerId))
        );
        const oldScoreMap = new Map<string, ScoreInput>();
        const scoresToSet = new Set<ScoreInput>();
        for (const score of oldScores) {
          if (score) {
            oldScoreMap.set(score.Player_ID, {
              playerId: score.Player_ID,
              score: score.Score,
              date: score.Date,
            });
          }
        }
        for (const { playerId, score, date } of scoreDeltas) {
          if (oldScoreMap.has(playerId)) {
            const oldScore = oldScoreMap.get(playerId)!;
            if (oldScore) {
              oldScore.score.forEach((s, i) => {
                logger.debug(
                  `Updating score ${i}: score=${s} delta=${score[i]}`
                );
                oldScore.score[i] += score[i];
              });
              scoresToSet.add(oldScore);
            }
          } else {
            scoresToSet.add({
              playerId,
              score,
              date,
            });
          }
        }

        logger.info(`Applying score delta`);
        const [scoresToAdd, scoresToRemove] = await l.setScores([
          ...scoresToSet,
        ]);
        await l.leaderboardUpdate(scoresToAdd, scoresToRemove);
      }
    } catch (err: any) {
      console.error(err);
    }
  }
};
