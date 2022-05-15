import type { APIEmbed } from "discord-api-types/v10";
import { MessageEmbed } from "discord.js";
import { playerByUuid } from "../../model/CachedMinecraftPlayer.js";
import { createRankerInstance } from "../../ranker/index.js";
import {
  asApiMessageEmbed,
  register as deferredRegister,
} from "../../update-interaction/commands.js";
import { Experiences, KNOWN_LEADERBOARDS, logger } from "./common.js";

export async function createLeaderboardMessage(
  leaderboardName: Experiences
): Promise<APIEmbed> {
  const leaderboard = await createRankerInstance(leaderboardName);
  const lb = await leaderboard.leaderboard();
  logger.info(`Found ${lb.length} leaderboard items`);
  const items = lb.filter((item) => item.Player_ID);
  const playerIds = items.map((item) => item.Player_ID as string);

  if (playerIds.length === 0) {
    const message = new MessageEmbed();
    message.setTitle("Leaderboard is empty");
    return asApiMessageEmbed(message);
  }

  logger.info(`Fetching ${playerIds.length} player names`);
  const players = await Promise.all(playerIds.map(playerByUuid));

  logger.info(`Found ${players.length} players`);
  const message = new MessageEmbed()
    .setTitle(`Example leaderboard`)
    .setDescription(`Leader: ${players[0].name}`)
    .setImage(`https://crafatar.com/renders/body/${playerIds[0]}`)
    .setFooter({ text: "Thank you to crafatar.com for providing avatars." });

  for (let i = 0; i < players.length; i++) {
    message.addField(
      `${`${i + 1}`.padStart(3)}: ${players[i].name}`,
      `${items[i]?.Score?.[0]}` || "0"
    );
  }
  // This is fine
  return asApiMessageEmbed(message);
}

deferredRegister({
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
        content: "unknown leaderboard",
      };
    }

    return {
      embeds: [await createLeaderboardMessage(leaderboardName)],
    };
  },
});
