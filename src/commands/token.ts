import { InteractionResponseType } from "discord-api-types/v10";
import { MessageEmbed } from "discord.js";
import { register } from "../interactions/command.js";
import { createLogger } from "../utils/logging";

if (!process.env.STATIC_IMAGE_URL) {
  throw new Error("STATIC_IMAGE_URL must be set");
}
const staticImageUrl = process.env.STATIC_IMAGE_URL;

const logger = createLogger();
logger.setKey("command", "token");

register({
  handler: (interaction) => {
    if (interaction.data.name !== "token") {
      return false;
    }
    const tokenOption = interaction.data.options.find(
      ({ name }) => name === "id"
    );
    if (!tokenOption) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "unknown command" }),
      };
    }
    const token: number = tokenOption.value;

    const message = new MessageEmbed()
      .setImage(`${staticImageUrl}/oddy.png`)
      .setTitle("Show me")
      .addField("Token", token.toString());
    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [message],
        },
      }),
    };
  },
});
