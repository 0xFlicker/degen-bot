import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NotFoundError } from "../../error/NotFound";

export enum MinecraftPlayerType {
  MOJANG = "mojang",
  XBOX = "xbox",
}

export interface IMinecraftPlayer {
  uuid: string;
  type: MinecraftPlayerType;
  name: string;
  avatar: string;
}

export class MinecraftPlayerDAO {
  public static readonly TTL_ONE_WEEK = 60 * 60 * 24 * 7 * 1000;
  public static readonly TABLE_NAME =
    process.env.TABLE_NAME_MINECRAFT_PLAYER || "MinecraftPlayer";
  private minecraftPlayer: MinecraftPlayer;
  private db: DynamoDBDocumentClient;

  public get uuid(): string {
    return this.minecraftPlayer.uuid;
  }
  public get type(): string {
    return this.minecraftPlayer.type;
  }
  public get name(): string {
    return this.minecraftPlayer.name;
  }
  public get avatar(): string {
    return this.minecraftPlayer.avatar;
  }

  constructor(db: DynamoDBDocumentClient, userToken: IMinecraftPlayer) {
    this.minecraftPlayer = MinecraftPlayer.fromJson(userToken);
    this.db = db;
  }

  public static async create(
    db: DynamoDBDocumentClient,
    playerModel: IMinecraftPlayer
  ): Promise<MinecraftPlayerDAO> {
    await db.send(
      new PutCommand({
        TableName: MinecraftPlayerDAO.TABLE_NAME,
        Item: {
          ttl: new Date().getTime() + MinecraftPlayerDAO.TTL_ONE_WEEK,
          ...playerModel,
        },
      })
    );
    return new MinecraftPlayerDAO(db, playerModel);
  }

  public static async findByUuid(
    db: DynamoDBDocumentClient,
    uuid: string
  ): Promise<MinecraftPlayerDAO> {
    const userToken = await db.send(
      new GetCommand({
        TableName: MinecraftPlayerDAO.TABLE_NAME,
        Key: { uuid },
      })
    );
    if (!userToken.Item) {
      throw new NotFoundError("MinecraftPlayer not found");
    }
    return new MinecraftPlayerDAO(
      db,
      MinecraftPlayer.fromObject(userToken.Item)
    );
  }

  public async update(
    playerNameModel: Partial<IMinecraftPlayer>
  ): Promise<void> {
    this.minecraftPlayer = this.minecraftPlayer.fromPartial(playerNameModel);
    await this.db.send(
      new UpdateCommand({
        TableName: MinecraftPlayerDAO.TABLE_NAME,
        Key: { uuid: this.uuid },
        UpdateExpression: "set #name = :name, #avatar = :avatar",
        ExpressionAttributeNames: {
          "#name": "name",
          "#avatar": "avatar",
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":name": this.name,
          ":avatar": this.avatar,
          ":ttl": new Date().getTime() + MinecraftPlayerDAO.TTL_ONE_WEEK,
        },
      })
    );
  }
}

export class MinecraftPlayer implements IMinecraftPlayer {
  public uuid: string;
  public type: MinecraftPlayerType;
  public name: string;
  public avatar: string;

  constructor(
    uuid: string,
    type: MinecraftPlayerType,
    name: string,
    avatar: string
  ) {
    this.uuid = uuid;
    this.type = type;
    this.name = name;
    this.avatar = avatar;
  }

  public fromPartial(partial: Partial<IMinecraftPlayer>): MinecraftPlayer {
    return MinecraftPlayer.fromJson({
      ...this.toJson(),
      ...partial,
    });
  }

  public static fromJson(json: any): MinecraftPlayer {
    return new MinecraftPlayer(json.uuid, json.type, json.name, json.avatar);
  }

  public toJson(): any {
    return {
      uuid: this.uuid,
      type: this.type,
      name: this.name,
      avatar: this.avatar,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toJson());
  }

  public equals(other: MinecraftPlayer): boolean {
    return (
      this.uuid === other.uuid &&
      this.type === other.type &&
      this.name === other.name &&
      this.avatar === other.avatar
    );
  }

  public clone(): MinecraftPlayer {
    return new MinecraftPlayer(this.uuid, this.type, this.name, this.avatar);
  }

  public static fromString(str: string): MinecraftPlayer {
    return MinecraftPlayer.fromJson(JSON.parse(str));
  }

  public static fromObject(obj: any): MinecraftPlayer {
    return MinecraftPlayer.fromJson(obj);
  }
}
