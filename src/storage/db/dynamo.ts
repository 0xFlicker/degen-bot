import { DocumentClient } from "aws-sdk/clients/dynamodb";

let instance: DocumentClient;

export function create() {
  const isTest = process.env.JEST_WORKER_ID;
  const config = {
    convertEmptyValues: true,
    ...(isTest && {
      endpoint: "localhost:8000",
      sslEnabled: false,
      region: "local-env",
    }),
  };

  return new DocumentClient(config);
}

export function getDb() {
  if (!instance) {
    instance = create();
  }
  return instance;
}
