/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ScoreService {

    /**
     * Get a set of scores
     * @param experience The experience to get scores from
     * @param requestBody
     * @returns any successful operation
     * @throws ApiError
     */
    public static getBulkScore(
        experience: 'potato',
        requestBody: Array<{
            playerId?: string;
        }>,
    ): CancelablePromise<Array<{
        score?: Array<number>;
    }>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/scores/{experience}',
            path: {
                'experience': experience,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get a specific score
     * @param experience The experience to get scores from
     * @param requestBody
     * @returns any successful operation
     * @throws ApiError
     */
    public static getScore(
        experience: 'potato',
        requestBody: {
            playerId?: string;
        },
    ): CancelablePromise<{
        score?: Array<number>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/score/{experience}',
            path: {
                'experience': experience,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}