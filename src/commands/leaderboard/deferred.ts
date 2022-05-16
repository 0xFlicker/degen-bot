import type { APIEmbed } from "discord-api-types/v10";
import { playerByUuid } from "../../model/CachedMinecraftPlayer.js";
import { createRankerInstance } from "../../ranker/index.js";
import { register as deferredRegister } from "../../update-interaction/commands.js";
import { Experiences, KNOWN_LEADERBOARDS, logger } from "./common.js";

export async function createLeaderboardMessage(
  leaderboardName: Experiences
): Promise<APIEmbed> {
  logger.info(`Creating leaderboard message for ${leaderboardName}`);
  const leaderboard = await createRankerInstance(leaderboardName);
  const lb = await leaderboard.leaderboard();
  logger.info(`Found ${lb.length} leaderboard items`);
  const items = lb.filter((item) => item.Player_ID);
  const playerIds = items.map((item) => item.Player_ID as string);

  if (playerIds.length === 0) {
    return {
      title: "Leaderboard is empty",
    };
  }

  logger.info(`Fetching ${playerIds.length} player names`);
  const players = await Promise.all(playerIds.map(playerByUuid));

  logger.info(`Found ${players.length} players`);
  return {
    title: "Example leaderboard",
    description: `Leader: ${players[0].name}`,
    image: { url: `https://crafatar.com/renders/body/${playerIds[0]}` },
    footer: { text: "Thank you to crafatar.com for providing avatars." },
    fields: items.map((item, index) => ({
      name: `${`${index + 1}`.padStart(3)}: ${players[index].name}`,
      value: `${item.Score[0]}`,
    })),
  };
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
