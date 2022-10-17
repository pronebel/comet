import { getUserName } from '../sync/user';

const userName = getUserName();

export const commandHistoryKey = `commandList`;
export const undoHistoryKey = `${userName}:undo`;
export const replayIndexKey = 'replayIndex';
