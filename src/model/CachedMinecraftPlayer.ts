import { NotFoundError } from "../error/NotFound";
import { getDb } from "../storage/db/dynamo";
import {
  MinecraftPlayerDAO,
  MinecraftPlayer,
} from "../storage/model/MinecraftPlayer";
import { fetchPlayerName } from "../service/playerdb";
import { createLogger } from "../utils/logging";

const logger = createLogger();
logger.setKey("service", "playerdb");

export async function playerByUuid(uuid: string) {
  // check MinecraftPlayerDAO
  try {
    const player = await MinecraftPlayerDAO.findByUuid(getDb(), uuid);
    return MinecraftPlayer.fromObject(player);
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      // fetch player name
      const { type, player } = await fetchPlayerName(uuid);
      logger.info(`Fetched player ${player.username}`);
      return MinecraftPlayer.fromObject(
        await MinecraftPlayerDAO.create(getDb(), {
          uuid,
          type,
          name: player.username,
          avatar: player.avatar,
        })
      );
    }
    throw err;
  }
}
