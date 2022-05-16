import { SNS } from "@aws-sdk/client-sns";

export function createSNS() {
  return new SNS({
    apiVersion: "2010-03-31",
  });
}
