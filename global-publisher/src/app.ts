import { SQSBatchResponse, DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { factory } from '@test_project/serverless-library';

import { Streamer } from './streamer';
import { mapAccount } from './image.mapper';

// Instantiate dependencies
const eventBusAdapter = factory({ region: 'us-east-1' });
// // Instantiate Streamer
const streamerObject = new Streamer(eventBusAdapter);

export async function handler(events: DynamoDBStreamEvent) {
  // simple mapping and parsing
  const preparedEvents = events.Records.filter(
    (record) => record.dynamodb.SequenceNumber !== undefined,
  )
    .sort((record) => +record.dynamodb.SequenceNumber)
    .map((record) => {
      const oldImage = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
      const originalAccount = mapAccount(oldImage);
      const newImage = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      const newAccount = mapAccount(newImage);

      // TODO never emit update events
      return {
        item: {
          original_object: {
            id: originalAccount.id,
            bid: originalAccount.bid,
            user_id: originalAccount.user_id,
            account_use: originalAccount.account_use,
            account_type: originalAccount.account_type,
            nickname: originalAccount.nickname,
            account_number: originalAccount.account_number,
            routing_number: originalAccount.routing_number,
            create_date: originalAccount.create_date,
            update_date: originalAccount.update_date,
          },
          new_object: {
            id: newAccount.id,
            bid: newAccount.bid,
            user_id: newAccount.user_id,
            account_use: newAccount.account_use,
            account_type: newAccount.account_type,
            nickname: newAccount.nickname,
            account_number: newAccount.account_number,
            routing_number: newAccount.routing_number,
            create_date: newAccount.create_date,
            update_date: newAccount.update_date,
          },
        },
        itemIdentifier: record.dynamodb.SequenceNumber,
      };
    });

  const response: SQSBatchResponse = { batchItemFailures: [] };

  const tasks = preparedEvents.map(async (eventBody) => {
    await streamerObject.handler({ event: eventBody.item }).catch(() => {
      response.batchItemFailures.push({
        itemIdentifier: eventBody.itemIdentifier,
      });
    });
  });

  // executes batch events
  await Promise.all(tasks);
  return response;
}
