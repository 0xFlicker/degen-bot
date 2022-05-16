import { register } from "../../interactions/command";
import {
  createDeferredInteraction,
  deferredMessage,
} from "../../update-interaction";
import { logger } from "./common";

register({
  handler: async (interaction) => {
    if (interaction.data.name !== "ping") {
      return false;
    }
    logger.info("creating deferred ping");
    const messageId = await createDeferredInteraction(interaction);
    logger.info(
      `Created deferred interaction ${messageId} and acknowledging ping`
    );
    return {
      statusCode: 200,
      body: JSON.stringify(deferredMessage()),
    };
  },
});
