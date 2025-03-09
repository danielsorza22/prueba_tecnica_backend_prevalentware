import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export const createRoleLoader = (prisma: PrismaClient) => {
  return new DataLoader(async (roleIds: readonly string[]) => {
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: [...roleIds]
        }
      }
    });

    const roleMap = new Map(roles.map(role => [role.id, role]));
    return roleIds.map(id => roleMap.get(id) || null);
  });
}; 