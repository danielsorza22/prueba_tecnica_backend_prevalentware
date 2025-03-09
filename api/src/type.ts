// Aquí irá el schema de GraphQL

export const typeDefs = `#graphql
  # Enumeración para los roles
  enum RoleName {
    Admin
    Manager
    User
  }

  # Enumeración para tipos de monitoreo
  enum MonitoringType {
    signIn
    print
    share
  }

  # Tipo Role
  type Role {
    id: ID!
    name: RoleName!
    createdAt: String!
    users: [User!]
  }

  # Tipo Country
  type Country {
    id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
    users: [User!]
  }

  # Tipo UserMonitoring
  type UserMonitoring {
    id: ID!
    usage: Int!
    description: String!
    userId: String!
    createdAt: String!
    user: User!
  }

  # Tipo User
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
    roleId: String
    role: Role
    countries: [Country!]
    monitoring: [UserMonitoring!]
  }

  # Tipo para el conteo de monitoreo por usuario
  type UserMonitoringCount {
    user: User!
    monitoringCount: Int!
  }

  # Tipo para la información de paginación
  type PaginationInfo {
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  # Tipo para la respuesta paginada de usuarios
  type UserPaginatedResponse {
    items: [User!]!
    pageInfo: PaginationInfo!
  }

  # Tipo para la respuesta paginada de monitoreo
  type UserMonitoringPaginatedResponse {
    items: [UserMonitoring!]!
    pageInfo: PaginationInfo!
  }

  # Tipo para la respuesta paginada de conteo de monitoreo
  type UserMonitoringCountPaginatedResponse {
    items: [UserMonitoringCount!]!
    pageInfo: PaginationInfo!
  }

  # Tipo para la respuesta paginada de países
  type CountryPaginatedResponse {
    items: [Country!]!
    pageInfo: PaginationInfo!
  }

  # Input para la paginación
  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }

  # Queries (operaciones de lectura)
  type Query {
    # Usuarios
    users(pagination: PaginationInput): UserPaginatedResponse!
    userByEmail(email: String!): User
    
    # Países
    countries(pagination: PaginationInput): CountryPaginatedResponse!

    # Monitoreo
    userMonitoringByDate(
      email: String!
      startDate: String!
      endDate: String!
      pagination: PaginationInput
    ): UserMonitoringPaginatedResponse!

    # Top usuarios por monitoreo
    topUsersWithMonitoring(
      startDate: String!
      endDate: String!
      pagination: PaginationInput
    ): UserMonitoringCountPaginatedResponse!

    # Top usuarios por tipo de monitoreo y país
    topUsersByTypeAndCountry(
      monitoringType: MonitoringType!
      countryId: String!
      startDate: String!
      endDate: String!
      pagination: PaginationInput
    ): UserMonitoringCountPaginatedResponse!
  }
`; 