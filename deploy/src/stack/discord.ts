import { fileURLToPath } from "url";
import path from "path";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as route53 from "aws-cdk-lib/aws-route53";

export interface DiscordProps extends cdk.StackProps {
  readonly domain: [string, string] | string;
  leaderboardApi: string;
  readonly publicKey: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class DiscordStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DiscordProps) {
    const { domain, publicKey, leaderboardApi, ...rest } = props;
    super(scope, id, rest);

    // DynamoDB tables
    const minecraftPlayerTable = new dynamodb.Table(this, "MinecraftPlayer", {
      partitionKey: {
        name: "uuid",
        type: dynamodb.AttributeType.STRING,
      },
      tableClass: dynamodb.TableClass.STANDARD,
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

    const discordHandler = new lambda.Function(this, "discordLambda", {
      runtime: lambda.Runtime.PROVIDED,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../../.layers/discord")
      ),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          "node16Layer",
          `arn:aws:lambda:${props.env?.region}:072686360478:layer:node-16_4_2:3`
        ),
      ],
      environment: {
        PUBLIC_KEY: publicKey,
        STATIC_IMAGE_URL: `https://${staticAssetBucket.bucketName}.s3.amazonaws.com`,
        MINIMUM_LOG_LEVEL: "DEBUG",
        TABLE_NAME_MINECRAFT_PLAYER: minecraftPlayerTable.tableName,
        CURRENT_LEADERBOARD: "potato",
        LEADERBOARD_BASE: leaderboardApi,
      },
    });

    minecraftPlayerTable.grantReadWriteData(discordHandler);

    // Domain
    const domains = domain instanceof Array ? domain : [domain];
    const domainName = domains.join(".");
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: domain.length === 2 ? domains[1] : domains[0],
    });

    const certificate = new acm.DnsValidatedCertificate(this, "certificate", {
      domainName,
      hostedZone: hostedZone,
      region: props.env?.region,
    });

    const api = new apigateway.RestApi(this, "discordApi", {
      restApiName: "Discord Service",
      description: "Discord callback",
      domainName: {
        domainName,
        certificate,
      },
    });

    const discordIntegration = new apigateway.LambdaIntegration(discordHandler);
    const resource = api.root.addResource("discord");
    resource.addMethod("POST", discordIntegration);

    new route53.ARecord(this, "ipv4-record", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
    new route53.AaaaRecord(this, "ipv6-record", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(api)),
    });
  }
}
