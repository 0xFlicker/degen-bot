/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type LeaderboardResponse = {
    items?: Array<{
        Player_ID?: string;
        Score?: Array<number>;
    }>;
    meta?: {
        size?: number;
    };
};
