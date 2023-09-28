import { Handler } from '@test_project/serverless-library';
import {
  AuthGetResponse,
  buildAuthGetRequest,
  buildPublicTokenExchangeRequest,
  client,
  authGet,
} from '@test_project/plaid';
import { createHash, randomUUID } from 'crypto';

import { LinkAccountEvent, LinkAccountEnumType } from './account-event.type';
import { AccountRepository } from './account.repository';
import { LinkedAccount } from './account.type';

class Processor extends Handler<LinkAccountEvent> {
  constructor(private readonly accountRepo: AccountRepository) {
    super();
  }

  protected async handlerCore(body: LinkAccountEvent) {
    console.log('handlerCore body', body);
    const { publicToken, userId, accountUse, nickname } =
      body.account;

    const exchangeResponse = await client.itemPublicTokenExchange(
      buildPublicTokenExchangeRequest(publicToken),
    );
    console.log('exchangeResponse.data', exchangeResponse.data);
    const { access_token: accessToken, item_id: itemId } =
      exchangeResponse.data;

    const authResponse = await authGet(buildAuthGetRequest(accessToken));
    const authBody = JSON.parse(authResponse.body);
    console.log('authResponse', authResponse);
    console.log('authBody', authBody);
    console.log('authBody.numbers', authBody.numbers);

    // iterate over numbers.ach
    const docsToInsert = authBody.numbers.ach.map(async (numbers) => {
      // filter by account_id
      const metadata: AuthGetResponse = { ...authBody };
      metadata.accounts = authBody.accounts.filter(
        ({ account_id }) => account_id === numbers.account_id,
      );
      metadata.numbers.ach = [numbers];

      const bid = this.hashFrom(
        [userId, numbers.account, numbers.routing].join(','),
      );
      console.log('hashed bid', bid);

      let id: string, createDate: string;
      const now = new Date().toISOString();
      const { Item: foundAttributes } = await this.accountRepo.find(bid);
      if (foundAttributes) {
        id = foundAttributes.id || randomUUID();
        createDate = foundAttributes.createDate || now;
      } else {
        id = randomUUID();
        createDate = now;
      }

      const account: LinkedAccount = {
        id,
        bid,
        userId,
        accountUse,
        nickname,
        metadata,
        accessToken,
        itemId,
        updateDate: now,
        createDate,
      };

      // persist in DB
      if (body.type === LinkAccountEnumType.Create) {
        console.log('saving account', account);
        return await this.accountRepo.save(account);
      }
    });
    console.log('docsToInsert', docsToInsert.length);
    await Promise.all(docsToInsert).then(() => console.log('done'));
  }

  // move to common deps?
  hashFrom(source: String) {
    console.log('hashFrom', source);
    return createHash('md5').update(JSON.stringify(source)).digest('hex');
  }
}

export { Processor };
