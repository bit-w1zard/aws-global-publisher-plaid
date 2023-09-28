import { databaseAdapter } from "@test_project/serverless-library";
import { LinkedAccount } from './account.type';

export class AccountRepository {
  constructor(private adapter: databaseAdapter) {}

  async find(bid: string) {
    console.log("find by bid", bid);
    return this.adapter.DynamoDbClient.get({
      Key: { bid },
      TableName: process.env.DYNAMODB_TABLE!,
    }).promise();
  }

  async save(user: LinkedAccount) {
    console.log("save", user);
    return this.adapter.DynamoDbClient.put({
      Item: user,
      TableName: process.env.DYNAMODB_TABLE!,
    }).promise();
  }
}
