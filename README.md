# GraphQL API Backend con Apollo Server y AWS CDK

## Guía Rápida de Inicio

### 1. Preparación del Entorno
Antes de comenzar, asegúrate de tener instalado:
- Node.js 18 o superior
- Docker Desktop
- PostgreSQL
- Un editor de código (recomendado: cursor)

### 2. Configuración Inicial
1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd prueba-tecnica-backend-prevalentware
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```
Edita el archivo `.env` con tus credenciales de base de datos:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_db"
```

4. Genera el cliente Prisma:
```bash
npx prisma generate
```

5. Inicia el servidor en modo desarrollo:
```bash
npm run dev
```
El servidor estará disponible en: http://localhost:4000

### 3. Probando la API

#### Herramientas Recomendadas
- Apollo Studio (accesible desde http://localhost:4000)
- Insomnia
- Postman

#### Autenticación
Todas las peticiones requieren un token de autenticación en los headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

#### Ejemplos de Queries por Rol

1. **User** (acceso limitado a sus datos)
```graphql
query MyProfile {
  me {
    id
    name
    email
    countries {
      id
      name
    }
  }
}
```

2. **Manager** (acceso a datos de usuarios)
```graphql
query GetUsers {
  users(skip: 0, take: 10) {
    id
    name
    email
    role
  }
}
```

3. **Admin** (acceso completo)
```graphql
query MonitoringStats {
  topUsersByTypeAndCountry(
    monitoringType: signIn
    countryId: 1
    startDate: "2024-03-01"
    endDate: "2024-03-09"
  ) {
    user {
      id
      name
    }
    count
  }
}
```

#### Paginación
La API implementa paginación tipo offset. Usa los parámetros:
- `skip`: Número de registros a saltar
- `take`: Número de registros a retornar

Ejemplo:
```graphql
query PaginatedUsers {
  users(skip: 0, take: 5) {
    id
    name
    email
  }
}
```

### 4. Ejecutando con Docker

#### Versión ECS (Apollo Server)
```bash
# Construir imagen
docker build -t my-graphql-api:ecs .

# Ejecutar contenedor
docker run -d --name api-ecs -p 4000:4000 my-graphql-api:ecs
```

#### Versión Lambda
```bash
# Construir imagen
docker build -t my-graphql-api:lambda -f Dockerfile.lambda .

# Ejecutar contenedor
docker run -d --name api-lambda -p 9000:8080 my-graphql-api:lambda
```

### 5. Control de Acceso (RBAC)

La API implementa tres niveles de acceso:

1. **User**
   - Solo puede ver sus propios datos
   - Acceso a sus países asociados
   - Acceso limitado a su monitoreo

2. **Manager**
   - Puede ver datos de todos los usuarios
   - Acceso a todos los países
   - No puede ver datos de monitoreo

3. **Admin**
   - Acceso completo a todos los endpoints
   - Sin restricciones de consulta

Si intentas acceder a datos no autorizados para tu rol, recibirás un error de autorización.

### 6. Propuesta de Despliegue

#### Ambientes

1. **Desarrollo**
   - URL: `https://dev-api.tudominio.com/graphql`
   - Se despliega automáticamente con pushes a rama `develop`
   - Ideal para pruebas y QA

2. **Producción**
   - URL: `https://api.tudominio.com/graphql`
   - Se despliega con pushes a rama `main`
   - Requiere aprobación manual
   - Incluye pruebas de seguridad


### 7. Pruebas

Para ejecutar las pruebas unitarias:
```bash
npm test
```


## Descripción General
Este proyecto implementa una API GraphQL robusta y escalable utilizando un stack tecnológico moderno. La solución está diseñada para manejar monitoreo de usuarios, autenticación basada en tokens, y control de acceso basado en roles (RBAC), con soporte para despliegue tanto en AWS Lambda como en ECS.

## Stack Tecnológico
- **Node.js**: Runtime de JavaScript para el backend
- **Apollo Server**: Framework GraphQL para Node.js
- **Prisma**: ORM moderno para TypeScript/Node.js
- **PostgreSQL**: Sistema de gestión de base de datos relacional
- **TypeScript**: Superset tipado de JavaScript
- **Docker**: Containerización de aplicaciones
- **Jest**: Framework de pruebas unitarias
- **AWS CDK**: Infrastructure as Code para AWS

## Decisiones Arquitectónicas

### Autenticación y Autorización
Se implementó un sistema de autenticación basado en tokens utilizando la carpeta `auth/`, siguiendo la estructura del boilerplate de PrevalentWare. Esta decisión se tomó por:

#### Sistema de Tokens
- **Validación de Sesión**: Cada request GraphQL requiere un token en los headers que se valida contra la tabla `Session`
- **Recuperación de Usuario**: El token se utiliza para obtener el usuario asociado y su rol
- **Persistencia**: Los tokens no tienen fecha de expiración para propósitos de prueba
- **Seguridad**: Manejo seguro de sesiones existentes (no se crean nuevos tokens)

#### Control de Acceso Basado en Roles (RBAC)
Se implementaron tres niveles de acceso:

1. **User**:
   - Acceso limitado a sus propios datos
   - Puede ver sus países asociados
   - Puede acceder a su información de monitoreo (UserMonitoring)

2. **Manager**:
   - Acceso a datos de todos los usuarios
   - Acceso a información de todos los países
   - No tiene acceso a datos de UserMonitoring

3. **Admin**:
   - Acceso completo a todos los datos
   - Puede ver información de todos los usuarios
   - Acceso a todos los datos de monitoreo
   - Sin restricciones en consultas

#### Implementación Técnica
- Middleware de autenticación que valida tokens
- Resolvers protegidos con verificación de roles
- Filtrado de datos basado en el rol del usuario
- Manejo de errores específicos para problemas de autenticación/autorización

### Optimización de Queries
#### SQL Raw para TopUsers
El resolver `topUsersByTypeAndCountry` se implementó usando SQL raw por:
- **Eficiencia**: Reduce múltiples queries a una sola consulta SQL optimizada
- **Rendimiento**: Evita el problema N+1 común en GraphQL
- **Escalabilidad**: Mejor manejo de grandes conjuntos de datos

#### DataLoader para Resolvers de Campo
Se implementó DataLoader para optimizar las consultas relacionadas, específicamente en:
- Carga de roles de usuario
- Relaciones many-to-one
Beneficios:
- **Batch Loading**: Agrupa múltiples solicitudes en una sola query
- **Caching**: Almacena en caché los resultados durante el ciclo de vida de la request
- **Reducción de Queries**: Minimiza el número de consultas a la base de datos

### Paginación
Se implementó paginación offset-based para las queries que retornan listas:
- **Flexibilidad**: Soporte para skip/take
- **Consistencia**: Resultados predecibles y ordenados
- **Performance**: Límites configurables para prevenir sobrecarga

### Pruebas Unitarias
Se configuró Jest como framework de testing por:
- **Mocking Robusto**: Facilidad para simular dependencias
- **Cobertura**: Herramientas integradas de coverage
- **Sintaxis Clara**: Describe/it para tests legibles

