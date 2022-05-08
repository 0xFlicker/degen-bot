import axios from "axios";

export interface IPlayerDbMinecraftResponse {
  code: "player.found" | "minecraft.api_failure";
  message: string;
  success: boolean;
  error: boolean;
  data: {
    player: IMinecraftPlayer;
  };
}

export interface IPlayerDbXboxResponse {
  code: "player.found" | "xbox.api_failure";
  message: string;
  success: boolean;
  error: boolean;
  data: {
    player: IMinecraftPlayer;
  };
}

export type TPlayerDbResponse =
  | IPlayerDbMinecraftResponse
  | IPlayerDbXboxResponse;

export interface IMinecraftPlayer {
  username: string;
  id: string;
  avatar: string;
}

import { MinecraftPlayerType } from "../storage/model/MinecraftPlayer";
import { createLogger } from "../utils/logging";

const logger = createLogger();
logger.setKey("service", "playerdb");

export async function fetchPlayerName(uuid: string) {
  const playerType = uuid.startsWith("00000000-0000-0000")
    ? MinecraftPlayerType.XBOX
    : MinecraftPlayerType.MOJANG;
  if (playerType === MinecraftPlayerType.MOJANG) {
    const response = await axios.get<IPlayerDbMinecraftResponse>(
      `https://playerdb.co/api/player/minecraft/${uuid}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (response.data.code === "player.found") {
      return {
        type: playerType,
        player: response.data.data.player,
      };
    }
    throw new Error(response.data.message);
  }
  if (playerType === MinecraftPlayerType.XBOX) {
    const response = await axios.get<IPlayerDbXboxResponse>(
      `https://playerdb.co/api/player/xbox/${Number(
        `0x${uuid.replace("-", "")}`
      )}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (response.data.code === "player.found") {
      return {
        type: playerType,
        player: response.data.data.player,
      };
    }
    throw new Error(response.data.message);
  }
  throw new Error("Unknown player type");
}
