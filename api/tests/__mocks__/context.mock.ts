import { Context } from '../../src/types';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import DataLoader from 'dataloader';
import { Enum_RoleName } from '@prisma/client';

type Role = {
  id: string;
  name: Enum_RoleName;
  createdAt: Date;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
} & Omit<Context, 'prisma'>;

export function createMockContext(): MockContext {
  const mockRoleLoader = new DataLoader<string, Role | null>(async (keys) => {
    return keys.map(() => null);
  });

  const now = new Date();

  return {
    prisma: mockDeep<PrismaClient>(),
    user: null,
    loaders: {
      roleLoader: mockRoleLoader
    },
    session: {
      id: 'mock-session-id',
      sessionToken: 'mock-session-token',
      userId: 'mock-user-id',
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: now,
      User: {
        id: 'mock-user-id',
        email: 'mock@test.com',
        name: 'Mock User',
        emailVerified: null,
        termsAndConditionsAccepted: null,
        image: null,
        position: 'Mock Position',
        createdAt: now,
        updatedAt: now,
        roleId: 'mock-role-id',
        Role: {
          id: 'mock-role-id',
          name: Enum_RoleName.Admin,
          createdAt: now
        }
      }
    }
  };
} 