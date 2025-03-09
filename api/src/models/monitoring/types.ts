import { gql } from 'graphql-tag';

export const monitoringTypes = gql`
  enum MonitoringType {
    signIn
    print
    share
  }

  type UserMonitoring {
    id: ID!
    usage: Int!
    description: String!
    userId: String!
    createdAt: String!
    user: User!
  }

  type UserMonitoringCount {
    user: User!
    monitoringCount: Int!
  }

  type UserMonitoringPaginatedResponse {
    items: [UserMonitoring!]!
    pageInfo: PaginationInfo!
  }

  type UserMonitoringCountPaginatedResponse {
    items: [UserMonitoringCount!]!
    pageInfo: PaginationInfo!
  }

  extend type Query {
    userMonitoringByDate(
      email: String!
      startDate: String!
      endDate: String!
      pagination: PaginationInput
    ): UserMonitoringPaginatedResponse!

    topUsersWithMonitoring(
      startDate: String!
      endDate: String!
    ): [UserMonitoringCount!]!

    topUsersByTypeAndCountry(
      monitoringType: MonitoringType!
      countryId: String!
      startDate: String!
      endDate: String!
    ): [UserMonitoringCount!]!
  }
`; 