import { sessionConfig } from './sessionConfig';

interface ResolverConfig {
  name: string;
  roles: string[];
  isPublic: boolean;
}

export const verifyResolver = (
  resolverName: string,
  resolverType: 'Query' | 'Mutation'
): ResolverConfig | undefined => {
  const config = sessionConfig[resolverType];
  return config?.find((resolver) => resolver.name === resolverName);
};