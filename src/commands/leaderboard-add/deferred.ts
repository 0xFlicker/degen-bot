import { createRanker } from "../../ranker/index.js";
import { register as deferredRegister } from "../../update-interaction/commands.js";
import { command, getOptions, logger, OptionsError } from "./common.js";

deferredRegister({
  handler: async (interaction) => {
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard command");
    try {
      const leaderboardCreateOptions = getOptions(interaction.data.options);
      await createRanker(leaderboardCreateOptions);
      return {
        content: "Leaderboard created",
      };
    } catch (error: any) {
      if (error instanceof OptionsError) {
        return {
          content: error.message,
        };
      }
      logger.error(error);
      if (interaction.member?.nick) {
        return {
          content: `Sorry ${interaction.member.nick}, I can't do that.}`,
        };
      }
      return {
        content: `Sorry, I can't do that.`,
      };
    }
  },
});
