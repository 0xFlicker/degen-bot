import { register } from "../../interactions/command";
import { Experiences } from "../../swagger-gen";
import { createDeferredInteraction, deferredMessage } from "../../update-interaction";
import { logger, KNOWN_LEADERBOARDS } from "./common";

register({
  handler: async (interaction) => {
    if (interaction.data.name !== "mclb") {
      return false;
    }
    logger.info("Received leaderboard command");
    const leaderboardOption = interaction.data.options.find(
      ({ name }) => name === "name"
    );
    const leaderboardName: Experiences =
      leaderboardOption?.value ?? process.env.CURRENT_LEADERBOARD;
    if (!KNOWN_LEADERBOARDS.includes(leaderboardName)) {
      logger.info("Unknown leaderboard");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "unknown leaderboard" }),
      };
    }

    const messageId = await createDeferredInteraction(interaction);
    logger.info(`Created deferred interaction ${messageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify(deferredMessage()),
    };
  },
});
