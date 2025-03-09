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

  # Queries (operaciones de lectura)
  type Query {
    # Usuarios
    users: [User!]!              # Lista de usuarios
    userByEmail(email: String!): User  # Buscar usuario por email
    
    # Países
    countries: [Country!]!       # Lista de países (solo Admin y Manager)

    # Monitoreo
    userMonitoringByDate(
      email: String!
      startDate: String!
      endDate: String!
    ): [UserMonitoring!]!       # Monitoreo de usuario por rango de fechas

    # Top usuarios por monitoreo
    topUsersWithMonitoring(
      startDate: String!
      endDate: String!
    ): [UserMonitoringCount!]!   # Top 3 usuarios con más registros de monitoreo

    # Top usuarios por tipo de monitoreo y país
    topUsersByTypeAndCountry(
      monitoringType: MonitoringType!
      countryId: ID!
      startDate: String!
      endDate: String!
    ): [UserMonitoringCount!]!   # Top 3 usuarios por tipo de monitoreo y país
  }
`; 