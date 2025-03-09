import DataLoader from 'dataloader';
import { PrismaClient, Role } from '@prisma/client';

export const createRoleLoader = (prisma: PrismaClient) => {
  return new DataLoader<string, Role | null>(async (roleIds) => {
    // Obtener todos los roles en una sola consulta
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds as string[]
        }
      }
    });

    // Mapear los roles a un objeto para búsqueda rápida
    const roleMap = new Map(roles.map(role => [role.id, role]));

    // Retornar los roles en el mismo orden que los IDs solicitados
    return roleIds.map(id => roleMap.get(id) || null);
  })
} 