/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class LeaderboardService {

    /**
     * Get a specific leaderboard
     * @param experience The experience to get scores from
     * @param timeframe The period length of time for the leaderboard
     * @param count The number of records to include
     * @param start Start leaderboard from this record
     * @returns any successful operation
     * @throws ApiError
     */
    public static getLeaderboard(
        experience: 'potato',
        timeframe: 'alltime' | 'weekly' | 'daily',
        count?: number,
        start?: number,
    ): CancelablePromise<{
        items?: Array<{
            Player_ID?: string;
            Score?: Array<number>;
        }>;
        meta?: {
            size?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/leaderboard/{experience}/{timeframe}',
            path: {
                'experience': experience,
                'timeframe': timeframe,
            },
            query: {
                'count': count,
                'start': start,
            },
        });
    }

}