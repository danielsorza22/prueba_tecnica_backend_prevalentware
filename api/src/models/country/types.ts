import { gql } from 'graphql-tag';

export const countryTypes = gql`
  type Country {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    users: [User!]
  }

  type CountryPaginatedResponse {
    items: [Country!]!
    pageInfo: PaginationInfo!
  }

  extend type Query {
    countries(pagination: PaginationInput): CountryPaginatedResponse!
  }
`; 