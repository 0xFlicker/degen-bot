import { register } from "../../interactions/command";
import {
  createDeferredInteraction,
  deferredMessage,
} from "../../update-interaction";
import { command, logger } from "./common";

register({
  handler: async (interaction) => {
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard command");

    const messageId = await createDeferredInteraction(interaction);
    logger.info(`Created deferred interaction ${messageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify(deferredMessage()),
    };
  },
});
