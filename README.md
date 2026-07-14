# Degen Bot

Historical serverless Discord bot built around Discord interaction webhooks, AWS Lambda, API Gateway, SNS deferred responses, and DynamoDB-backed leaderboards.

The project demonstrates a Discord bot architecture that does not keep a persistent gateway connection open. Discord calls an HTTPS interaction URL, the Lambda verifies and acknowledges the interaction, and longer work can be completed through a deferred-response path.

## What It Does

- Registers Discord slash commands through a small CLI.
- Handles Discord `PING` and application-command interactions through a Lambda callback.
- Supports `/ping`, token/image-style responses, leaderboard commands, and player lookups.
- Uses `@0xflicker/ranker` for DynamoDB leaderboard ranking.
- Includes AWS CDK infrastructure for API Gateway, Lambda functions, DynamoDB tables, SNS, S3 static assets, Route53, and ACM.

## Architecture

```mermaid
flowchart LR
  Discord[Discord interaction webhook] --> API[API Gateway /discord]
  API --> Lambda[discord Lambda]
  Lambda --> Verify[Ed25519 signature verification]
  Lambda --> DDB[(DynamoDB)]
  Lambda --> SNS[SNS deferred-message topic]
  SNS --> Deferred[deferred response Lambda]
  Deferred --> DiscordAPI[Discord callback API]
  Lambda --> Ranker[@0xflicker/ranker]
  Ranker --> DDB
  Admin[CLI] --> DiscordAPI
```

## Repository Map

- `src/lambda/discord.ts` - Discord interaction callback.
- `src/lambda/deferred.ts` - delayed response worker for interactions that need more than the initial callback window.
- `src/lambda/leaderboard.ts`, `src/lambda/leaderboard-fetch.ts`, `src/lambda/players.ts`, `src/lambda/ingest.ts` - supporting serverless handlers.
- `src/cli.ts` - command registration CLI.
- `src/ranker` - project-local wrapper around `@0xflicker/ranker`.
- `deploy/src/stack/discord.ts` - AWS CDK stack for the bot and supporting AWS resources.
- `images/` - static assets used by response embeds and docs.

## Setup and Deployment

The original setup uses:

- Node.js 16.x
- Yarn
- AWS CLI credentials
- AWS CDK
- optional `sops`/GPG for encrypted bot secrets
- a Discord developer application with client id, public key, and bot token

Install dependencies in both the repository root and `deploy/`:

```bash
yarn
cd deploy
yarn
```

Build Lambda bundles from the repository root:

```bash
yarn build
```

Deploy the AWS stack from `deploy/`:

```bash
yarn deploy
```

The deployed callback path is `/discord`. Add the resulting API Gateway URL or custom domain to the Discord application's Interaction URL field.

## Command Registration

After deployment, register slash commands for a guild:

```bash
yarn discord:cli commands create \
  --client_id <discord-client-id> \
  --guild_id <discord-guild-id> \
  --token <discord-bot-token>
```

## Maintenance Status

This is an older reference implementation rather than an actively maintained product. The architecture remains useful as an example of Discord interaction-webhook handling on AWS Lambda, but dependency versions and Discord/AWS APIs should be reviewed before reusing it in a new deployment.

## Validation

```bash
yarn test
```

The repository has Jest tests, but the README intentionally avoids deployment-status claims for any currently running bot.
