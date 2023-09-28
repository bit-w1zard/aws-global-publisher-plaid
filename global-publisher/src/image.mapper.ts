import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Account } from './account.type';

const accountInitialState: Account = {
  id: '',
  bid: '',
  user_id: '',
  account_use: '',
  account_type: '',
  nickname: '',
  account_number: '',
  routing_number: '',
  create_date: '',
  update_date: '',
};

export const mapAccount = (
  record: DocumentClient.AttributeMap | undefined,
): Account => {
  const account = { ...accountInitialState };
  if (record === undefined) return account;

  account.id = record.id;
  account.bid = record.bid;
  account.user_id = record.userId;
  account.account_use = record.accountUse;
  account.account_type =
    record.metadata &&
    record.metadata.accounts &&
    record.metadata.accounts[0].subtype;
  account.nickname = record.nickname;
  account.account_number =
    record.metadata &&
    record.metadata.numbers &&
    record.metadata.numbers.ach[0].account;
  account.routing_number =
    record.metadata &&
    record.metadata.numbers &&
    record.metadata.numbers.ach[0].routing;
  account.create_date = record.createDate;
  account.update_date = record.updateDate;

  return account;
};
