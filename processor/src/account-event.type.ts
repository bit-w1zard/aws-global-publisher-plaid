import { LinkAccount } from './account.type';

export enum LinkAccountEnumType {
  Create = 'create',
  Update = 'update',
}
export type LinkAccountEvent = {
  account: LinkAccount;
  type: LinkAccountEnumType;
};
