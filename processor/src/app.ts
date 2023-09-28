import { SQSBatchResponse } from 'aws-lambda';
import {
  QueueEventType,
  databaseAdapter,
} from '@test_project/serverless-library';
import { Processor } from './processor';
import { LinkAccountEvent } from './account-event.type';
import { AccountRepository } from './account.repository';

// Event type expected, as setted on Resolver 'EventDataSourceResolver' (template.yml of API folder)
type EventBody = { event: LinkAccountEvent; correlationId: string };

// Instantiate dependencies
const accountRepo = new AccountRepository(databaseAdapter());
// Instantiate Processor
const processorInstance = new Processor(accountRepo);

// Processor Lambda handler
export async function handler(events: QueueEventType) {
  console.log('handler events', events);
  console.log('handler body', JSON.parse(events?.Records[0]?.body));

  // simple mapping and parsing
  const preparedEvents = events.Records.map((record): EventBody => {
    const body = JSON.parse(record.body);
    return body.detail;
  });

  const response: SQSBatchResponse = { batchItemFailures: [] };

  const items = preparedEvents.map(async (eventBody) => {
    await processorInstance.handler(eventBody).catch(() => {
      const { message } = eventBody.event;
      // pushes item to indicates to SQS which processing failed
      response.batchItemFailures.push({ itemIdentifier: message });
    });
  });

  // executes batch events
  await Promise.all(items);
  return response;
}
