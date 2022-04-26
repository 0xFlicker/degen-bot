import * as cdk from "aws-cdk-lib";
import { DiscordStack } from "./stack/discord.js";
import { jsonFromSecret } from "./utils/files.js";

const discordSecretsJson = jsonFromSecret("bot-secrets.json");

const app = new cdk.App();

new DiscordStack(app, "discord", {
  // Yes these are not really a "secret" but it's a string that I don't want to store in the repo
  domain: discordSecretsJson.domain,
  publicKey: discordSecretsJson["discord-public-key"],
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
