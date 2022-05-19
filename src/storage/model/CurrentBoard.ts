import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { NotFoundError } from "../../error/NotFound";

export interface ICurrentBoard {
  context: string;
  boardName: string;
}

export class CurrentBoardDAO {
  public static readonly TABLE_NAME =
    process.env.TABLE_NAME_CURRENT_BOARD || "CurrentBoard";
  private db: DynamoDBDocumentClient;

  constructor(db: DynamoDBDocumentClient) {
    this.db = db;
  }

  public async set(currentBoard: ICurrentBoard): Promise<CurrentBoardDAO> {
    await this.db.send(
      new PutCommand({
        TableName: CurrentBoardDAO.TABLE_NAME,
        Item: {
          context: currentBoard.context,
          boardName: currentBoard.boardName,
        },
      })
    );
    return this;
  }

  public async findByContext(context: string): Promise<CurrentBoard> {
    const currentBoard = await this.db.send(
      new GetCommand({
        TableName: CurrentBoardDAO.TABLE_NAME,
        Key: { context },
      })
    );
    if (!currentBoard.Item) {
      throw new NotFoundError("CurrentBoard not found");
    }
    return CurrentBoard.fromObject(currentBoard.Item);
  }
}

export class CurrentBoard implements ICurrentBoard {
  public context: string;
  public boardName: string;

  constructor(context: string, boardName: string) {
    this.context = context;
    this.boardName = boardName;
  }

  public fromPartial(partial: Partial<ICurrentBoard>): CurrentBoard {
    return CurrentBoard.fromJson({
      ...this.toJson(),
      ...partial,
    });
  }

  public static fromJson(json: any): CurrentBoard {
    return new CurrentBoard(json.context, json.boardName);
  }

  public toJson(): ICurrentBoard {
    return {
      context: this.context,
      boardName: this.boardName,
    };
  }

  public toString(): string {
    return JSON.stringify(this.toJson());
  }

  public equals(other: CurrentBoard): boolean {
    return this.context === other.context && this.boardName === other.boardName;
  }

  public clone(): CurrentBoard {
    return new CurrentBoard(this.context, this.boardName);
  }

  public static fromString(str: string): CurrentBoard {
    return CurrentBoard.fromJson(JSON.parse(str));
  }

  public static fromObject(obj: any): CurrentBoard {
    return CurrentBoard.fromJson(obj);
  }
}
