import { resolvers } from '../src/resolvers';
import { Context, AuthenticatedUser } from '../src/types';
import { createMockContext } from './__mocks__/context.mock';
import { Enum_RoleName } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

describe('Resolver: topUsersByTypeAndCountry', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  it('debería rechazar usuarios no autenticados', async () => {
    // Arrange
    mockContext.session = null;
    mockContext.user = null;
    const args = {
      monitoringType: 'print',
      countryId: 'test-country-id',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    };

    // Act & Assert
    await expect(
      resolvers.Query.topUsersByTypeAndCountry(null, args, mockContext)
    ).rejects.toThrow('Authentication required');
  });

  it('debería rechazar usuarios no administradores', async () => {
    // Arrange
    const now = new Date();
    const userRole = {
      id: 'role-1',
      name: Enum_RoleName.User,
      createdAt: now
    };

    mockContext.session = {
      id: 'test-session',
      sessionToken: 'test-token',
      userId: 'user-1',
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: now,
      User: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        emailVerified: null,
        termsAndConditionsAccepted: null,
        image: null,
        position: 'Developer',
        createdAt: now,
        updatedAt: now,
        roleId: 'role-1',
        Role: userRole
      }
    };

    mockContext.user = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      emailVerified: null,
      termsAndConditionsAccepted: null,
      image: null,
      position: 'Developer',
      createdAt: now,
      updatedAt: now,
      roleId: 'role-1',
      Role: userRole
    };

    const args = {
      monitoringType: 'print',
      countryId: 'test-country-id',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    };

    // Act & Assert
    await expect(
      resolvers.Query.topUsersByTypeAndCountry(null, args, mockContext)
    ).rejects.toThrow('Insufficient permissions');
  });

  it('debería retornar los top 3 usuarios correctamente', async () => {
    // Arrange
    const now = new Date();
    const adminRole = {
      id: 'role-1',
      name: Enum_RoleName.Admin,
      createdAt: now
    };

    mockContext.session = {
      id: 'test-session',
      sessionToken: 'test-token',
      userId: 'admin-1',
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: now,
      User: {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        emailVerified: null,
        termsAndConditionsAccepted: null,
        image: null,
        position: 'Admin',
        createdAt: now,
        updatedAt: now,
        roleId: 'role-1',
        Role: adminRole
      }
    };

    mockContext.user = {
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      emailVerified: null,
      termsAndConditionsAccepted: null,
      image: null,
      position: 'Admin',
      createdAt: now,
      updatedAt: now,
      roleId: 'role-1',
      Role: adminRole
    };
    
    const expectedResults = [
      {
        id: 'user-1',
        email: 'user1@test.com',
        name: 'User 1',
        position: 'Developer',
        createdAt: now,
        updatedAt: now,
        roleId: 'role-1',
        role_name: 'User',
        monitoring_count: '5'
      }
    ];

    // Mock del método $queryRawUnsafe
    const prismaQueryMock = mockContext.prisma.$queryRawUnsafe as jest.Mock;
    prismaQueryMock.mockResolvedValue(expectedResults);

    const args = {
      monitoringType: 'print',
      countryId: 'test-country-id',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    };

    // Act
    const result = await resolvers.Query.topUsersByTypeAndCountry(
      null,
      args,
      mockContext
    );

    // Assert
    expect(result).toHaveLength(expectedResults.length);
    expect(result[0].monitoringCount).toBe(5);
    expect(result[0].user.name).toBe('User 1');
  });
}); 