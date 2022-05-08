import { InteractionResponseType } from "discord-api-types/v10";
import { MessageEmbed } from "discord.js";
import { register } from "../interactions/command.js";
import { createLogger } from "../utils/logging";
import { LeaderboardService, Experiences } from "../swagger-gen/index.js";
import { playerByUuid } from "../model/CachedMinecraftPlayer.js";

const logger = createLogger();
logger.setKey("command", "leaderboard");

const KNOWN_LEADERBOARDS = [Experiences.POTATO];
const ONLY_PERIOD = "alltime";

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
    logger.info("Fetching leaderboard");
    const lb = await LeaderboardService.getLeaderboard(
      leaderboardName,
      ONLY_PERIOD,
      10
    );
    // collect all player_ids
    if (typeof lb.items === "undefined") {
      logger.info("No leaderboard items");
      const message = new MessageEmbed();
      message.setTitle("Leaderboard is empty");
      return {
        statusCode: 200,
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [message],
        },
      };
    }
    logger.info(`Found ${lb.items.length} leaderboard items`);
    const items = lb.items.filter((item) => item.Player_ID);
    const playerIds = items.map((item) => item.Player_ID as string);

    if (playerIds.length === 0) {
      const message = new MessageEmbed();
      message.setTitle("Leaderboard is empty");
      return {
        statusCode: 200,
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [message],
        },
      };
    }

    logger.info(`Fetching ${playerIds.length} player names`);
    const players = await Promise.all(playerIds.map(playerByUuid));

    logger.info(`Found ${players.length} players`);
    const message = new MessageEmbed()
      .setTitle(`Example leaderboard`)
      .setDescription(`1st place: ${players[0].name}`)
      .setImage(`https://crafatar.com/renders/body/${playerIds[0]}`)
      .setFooter({ text: "Thank you to crafatar.com for providing avatars." });

    for (let i = 1; i < players.length; i++) {
      message.addField(
        `${`${i + 1}`.padStart(3)}: ${players[i].name}`,
        `${items[i]?.Score?.[0]}` || "0"
      );
    }

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
