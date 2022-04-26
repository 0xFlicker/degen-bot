# AWS CDK Deploy scripts

CDK is the most recent high level deployment language for cloud deploys in AWS

This folder describes and deploys the infrastructure for:

- metadata API

For the following environments

- [x] Rinkeby testnet
- [ ] Homestead (Ethereum) mainnet when testnet looks good

# Contributing

It is recommended that every developer have their own AWS account in which to deploy their own application.

## Prerequisites

The following dependencies are required:

- NodeJS (16+) (prefer to use `nvm` to manage Node versions)
- Yarn (install w/ `npm -g yarn`)

## Setup

Install dependencies:

```
yarn
```

## Bootstrap

Before CDK can be used, the following command must succeed (run in this directory)

```
yarn cdk bootstrap --capabilities CAPABILITY_IAM
```

## Structure

### app/\*

The high level abstractions of the stack

### stack/\*

The different logical stack pieces to compose into applications

# Deploying

The stack may be deployed locally or from a CI/CD system. For now the stack is only being deployed locally but once it is working well can be moved to a CI/CD system like github actions.

## Building

The Lambda layers must be built before deploying. To build the lambda layers run:

```
yarn build:lambda
```

The CDK code must be transpiled from typescript. To transpile the CDK code run:

```
yarn build:tsc
```

To run all builds:

```
yarn build
```

## Deploying

To deploy a single stack:

```
yarn cdk deploy testnet/ApiStack
```

To deploy everything:

```
yarn cdk deploy --all
```
