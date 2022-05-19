import { fileURLToPath } from "url";
import path from "path";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as route53 from "aws-cdk-lib/aws-route53";

export interface DiscordProps extends cdk.StackProps {
  readonly discordDomain: [string, string] | string;
  readonly leaderboardDomain: [string, string] | string;
  readonly discordAppId: string;
  readonly publicKey: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DiscordStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DiscordProps) {
    const {
      discordDomain,
      leaderboardDomain,
      publicKey,
      discordAppId,
      ...rest
    } = props;
    super(scope, id, rest);

    // DynamoDB tables
    const minecraftPlayerTable = new dynamodb.Table(this, "MinecraftPlayer", {
      partitionKey: {
        name: "uuid",
        type: dynamodb.AttributeType.STRING,
      },
      tableClass: dynamodb.TableClass.STANDARD,
    });
    const currentBoardTable = new dynamodb.Table(this, "CurrentBoard", {
      partitionKey: {
        name: "context",
        type: dynamodb.AttributeType.STRING,
      },
      tableClass: dynamodb.TableClass.STANDARD,
    });
    const rankBoardTable = new dynamodb.Table(this, "boards", {
      partitionKey: { name: "Name", type: dynamodb.AttributeType.STRING },
      tableClass: dynamodb.TableClass.STANDARD,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const rankScoresTable = new dynamodb.Table(this, "scores", {
      partitionKey: { name: "Board_Name", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "Player_ID", type: dynamodb.AttributeType.STRING },
      tableClass: dynamodb.TableClass.STANDARD,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const rankNodesTable = new dynamodb.Table(this, "nodes-2", {
      partitionKey: { name: "Board_Name", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "Node_ID", type: dynamodb.AttributeType.STRING },
      tableClass: dynamodb.TableClass.STANDARD,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const rankLeaderboardsTable = new dynamodb.Table(this, "leaderboards", {
      partitionKey: { name: "Board_Name", type: dynamodb.AttributeType.STRING },
      tableClass: dynamodb.TableClass.STANDARD,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Bucket with a single image
    const staticAssetBucket = new s3.Bucket(this, "static-assets-bucket-3", {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    staticAssetBucket.addCorsRule({
      allowedOrigins: ["*"],
      allowedMethods: [s3.HttpMethods.GET],
    });
    new s3deploy.BucketDeployment(this, "static-assets-deployment-3", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../images/"))],
      destinationBucket: staticAssetBucket,
    });
    const node16Layer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "node16Layer",
      `arn:aws:lambda:${props.env?.region}:072686360478:layer:node-16_4_2:3`
    );

    const scoreQueue = new sqs.Queue(this, "scoreQueue-2", {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(1),
      fifo: true,
      contentBasedDeduplication: true,
    });
    const scoreTopic = new sns.Topic(this, "scoreTopic-2", {
      fifo: true,
      topicName: "score-fifo-topic-2",
      contentBasedDeduplication: true,
    });
    scoreTopic.addSubscription(new subs.SqsSubscription(scoreQueue));

    const deferredMessageQueue = new sqs.Queue(this, "deferredMessageQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(1),
    });
    const deferredMessageTopic = new sns.Topic(this, "deferredMessageTopic");
    deferredMessageTopic.addSubscription(
      new subs.SqsSubscription(deferredMessageQueue)
    );

    const discordHandler = new lambda.Function(this, "discordLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../.layers/discord")
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        PUBLIC_KEY: publicKey,
        STATIC_IMAGE_URL: `https://${staticAssetBucket.bucketName}.s3.amazonaws.com`,
        MINIMUM_LOG_LEVEL: "INFO",
        TABLE_NAME_MINECRAFT_PLAYER: minecraftPlayerTable.tableName,
        TABLE_NAME_CURRENT_BOARD: currentBoardTable.tableName,
        TABLE_NAME_RANKER_BOARDS: rankBoardTable.tableName,
        TABLE_NAME_RANKER_SCORES: rankScoresTable.tableName,
        TABLE_NAME_RANKER_NODES: rankNodesTable.tableName,
        TABLE_NAME_RANKER_LEADERBOARDS: rankLeaderboardsTable.tableName,
        DISCORD_DEFERRED_MESSAGE_TOPIC_ARN: deferredMessageTopic.topicArn,
      },
    });

    minecraftPlayerTable.grantReadWriteData(discordHandler);
    currentBoardTable.grantReadWriteData(discordHandler);
    rankBoardTable.grantReadWriteData(discordHandler);
    rankScoresTable.grantReadWriteData(discordHandler);
    rankNodesTable.grantReadWriteData(discordHandler);
    rankLeaderboardsTable.grantReadWriteData(discordHandler);
    deferredMessageTopic.grantPublish(discordHandler);

    const playersHandler = new lambda.Function(this, "playerHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../.layers/players")
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        MINIMUM_LOG_LEVEL: "INFO",
        TABLE_NAME_RANKER_BOARDS: rankBoardTable.tableName,
        TABLE_NAME_RANKER_SCORES: rankScoresTable.tableName,
        TABLE_NAME_RANKER_NODES: rankNodesTable.tableName,
        TABLE_NAME_RANKER_LEADERBOARDS: rankLeaderboardsTable.tableName,
      },
    });

    rankBoardTable.grantReadData(playersHandler);
    rankScoresTable.grantReadData(playersHandler);
    rankNodesTable.grantReadData(playersHandler);
    rankLeaderboardsTable.grantReadData(playersHandler);

    const leaderboardHandler = new lambda.Function(this, "leaderboardHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../.layers/leaderboard")
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        MINIMUM_LOG_LEVEL: "INFO",
        TABLE_NAME_RANKER_BOARDS: rankBoardTable.tableName,
        TABLE_NAME_RANKER_SCORES: rankScoresTable.tableName,
        TABLE_NAME_RANKER_NODES: rankNodesTable.tableName,
        TABLE_NAME_RANKER_LEADERBOARDS: rankLeaderboardsTable.tableName,
      },
    });

    rankBoardTable.grantReadData(leaderboardHandler);
    rankScoresTable.grantReadData(leaderboardHandler);
    rankNodesTable.grantReadData(leaderboardHandler);
    rankLeaderboardsTable.grantReadData(leaderboardHandler);

    const deferredMessageHandler = new lambda.Function(
      this,
      "deferredMessageHandler",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../../.layers/deferred")
        ),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          DISCORD_APPLICATION_ID: discordAppId,
          STATIC_IMAGE_URL: `https://${staticAssetBucket.bucketName}.s3.amazonaws.com`,
          MINIMUM_LOG_LEVEL: "INFO",
          CURRENT_LEADERBOARD: "potato",
          TABLE_NAME_MINECRAFT_PLAYER: minecraftPlayerTable.tableName,
          TABLE_NAME_CURRENT_BOARD: currentBoardTable.tableName,
          TABLE_NAME_RANKER_BOARDS: rankBoardTable.tableName,
          TABLE_NAME_RANKER_SCORES: rankScoresTable.tableName,
          TABLE_NAME_RANKER_NODES: rankNodesTable.tableName,
          TABLE_NAME_RANKER_LEADERBOARDS: rankLeaderboardsTable.tableName,
        },
        events: [
          new eventSources.SqsEventSource(deferredMessageQueue, {
            batchSize: 10,
          }),
        ],
      }
    );

    minecraftPlayerTable.grantReadWriteData(deferredMessageHandler);
    currentBoardTable.grantReadWriteData(deferredMessageHandler);
    rankBoardTable.grantReadWriteData(deferredMessageHandler);
    rankScoresTable.grantReadData(deferredMessageHandler);
    rankNodesTable.grantReadData(deferredMessageHandler);
    rankLeaderboardsTable.grantReadData(deferredMessageHandler);

    const scoreHandler = new lambda.Function(this, "scoreHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../.layers/ingest")
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        TABLE_NAME_RANKER_BOARDS: rankBoardTable.tableName,
        TABLE_NAME_RANKER_SCORES: rankScoresTable.tableName,
        TABLE_NAME_RANKER_NODES: rankNodesTable.tableName,
        TABLE_NAME_RANKER_LEADERBOARDS: rankLeaderboardsTable.tableName,
      },
      events: [new eventSources.SqsEventSource(scoreQueue, { batchSize: 10 })],
    });

    rankBoardTable.grantReadWriteData(scoreHandler);
    rankScoresTable.grantReadWriteData(scoreHandler);
    rankNodesTable.grantReadWriteData(scoreHandler);
    rankLeaderboardsTable.grantReadWriteData(scoreHandler);

    // Domain
    const discordDomains =
      discordDomain instanceof Array ? discordDomain : [discordDomain];
    const discordDomainName = discordDomains.join(".");
    const discordHostedZone = route53.HostedZone.fromLookup(
      this,
      "HostedZone",
      {
        domainName:
          discordDomains.length === 2 ? discordDomains[1] : discordDomains[0],
      }
    );

    const leaderboardDomains =
      leaderboardDomain instanceof Array
        ? leaderboardDomain
        : [leaderboardDomain];
    const leaderboardDomainName = leaderboardDomains.join(".");
    const leaderboardHostedZone = route53.HostedZone.fromLookup(
      this,
      "LeaderboardHostedZone",
      {
        domainName:
          leaderboardDomains.length === 2
            ? leaderboardDomains[1]
            : leaderboardDomains[0],
      }
    );

    const discordCertificate = new acm.DnsValidatedCertificate(
      this,
      "certificate",
      {
        domainName: discordDomainName,
        hostedZone: discordHostedZone,
        region: props.env?.region,
      }
    );

    const discordApi = new apigateway.RestApi(this, "discordApi", {
      restApiName: "Discord Service",
      description: "Discord callback",
      domainName: {
        domainName: discordDomainName,
        certificate: discordCertificate,
      },
    });

    const leaderboardCertificate = new acm.DnsValidatedCertificate(
      this,
      "leaderboardCertificate",
      {
        domainName: leaderboardDomainName,
        hostedZone: leaderboardHostedZone,
        region: props.env?.region,
      }
    );

    const leaderboardApi = new apigateway.RestApi(this, "leaderboardApi", {
      restApiName: "Leaderboard Service",
      description: "Leaderboard callback",
      domainName: {
        domainName: leaderboardDomainName,
        certificate: leaderboardCertificate,
      },
    });
    const defaultUsagePlan = leaderboardApi.addUsagePlan("defaultUsagePlan", {
      name: "Default Usage Plan",
      description: "Default Usage Plan",
    });
    const defaultApiKey = leaderboardApi.addApiKey("defaultKey", {
      description: "Default leaderboard API key",
    });
    defaultUsagePlan.addApiKey(defaultApiKey);
    defaultUsagePlan.addApiStage({
      stage: leaderboardApi.deploymentStage,
    });

    const discordIntegration = new apigateway.LambdaIntegration(discordHandler);
    const discordResource = discordApi.root.addResource("discord");
    discordResource.addMethod("POST", discordIntegration);
    const experienceResource = leaderboardApi.root.addResource("{experience}");
    const leaderboardResource = experienceResource.addResource("leaderboard");
    leaderboardResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(leaderboardHandler),
      {
        apiKeyRequired: true,
      }
    );

    const playersResource = experienceResource.addResource("players");
    playersResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(playersHandler),
      {
        apiKeyRequired: true,
      }
    );

    new route53.ARecord(this, "ipv4-record", {
      zone: discordHostedZone,
      recordName: discordDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(discordApi)
      ),
    });
    new route53.AaaaRecord(this, "ipv6-record", {
      zone: discordHostedZone,
      recordName: discordDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(discordApi)
      ),
    });
    new route53.ARecord(this, "ipv4-record-leaderboard", {
      zone: leaderboardHostedZone,
      recordName: leaderboardDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(leaderboardApi)
      ),
    });
    new route53.AaaaRecord(this, "ipv6-record-leaderboard", {
      zone: leaderboardHostedZone,
      recordName: leaderboardDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(leaderboardApi)
      ),
    });

    new cdk.CfnOutput(this, "snsScoreTopicArn", {
      value: scoreTopic.topicArn,
      description: "The arn of the SNS score topic",
    });
  }
}
