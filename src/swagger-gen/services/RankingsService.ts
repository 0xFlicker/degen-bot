/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RankingsService {

    /**
     * Get bulk score and ranking
     * @param experience The experience to get scores from
     * @param requestBody
     * @returns any successful operation
     * @throws ApiError
     */
    public static getBulkRankings(
        experience: 'potato',
        requestBody: Array<{
            playerId?: string;
        }>,
    ): CancelablePromise<Array<{
        score?: Array<number>;
        rankings?: Array<{
            rank?: number;
            period?: string;
        }>;
    }>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ranks/{experience}',
            path: {
                'experience': experience,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get a specific score and ranking
     * @param experience The experience to get scores from
     * @param requestBody
     * @returns any successful operation
     * @throws ApiError
     */
    public static getRankings(
        experience: 'potato',
        requestBody: {
            playerId?: string;
        },
    ): CancelablePromise<{
        score?: Array<number>;
        rankings?: Array<{
            rank?: number;
            period?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/rank/{experience}',
            path: {
                'experience': experience,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}