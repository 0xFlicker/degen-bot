import { DocumentClient } from "aws-sdk/clients/dynamodb";
import axios from "axios";
import MockAxios from "axios-mock-adapter";
import { v4 as makeUuid } from "uuid";
import { create } from "../storage/db/dynamo";
import { IMinecraftPlayer } from "../service/playerdb";
import {
  MinecraftPlayer,
  MinecraftPlayerDAO,
  MinecraftPlayerType,
} from "../storage/model/MinecraftPlayer";
import { playerByUuid } from "./CachedMinecraftPlayer";

const mAxios = new MockAxios(axios);

interface IResponseType {
  type: MinecraftPlayerType;
  player: IMinecraftPlayer;
}
describe("CachedMinecraftPlayer", () => {
  let db: DocumentClient;

  beforeEach(() => {
    db = create();
    mAxios.reset();
  });

  it("java - fetches from service if not in database", async () => {
    const uuid = makeUuid();
    const player = {
      username: "test-name",
      id: uuid,
      avatar: "avatarUrl",
    };
    mAxios
      .onGet(`https://playerdb.co/api/player/minecraft/${uuid}`)
      .replyOnce(200, {
        code: "player.found",
        data: player,
      });
    const responsePlayer = await playerByUuid(uuid);
    expect(responsePlayer.name).toBe("test-name");
    expect(responsePlayer.avatar).toBe("avatarUrl");
    expect(responsePlayer.uuid).toBe(uuid);
    expect(responsePlayer.type).toBe(MinecraftPlayerType.MOJANG);
    expect(mAxios.history.get).toHaveLength(1);
    // check db
    const dbPlayer = await MinecraftPlayerDAO.findByUuid(db, uuid);
    expect(MinecraftPlayer.fromObject(dbPlayer)).toEqual(responsePlayer);
    // now load again from cache
    const responsePlayer2 = await playerByUuid(uuid);
    expect(mAxios.history.get).toHaveLength(1);
    expect(responsePlayer2).toEqual(responsePlayer);
  });

  it("bedrock - fetches from service if not in database", async () => {
    const uuid = "00000000-0000-0000-0011-12345678";
    const numericUuid = Number(`0x${uuid.replace("-", "")}`);
    const player = {
      username: "test-name",
      id: uuid,
      avatar: "avatarUrl",
    };
    mAxios
      .onGet(`https://playerdb.co/api/player/xbox/${numericUuid}`)
      .replyOnce(200, {
        code: "player.found",
        data: player,
      });
    const responsePlayer = await playerByUuid(uuid);
    expect(responsePlayer.name).toBe("test-name");
    expect(responsePlayer.avatar).toBe("avatarUrl");
    expect(responsePlayer.uuid).toBe(uuid);
    expect(responsePlayer.type).toBe(MinecraftPlayerType.XBOX);
    expect(mAxios.history.get).toHaveLength(1);
    // check db
    const dbPlayer = await MinecraftPlayerDAO.findByUuid(db, uuid);
    expect(MinecraftPlayer.fromObject(dbPlayer)).toEqual(responsePlayer);
    // now load again from cache
    const responsePlayer2 = await playerByUuid(uuid);
    expect(mAxios.history.get).toHaveLength(1);
    expect(responsePlayer2).toEqual(responsePlayer);
  });
});
