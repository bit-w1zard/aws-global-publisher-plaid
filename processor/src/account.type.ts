export type LinkAccount = {
  userId: string;
  publicToken: string;
  accountUse: string;
  nickname: string;
};
export type LinkedAccount = {
  id: string;
  bid: string;
  userId: string;
  accountUse: string;
  nickname: string;
  metadata: object;
  accessToken: string;
  itemId: string;
  updateDate: string;
  createDate: string;
};
