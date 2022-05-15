import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let instance: DynamoDBDocumentClient;

export function create() {
  const isTest = process.env.NODE_ENV === "test";
  const config = {
    ...(isTest && {
      endpoint: "http://localhost:8000",
      region: "local-env",
    }),
  };
  const ddb = new DynamoDBClient(config);
  return DynamoDBDocumentClient.from(ddb, {
    marshallOptions: {
      convertEmptyValues: true,
    },
  });
}

export function getDb() {
  if (!instance) {
    instance = create();
  }
  return instance;
}
