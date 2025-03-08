export const sessionConfig = {
  Query: [
    // Datos del usuario autenticado
    { name: 'me', roles: ['Admin', 'Manager', 'User'], isPublic: false },
    { name: 'myCountries', roles: ['Admin', 'Manager', 'User'], isPublic: false },
    { name: 'myMonitoring', roles: ['Admin', 'User'], isPublic: false },

    // Listados generales (solo Admin y Manager)
    { name: 'users', roles: ['Admin', 'Manager'], isPublic: false },
    { name: 'countries', roles: ['Admin', 'Manager'], isPublic: false },

    // Datos específicos
    { name: 'user', roles: ['Admin', 'Manager'], isPublic: false },
    { name: 'userByEmail', roles: ['Admin', 'Manager', 'User'], isPublic: false },
    { name: 'country', roles: ['Admin', 'Manager'], isPublic: false },

    // Monitoreo (solo Admin)
    { name: 'userMonitoring', roles: ['Admin'], isPublic: false },
    
    // Roles (solo Admin)
    { name: 'roles', roles: ['Admin'], isPublic: false },
  ],

  Mutation: [
    // Operaciones de usuario
    { name: 'updateMyProfile', roles: ['Admin', 'Manager', 'User'], isPublic: false },
    { name: 'updateUser', roles: ['Admin'], isPublic: false },
    { name: 'deleteUser', roles: ['Admin'], isPublic: false },

    // Operaciones de país
    { name: 'createCountry', roles: ['Admin'], isPublic: false },
    { name: 'updateCountry', roles: ['Admin'], isPublic: false },
    { name: 'deleteCountry', roles: ['Admin'], isPublic: false },

    // Operaciones de monitoreo
    { name: 'createUserMonitoring', roles: ['Admin'], isPublic: false },
  ],
}; 