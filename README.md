# GraphQL API Backend - Prueba Técnica

## Decisiones Técnicas y Arquitectura

### 1. Autenticación y Autorización

El proyecto se construyó sobre el boiler de Prevalentware, aprovechando su robusto sistema de autenticación ubicado en `api/src/auth`. Esta decisión se justifica por:

- **Seguridad**: Implementa JWT con manejo seguro de sesiones y tokens
- **Escalabilidad**: Arquitectura modular que permite agregar nuevos métodos de autenticación
- **Control de Acceso**: Sistema RBAC (Role-Based Access Control) que permite gestionar permisos por rol
- **Middleware Reutilizable**: El decorador `withSessionCheck` facilita la protección de resolvers

### 2. Queries Principales

El sistema implementa los siguientes queries GraphQL (acceso restringido según rol):

- **users**: Lista paginada de usuarios con acceso controlado por rol
- **userByEmail**: Busca usuario específico por email 
- **countries**: Lista países disponibles en el sistema
- **topUsersByTypeAndCountry**: Estadísticas de usuarios por tipo de monitoreo y país
- **topUsersWithMonitoring**: Top 3 usuarios con más registros de monitoreo
- **userMonitoringByDate**: Registros de monitoreo filtrados por fecha con paginación

### 3. Manejo de Errores

Implementación robusta de errores mediante:

```typescript
- AuthenticationError: Errores de autenticación (token inválido/expirado)
- AuthorizationError: Errores de permisos (rol inadecuado)
- ValidationError: Errores de datos de entrada
```

Los errores son capturados y formateados para proporcionar respuestas consistentes al cliente.

### 4. Sistema de Paginación

Implementación de paginación tipo "offset" con:

```typescript
type PaginationInput {
  page: Int
  pageSize: Int
}

type PageInfo {
  totalCount: Int
  currentPage: Int
  totalPages: Int
  hasNextPage: Boolean
  hasPreviousPage: Boolean
}
```

Ejemplo de uso:
```graphql
query {
  users(pagination: { page: 1, pageSize: 10 }) {
    items { ... }
    pageInfo { ... }
  }
}
```

### 5. Optimización de Consultas

El resolver `topUsersByTypeAndCountry` utiliza SQL nativo en lugar de Prisma por razones de rendimiento:

- **Joins Optimizados**: SQL permite optimizar los joins entre tablas
- **Agregaciones Eficientes**: Mejor rendimiento en operaciones COUNT y GROUP BY
- **Índices**: Aprovechamiento directo de índices de base de datos
- **Memoria**: Menor consumo de memoria al procesar grandes conjuntos de datos

### 6. Pruebas Unitarias

Implementación de pruebas con Jest:

```bash
# Ejecutar pruebas
npm test


Las pruebas cubren:
- Resolvers GraphQL
- Middleware de autenticación
- Lógica de negocio
- Control de acceso

### 7. Containerización

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

### 8. Propuesta de Despliegue

La arquitectura propuesta utiliza:

1. **Infraestructura AWS**:
   - ECS Fargate para la versión containerizada
   - Lambda + API Gateway para la versión serverless
   - RDS PostgreSQL para la base de datos
   - CloudWatch para logs y monitoreo

2. **CI/CD Pipeline**:
   - GitHub Actions para automatización
   - Tests automáticos en PRs
   - Despliegue automático a staging
   - Despliegue manual a producción

3. **Monitoreo y Escalado**:
   - Auto-scaling basado en demanda
   - Alertas de rendimiento
   - Backup automático de datos

## Inicio Rápido

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno: `.env`
4. Generar cliente Prisma: `npx prisma generate`
5. Iniciar en desarrollo: `npm run dev`


