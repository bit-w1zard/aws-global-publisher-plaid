import { Account } from './account.type';

import {
  BaseHandler,
  EventBusAdapter,
} from '@test_project/serverless-library';

class Streamer extends BaseHandler<Account> {
  constructor(private readonly eventBus: EventBusAdapter) {
    super();
  }

  protected async handlerCore(body: Account) {
    const event = {
      eventBusName: process.env.GLOBAL_BUS_ARN,
      message: body,
      detailType: 'bank-account.linked.v1',
      source: 'link.account',
    };
    console.log('Publishing event:', event);
    return await this.eventBus.publish(event);
  }

  /**
   * implement this method if you want a explicit custom error handling from code inside handlerCore
   */
  protected handleError(message: string): void {
    super.handleError(message);
  }
}

export { Streamer };
