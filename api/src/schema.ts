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
    code: String!
    createdAt: String!
    updatedAt: String!
    users: [User!]
  }

  # Tipo UserMonitoring
  type UserMonitoring {
    id: ID!
    userId: String!
    data: String!
    createdAt: String!
    updatedAt: String!
    user: User!
  }

  # Tipo Session
  type Session {
    id: ID!
    sessionToken: String!
    userId: String!
    expiresAt: String!
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
    sessions: [Session!]
    countries: [Country!]
    monitoring: [UserMonitoring!]
  }

  # Queries (operaciones de lectura)
  type Query {
    # Usuarios
    me: User!                    # Obtener usuario autenticado
    users: [User!]!              # Lista de usuarios (requiere Admin)
    user(id: ID!): User         # Buscar usuario por ID (requiere Admin)
    userByEmail(email: String!): User  # Buscar usuario por email
    
    # Roles
    roles: [Role!]!             # Lista de roles (requiere Admin)
    
    # Sesiones
    sessions: [Session!]!       # Lista de sesiones del usuario actual

    # Países
    countries: [Country!]!      # Lista de países
    
    # Monitoreo
    monitoring: [UserMonitoring!]! # Lista de monitoreo (requiere Admin o propio usuario)
  }

  # Mutations (operaciones de escritura)
  type Mutation {
    # Usuarios
    updateUser(
      name: String
      position: String
    ): User!                    # Actualizar usuario actual
    
    updateUserRole(
      userId: ID!
      roleId: ID!
    ): User!                    # Actualizar rol de usuario (requiere Admin)
    
    deleteUser(
      id: ID!
    ): User!                    # Eliminar usuario (requiere Admin)

    # Países
    createCountry(
      name: String!
      code: String!
    ): Country!                # Crear país (requiere Admin)

    # Monitoreo
    createUserMonitoring(
      userId: ID!
      data: String!
    ): UserMonitoring!        # Crear monitoreo (requiere Admin)
  }
`;

