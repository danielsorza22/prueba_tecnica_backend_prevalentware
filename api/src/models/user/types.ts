import { gql } from 'graphql-tag';

export const userTypes = gql`
  enum RoleName {
    Admin
    Manager
    User
  }

  type Role {
    id: ID!
    name: RoleName!
    createdAt: String!
    users: [User!]
  }

  type User {
    id: ID!
    email: String!
    emailVerified: String
    termsAndConditionsAccepted: String
    name: String
    image: String
    position: String
    createdAt: String!
    updatedAt: String!
    lastLogin: String
    roleId: String
    role: Role
    countries: [Country!]
    monitoring: [UserMonitoring!]
  }

  type UserPaginatedResponse {
    items: [User!]!
    pageInfo: PaginationInfo!
  }

  extend type Query {
    users(pagination: PaginationInput): UserPaginatedResponse!
    userByEmail(email: String!): User
  }
`; 