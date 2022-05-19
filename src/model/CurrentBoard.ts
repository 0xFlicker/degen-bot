import { getDb } from "../storage/db/dynamo";
import { CurrentBoardDAO, ICurrentBoard } from "../storage/model/CurrentBoard";

const currentBoardDao = new CurrentBoardDAO(getDb());

export async function fetchCurrentBoard(context: string) {
  const currentBoard = await currentBoardDao.findByContext(context);
  return currentBoard;
}

export async function setCurrentBoard(currentBoard: ICurrentBoard) {
  await currentBoardDao.set(currentBoard);
}
