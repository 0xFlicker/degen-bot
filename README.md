# Introduction

Example / Demo implementation of a Discord built with serverless callbacks using AWS Lambda and Discord's interaction URL

## Theory of operation

In the beginning, in order to implement a Discord bot, one hard to initiate a persistent connection with Discord. The persistent connection means the bot must be "always on" and introduces scaling issues as the number of concurrent guilds the bot is connected to (see sharding)

With the release of the Interaction URL Discord now provides an alternative way to build a bot where instead of a persistent connection a webhook is installed for the application and Discord will call the interaction URL and expect the service at that URL to return a response. This has the benefit of being able to implement a Discord bot as a serverless function that does not need to maintain a persistent connection.

## Prerequisites

This example uses the following tools:

- NodeJS 16.x (installed via [nvm](https://github.com/nvm-sh/nvm) preferred)
- yarn `npm i -g yarn`
- [sops](https://github.com/mozilla/sops) / [gpg](https://gnupg.org/)
- [aws cli](https://aws.amazon.com/cli/)

## Setup

I am writing these instructions from memory and having done some of the steps long ago, so please bear with me. Pull requests accepted to fill in any details!

### Discord

Sign up for a [discord developer account](https://discord.com/developers/applications).

Create a new application.

Create a new bot.

Customize to your liking.

Take note of the client id, public key and bot token. They will be needed later.

### node

After forking and cloning the repo, yarn `yarn` inside of the root of the repo as well as inside of the `deploy` directory. I'm not sure why I split that part into its own repo. Seems unnecessary in hindsight.

### sops

sops is used to encrypt secrets. This is completely optional and "secrets" may be hard-coded into [deploy/src/app.ts](deploy/src/app.ts).

Instead of using gpg, sops may be configured to use AWS kms. See sops documentation for details.

To use GPG, first create a GPG key:

```
gpg --full-generate-key
```

Replace the `gpg` array in [.sops.yaml](.sops.yaml) with the fingerprint generated from creating the gpg key.

If you want, replace [secrets/bot-secrets.json](secrets/bot-secrets.json) with a new file.

```
rm secrets/bot-secrets.json
```

Example contents:

```
{
  "discord-public-key": "123...",
  "domain": ["sub", "example.com"]
}
```

The domain can also be specified as "example.com" if no sub-domain is used.

Additional secrets, like the bot token, can be added here as needed. Alternatively AWS secrets manager can be used.

### AWS

Sign up for an AWS account. The list of require permissions is long. Grab yourself an admin account and setup your credentials.

#### CDK bootstrap

Before the bot can be deployed, CDK must be bootstrapped in the account and region you want to deploy to.

Inside `deploy` directory run:

```
yarn cdk bootstrap --capabilities CAPABILITY_IAM
```

Add `--verbose` if you run into troubles, to help debug.

#### Route53

If you want to add the bot to an existing domain, then add the domain to Route53 as a hosted zone. Otherwise comment out the certificate / zone / domain code from [deploy/src/stack/discord.ts](deploy/src/stack/discord.ts)

## Building

At the root, run:

```
yarn discord:build
```

To build a lambda layer.

## Deploying

Inside `deploy` (why did I make this separate directory?) run:

```
yarn deploy
```

You will be asked to confirm any security changes.

If you get an error then resolve as best you can. Add `--verbose` to see more details or run `yarn cdk synth` to generate the cloudformation YAML to inspect.

If successful then we are ready to test our bot.

## Testing

There are ~~no tests~~ in this repo. We just do it live.

### Unit tests

Some unit tests have appeared...

Run them with:

```
yarn test
```

### Add the Interaction URL

By default, the CDK deployment will deploy the callback to `/discord`

Deploying the bot will output an API Gateway URL that can be used directly (also adding `/discord`). Otherwise use the domain provided.

For example: `sub.example.com/discord`

Press save. Discord will send the "PING" request to your bot. If the bot responds with "PONG" then the save will succeed. Otherwise nothing will happen.

### Generating an invite link

Go back to the discord developer portal for your bot and go to the Oauth -> URL Generator page. Check "bot" and "application.command". For the bot permissions check "Send Messages" and "Embed Links". As you expand the capabilities of your bot, you will need to come back here to generate a new invite link for your bot.

From a discord group that you can invite bots, click on the link and add the bot to your discord.

### Getting the guild id

You will need the guild id in order to install commands in the bot. To discover the guild id first you need to enter developer mode from Discord -> Settings -> Advanced -> Enable Developer Mode. Now you can right-click on a group to get the ID.

Go to the root of the repo and run:

```
yarn discord:cli commands create --client_id {your-client-id} --guild_id {your-guild-id} --token {your-bot-token}
```

If that succeeds you are ready to test your bot!

Type:

```
/ping
```

the bot should respond with "pong"

and

```
/token 0
```

The bot should respond with an embed card and an image.

## Delayed responses

Discord requires that interaction URL callbacks respond within 3 seconds. This can be a problem for lambdas because of the cold start problem. In order to be able to take the time needed to respond to

## Invite link

Want to try it out? Here is an invite link for a deployed version of this bot!

https://discord.com/api/oauth2/authorize?client_id=966910862256381985&scope=bot%20applications.commands&permissions=2147502080
