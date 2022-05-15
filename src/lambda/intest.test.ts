import { ScoreInput } from "@0xflicker/ranker";
import { v4 as createUuid } from "uuid";
import { Experiences } from "../swagger-gen";
import { handler } from "./ingest";
import { SQSEvent, SNSEventRecord, Context } from "aws-lambda";
import { createRankerInstance } from "../ranker";

function scoringEvent(
  records: {
    boardName: Experiences;
    scores: ScoreInput[];
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
  it("sanity", async () => {
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
    const ranker = await createRankerInstance(Experiences.POTATO);
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
});
