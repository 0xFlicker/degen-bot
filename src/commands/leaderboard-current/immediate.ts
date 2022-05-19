import { register } from "../../interactions/command";
import {
  createDeferredInteraction,
  deferredMessage,
} from "../../update-interaction";
import { logger, command } from "./common";

register({
  handler: async (interaction) => {
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard-current command");

    const messageId = await createDeferredInteraction(interaction);
    logger.info(`Created deferred interaction ${messageId}`);

    return {
      statusCode: 200,
      body: JSON.stringify(deferredMessage()),
    };
  },
});
