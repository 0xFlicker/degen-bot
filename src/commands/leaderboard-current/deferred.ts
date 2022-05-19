import {
  fetchCurrentBoard,
  setCurrentBoard,
} from "../../model/CurrentBoard.js";
import { register as deferredRegister } from "../../update-interaction/commands.js";
import { command, getOptions, logger } from "./common.js";

deferredRegister({
  handler: async (interaction) => {
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard command");
    try {
      const leaderboardSetOptions = getOptions(interaction.data.options);
      if (leaderboardSetOptions.boardName) {
        await setCurrentBoard({
          boardName: leaderboardSetOptions.boardName,
          context: leaderboardSetOptions.context,
        });
        return {
          content: "Leaderboard set",
        };
      }
      const currentBoard = await fetchCurrentBoard(
        leaderboardSetOptions.context
      );
      return {
        content: `Current leaderboard: ${currentBoard.boardName}`,
      };
    } catch (error: any) {
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
