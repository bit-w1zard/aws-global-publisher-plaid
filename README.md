## aws-global-publisher-plaid
Monorepo codebase consisting of global-publisher lambda and processor lambda functions to process financial data to plaid platform

## Introduction
The application aims to process and secure financial data of users to a PCI compliant platform called.
This codebase includes set of lambda functions, one of which is ```global-publisher```, it process SQS listeners and process stream events of dynamodb into event bus. Those stream events from event bus are then triggered in another lambda function  ```processor``` which perform some user related processing and publish them back to dynamodb.

## AWS Services
* SAM Templates
* SQS
* DynamoDB
* EventBus
* Lambda

## Configurations
All the configurations are setup using SAM template configurations. Each resource used is deployed using stacks
as per configuration defined in ```samconfig.toml``` file.