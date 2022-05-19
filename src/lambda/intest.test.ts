import { ScoreInput } from "@0xflicker/ranker";
import { v4 as createUuid } from "uuid";
import { handler } from "./ingest";
import { SQSEvent, SNSEventRecord, Context } from "aws-lambda";
import { initRanker } from "../ranker";
import { Experiences } from "../commands/leaderboard/common";

function scoringEvent(
  records: {
    boardName: Experiences;
    scores?: ScoreInput[];
    scoreDeltas?: ScoreInput[];
  }[]
): SQSEvent {
  return {
    Records: records.map((r) => {
      const snsEventRecord: Partial<SNSEventRecord["Sns"]> = {
        Type: "Notification",
        MessageId: createUuid(),
        Message: JSON.stringify(r),
      };
      return {
        messageId: createUuid(),
        body: JSON.stringify(snsEventRecord),
        attributes: {
          ApproximateFirstReceiveTimestamp: "0",
          ApproximateReceiveCount: "1",
          SenderId: "0",
          SentTimestamp: "0",
          AWSTraceHeader: createUuid(),
          MessageDeduplicationId: createUuid(),
          MessageGroupId: createUuid(),
          SequenceNumber: createUuid(),
        },
        messageAttributes: {},
        eventSource: "aws:sns",
        awsRegion: "us-east-1",
        eventSourceARN: "arn:aws:sns:us-east-1:123456789012:my-topic",
        md5OfBody: "",
        receiptHandle: "",
      };
    }),
  };
}

function fakeContext(): Context {
  return {
    functionName: "fake",
    awsRequestId: "fake",
    callbackWaitsForEmptyEventLoop: true,
    logGroupName: "fake",
    functionVersion: "fake",
    getRemainingTimeInMillis: () => 0,
    invokedFunctionArn: "fake",
    logStreamName: "fake",
    memoryLimitInMB: "0",
    clientContext: {
      client: {
        appPackageName: "fake",
        appTitle: "fake",
        appVersionCode: "fake",
        appVersionName: "fake",
        installationId: "fake",
      },
      env: {
        locale: "fake",
        make: "fake",
        model: "fake",
        platform: "fake",
        platformVersion: "fake",
      },
    },
    done: () => {},
    fail: () => {},
    succeed: () => {},
    identity: {
      cognitoIdentityId: "fake",
      cognitoIdentityPoolId: "fake",
    },
  };
}

describe("ingest", () => {
  it("set scores", async () => {
    const records = [
      {
        boardName: Experiences.POTATO,
        scores: [
          {
            playerId: "1",
            score: [1],
          },
        ],
      },
    ];
    const event = scoringEvent(records);
    const result = await handler(event, fakeContext(), () => {});
    expect(result).toBeUndefined();
    const ranker = await initRanker(Experiences.POTATO);
    const leaderboard = await ranker.leaderboard();
    expect(leaderboard).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Player_ID: "1",
          Score: [1],
          Board_Name: "potato",
        }),
      ])
    );
  });

  it("set score deltas", async () => {
    const records = [
      {
        boardName: Experiences.POTATO,
        scores: [
          {
            playerId: "1",
            score: [1],
          },
          {
            playerId: "2",
            score: [2],
          },
          {
            playerId: "3",
            score: [3],
          },
        ],
      },
    ];
    const event = scoringEvent(records);
    const result = await handler(event, fakeContext(), () => {});
    expect(result).toBeUndefined();
    const ranker = await initRanker(Experiences.POTATO);
    let leaderboard = await ranker.leaderboard();
    expect(leaderboard).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Player_ID: "1",
          Score: [1],
          Board_Name: "potato",
        }),
        expect.objectContaining({
          Player_ID: "2",
          Score: [2],
          Board_Name: "potato",
        }),
        expect.objectContaining({
          Player_ID: "3",
          Score: [3],
          Board_Name: "potato",
        }),
      ])
    );

    await handler(
      scoringEvent([
        {
          boardName: Experiences.POTATO,
          scoreDeltas: [
            {
              playerId: "1",
              score: [1],
            },
            {
              playerId: "2",
              score: [-1],
            },
          ],
        },
      ]),
      fakeContext(),
      () => {}
    );
    leaderboard = await ranker.leaderboard();
    expect(leaderboard).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Player_ID: "1",
          Score: [2],
          Board_Name: "potato",
        }),
        expect.objectContaining({
          Player_ID: "2",
          Score: [1],
          Board_Name: "potato",
        }),
        expect.objectContaining({
          Player_ID: "3",
          Score: [3],
          Board_Name: "potato",
        }),
      ])
    );
  });
});
