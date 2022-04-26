import { APIGatewayProxyResult } from "aws-lambda";

export type LambdaResponse =
  | Promise<APIGatewayProxyResult>
  | APIGatewayProxyResult;
