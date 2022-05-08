/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type RankingResponse = {
    score?: Array<number>;
    rankings?: Array<{
        rank?: number;
        period?: string;
    }>;
};
