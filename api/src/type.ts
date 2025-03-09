// Aquí irá el schema de GraphQL

export const typeDefs = `#graphql
  # Enumeración para los roles
  enum RoleName {
    Admin
    Manager
    User
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
  }
`; 