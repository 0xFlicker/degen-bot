import type { APIEmbed } from "discord-api-types/v10";
import { playerByUuid } from "../../model/CachedMinecraftPlayer.js";
import { fetchCurrentBoard } from "../../model/CurrentBoard.js";
import { fetchBoard, initRanker } from "../../ranker/index.js";
import { register as deferredRegister } from "../../update-interaction/commands.js";
import { command, CONTEXT, logger } from "./common.js";

export async function createLeaderboardMessage(
  boardName: string,
  leaderboardName: string
): Promise<APIEmbed> {
  logger.info(`Creating leaderboard message for ${boardName}`);
  const leaderboard = await initRanker(boardName);
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
    title: `${leaderboardName} leaderboard`,
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
    if (interaction.data.name !== command) {
      return false;
    }
    logger.info("Received leaderboard command");
    const leaderboardOption = interaction.data.options?.find(
      ({ name }) => name === "name"
    );
    if (!leaderboardOption || !leaderboardOption.value) {
      logger.info("No leaderboard option");
      const currentBoard = await fetchCurrentBoard(CONTEXT);
      if (!currentBoard) {
        return {
          content: "No leaderboard set",
        };
      }
      const { boardName } = currentBoard;
      const board = await fetchBoard(boardName);
      if (!board) {
        return {
          content: `No leaderboard found for ${boardName}`,
        };
      }
      const { Display_Name: displayName } = board;
      return {
        embeds: [await createLeaderboardMessage(boardName, displayName)],
      };
    }
    const boardName = leaderboardOption.value;
    const board = await fetchBoard(boardName);
    if (!board) {
      return {
        content: `No leaderboard found for ${boardName}`,
      };
    }
    const { Display_Name: displayName } = board;
    return {
      embeds: [await createLeaderboardMessage(boardName, displayName)],
    };
  },
});
