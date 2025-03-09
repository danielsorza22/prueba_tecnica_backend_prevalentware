import { gql } from 'graphql-tag';
import { userTypes } from './user/types';
import { countryTypes } from './country/types';
import { monitoringTypes } from './monitoring/types';
import { userResolvers } from './user/resolvers';
import { countryResolvers } from './country/resolvers';
import { monitoringResolvers } from './monitoring/resolvers';
import { createRoleLoader } from './user/dataLoaders';

// Tipos base compartidos
const baseTypes = gql`
  type PaginationInfo {
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }

  type Query {
    _empty: String
  }
`;

// Combinar todos los tipos
export const typeDefs = [
  baseTypes,
  userTypes,
  countryTypes,
  monitoringTypes
];

// Combinar todos los resolvers
export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...countryResolvers.Query,
    ...monitoringResolvers.Query
  },
  User: userResolvers.User
};

// Exportar DataLoaders
export const dataLoaders = {
  createRoleLoader
}; 