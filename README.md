# GraphQL API Backend con Apollo Server y AWS CDK

## Descripción General
Este proyecto implementa una API GraphQL robusta y escalable utilizando un stack tecnológico moderno. La solución está diseñada para manejar monitoreo de usuarios, autenticación, y operaciones eficientes de base de datos, con soporte para despliegue tanto en AWS Lambda como en ECS.

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
Se implementó un sistema de autenticación basado en sesiones utilizando la carpeta `auth/`, siguiendo la estructura del boilerplate de PrevalentWare. Esta decisión se tomó por:
- **Seguridad**: Manejo seguro de sesiones con tokens
- **Escalabilidad**: Fácil integración con diferentes proveedores de autenticación
- **Mantenibilidad**: Estructura clara y separación de responsabilidades

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

## Configuración y Ejecución

### Requisitos Previos
- Node.js 18 o superior
- Docker Desktop
- PostgreSQL (para desarrollo local)

### Desarrollo Local
1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Generar Prisma Client:
```bash
npx prisma generate
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

### Ejecución con Docker

#### ECS (Desarrollo/Producción)
```bash
# Construir imagen
docker build -t my-graphql-api:ecs .

# Ejecutar contenedor
docker run -d --name api-ecs -p 4000:4000 my-graphql-api:ecs
```

#### Lambda (Serverless)
```bash
# Construir imagen
docker build -t my-graphql-api:lambda -f Dockerfile.lambda .

# Ejecutar contenedor
docker run -d --name api-lambda -p 9000:8080 my-graphql-api:lambda
```

### Pruebas
```bash
# Ejecutar tests
npm test

# Ver cobertura
npm run test:coverage
```

## Estrategia de Despliegue

### Infraestructura AWS
El proyecto utiliza AWS CDK para definir y desplegar la infraestructura como código, incluyendo:
- VPC y Security Groups
- RDS para PostgreSQL
- ECS Cluster (opcional)
- Lambda Functions
- API Gateway
- Secrets Manager

### Pipeline de Despliegue
1. **Desarrollo**:
   - Trigger: Push a rama `dev`
   - Despliegue automático a ambiente de desarrollo

2. **Producción**:
   - Trigger: Push a rama `main`
   - Despliegue automático a ambiente de producción
   - Validaciones adicionales de seguridad

### Monitoreo y Logs
- CloudWatch para logs y métricas
- X-Ray para tracing (opcional)
- Alertas configurables por ambiente

## Endpoints GraphQL

### Producción
- ECS: `https://api.tudominio.com/graphql`
- Lambda: `https://api.tudominio.com/dev/graphql`

### Desarrollo
- Local: `http://localhost:4000`
- Docker: `http://localhost:4000` (ECS) o `http://localhost:9000` (Lambda)

