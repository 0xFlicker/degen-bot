import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NotFoundError } from "../../error/NotFound";

export interface UserTokenModel {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export class UserTokenAccess {
  public static readonly TABLE_NAME = "UserToken";
  private userToken: UserToken;
  private db: DocumentClient;

  public get id(): string {
    return this.userToken.id;
  }
  public get accessToken(): string {
    return this.userToken.accessToken;
  }
  public get refreshToken(): string {
    return this.userToken.refreshToken;
  }

  constructor(db: DocumentClient, userToken: UserTokenModel) {
    this.userToken = UserToken.fromJson(userToken);
    this.db = db;
  }

  public static async fetch(
    db: DocumentClient,
    id: string
  ): Promise<UserTokenAccess> {
    const userToken = await db
      .get({
        TableName: UserTokenAccess.TABLE_NAME,
        Key: { id },
      })
      .promise();
    if (!userToken.Item) {
      throw new NotFoundError("UserToken not found");
    }
    return new UserTokenAccess(db, UserToken.fromObject(userToken.Item));
  }

  public async update(userToken: Partial<UserTokenModel>): Promise<void> {
    this.userToken = this.userToken.fromPartial(userToken);
    await this.db
      .update({
        TableName: UserTokenAccess.TABLE_NAME,
        Key: { id: this.id },
        UpdateExpression:
          "set #accessToken = :accessToken, #refreshToken = :refreshToken",
        ExpressionAttributeNames: {
          "#accessToken": "accessToken",
          "#refreshToken": "refreshToken",
        },
        ExpressionAttributeValues: {
          ":accessToken": this.accessToken,
          ":refreshToken": this.refreshToken,
        },
      })
      .promise();
  }
}

export class UserToken implements UserTokenModel {
  public id: string;
  public accessToken: string;
  public refreshToken: string;

  constructor(id: string, accessToken: string, refreshToken: string) {
    this.id = id;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public fromPartial(partial: Partial<UserTokenModel>): UserToken {
    return UserToken.fromJson({
      ...this.toJson(),
      ...partial,
    });
  }

  public static fromJson(json: any): UserToken {
    return new UserToken(json.id, json.accessToken, json.refreshToken);
  }

  public toJson(): any {
    return {
      id: this.id,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toJson());
  }

  public equals(other: UserToken): boolean {
    return (
      this.id === other.id &&
      this.accessToken === other.accessToken &&
      this.refreshToken === other.refreshToken
    );
  }

  public clone(): UserToken {
    return new UserToken(this.id, this.accessToken, this.refreshToken);
  }

  public static fromString(str: string): UserToken {
    return UserToken.fromJson(JSON.parse(str));
  }

  public static fromObject(obj: any): UserToken {
    return UserToken.fromJson(obj);
  }
}
