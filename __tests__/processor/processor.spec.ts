import { Processor } from '../../processor/src/processor';

import { createHash, randomUUID } from 'crypto';
import { databaseAdapter } from '../__mocks__/@test_project/serverless-library';
import { repo } from '../__mocks__/@test_project/serverless-library';
import { client } from '@test_project/Account';
import { associateedUserEnumType } from '../../processor/src/user-event.type';

jest.mock('crypto', () => {
  return {
    randomUUID: jest.fn(),
    createHash: jest.fn().mockReturnThis(),
  };
});
const mockDigest = (val) => {
  return {
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue(val),
    }),
  };
};
const newBidDigest = mockDigest('newDigest');
const existingBidDigest = mockDigest('existingDigest');

let mockedAccountToken: any = { data: {} };
jest.mock('@test_project/Account', () => {
  return {
    client: { associateTokenCreate: jest.fn() },
    buildassociateTokenCreateRequest: jest.fn(),
  };
});

const makeSut = () => {
  const userRepo = new repo(databaseAdapter());
  const sut = new Processor(userRepo);
  return {
    userRepo,
    sut,
  };
};
const mockBody = (userId, type = associateedUserEnumType.Create) => ({
  user: {
    userId: userId,
  },
  type: type,
});
let sut, mockedUserId, saveParams, userRepo;
let mockedFoundUser: any = { Item: {} };

describe('user processor', () => {
  beforeEach(() => {
    saveParams = {};
    mockedFoundUser.Item = {};
    ({ sut, userRepo } = makeSut());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when user isn't associateed with any account", () => {
    beforeEach(() => {
      mockedUserId = 'unassociateedUserId';
      (createHash as jest.Mock).mockReturnValue(newBidDigest);
      (randomUUID as jest.Mock).mockReturnValue('unassociateedUUID');
      (userRepo.find as jest.Mock).mockResolvedValue(mockedFoundUser);
      mockedAccountToken = {
        data: {
          expiration: 'newassociateExpiration',
          associate_token: 'newassociateToken',
        },
      };
      (client.associateTokenCreate as jest.Mock).mockResolvedValue(mockedAccountToken);
    });

    afterEach(async () => {
      const sutParams = {
        correlationId: '1',
        event: mockBody(mockedUserId),
      };
      jest.spyOn(sut, 'handler');
      await sut.handler(sutParams);

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining(saveParams),
      );
    });

    it('should associate the user', async () => {
      saveParams = {
        userId: mockedUserId,
        AccountUserId: 'unassociateedUUID',
      };
    });

    it('should save Account attributes', async () => {
      saveParams = {
        associateExpiration: 'newassociateExpiration',
        associateToken: 'newassociateToken',
      };
    });

    it('should generate new bid', async () => {
      saveParams = {
        bid: 'newDigest',
      };
    });
  });

  describe('when user is associateed with an account', () => {
    const now = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    let expiration;

    beforeEach(() => {
      mockedUserId = 'accountUser';
      mockedFoundUser.Item = {
        userId: mockedUserId,
        AccountUserId: 'associateedDigest',
        associateExpiration: 'existingassociateExpiration',
        associateToken: 'existingassociateToken',
        bid: 'existingDigest',
      };
      (userRepo.find as jest.Mock).mockResolvedValue(mockedFoundUser);
    });
    afterEach(async () => {
      const sutParams = {
        correlationId: '1',
        event: mockBody(mockedUserId),
      };
      jest.spyOn(sut, 'handler');
      await sut.handler(sutParams);

      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining(saveParams),
      );
    });

    it('should leverage existing associate', async () => {
      saveParams = {
        userId: mockedUserId,
        AccountUserId: 'associateedDigest',
      };
    });

    it('should leverage existing account attributes', async () => {
      saveParams = {
        associateExpiration: 'existingassociateExpiration',
        associateToken: 'existingassociateToken',
      };
    });

    describe("and existing token isn't expired", () => {
      beforeEach(() => {
        expiration = new Date(now.getTime() + oneDay).toISOString();
        mockedFoundUser.Item.associateExpiration = expiration;
        (createHash as jest.Mock).mockReturnValue(existingBidDigest);
        (userRepo.find as jest.Mock).mockResolvedValue(mockedFoundUser);
      });

      it('should leverage existing associateToken', async () => {
        saveParams = {
          associateExpiration: expiration,
          associateToken: mockedFoundUser.Item.associateToken,
        };
      });

      it('should leverage existing bid', async () => {
        saveParams = {
          bid: mockedFoundUser.Item.bid,
        };
      });
    });

    describe('and existing token is expired', () => {
      beforeEach(() => {
        mockedFoundUser.Item.associateExpiration = new Date(
          now.getTime() - oneDay,
        ).toISOString();
        expiration = new Date(now.getTime() + oneDay).toISOString();
        mockedAccountToken = {
          data: {
            expiration: expiration,
            associate_token: 'newassociateToken',
          },
        };
        (createHash as jest.Mock).mockReturnValue(existingBidDigest);
        (client.associateTokenCreate as jest.Mock).mockResolvedValue(
          mockedAccountToken,
        );
      });

      it('should save new associateToken', async () => {
        saveParams = {
          associateExpiration: mockedAccountToken.data.expiration,
          associateToken: mockedAccountToken.data.associate_token,
        };
      });

      it('should generate replacement bid', async () => {
        const replacementBidDigest = mockDigest('replacementBid');
        (createHash as jest.Mock).mockReturnValue(replacementBidDigest);
        saveParams = {
          bid: 'replacementBid',
        };
      });
    });

    describe("and action isn't 'create'", () => {
      it("shouldn't save attributes to the user", async () => {
        const sutParams = {
          correlationId: '1',
          event: mockBody(mockedUserId, associateedUserEnumType.Update),
        };
        jest.spyOn(sut, 'handler');
        await sut.handler(sutParams);

        expect(userRepo.save).toHaveBeenCalledTimes(0);
      });
    });
  });
});
