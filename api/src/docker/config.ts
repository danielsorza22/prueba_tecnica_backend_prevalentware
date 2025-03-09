// Configuración para Docker y ECS
export const dockerConfig = {
  // Configuración del contenedor
  container: {
    // Puerto en el que se ejecutará la aplicación
    port: process.env.PORT || 4000,
    // Límites de recursos
    resources: {
      cpu: '1 vCPU',
      memory: '2GB'
    },
    // Variables de entorno para el contenedor
    environment: {
      NODE_ENV: 'production'
    }
  },

  // Configuración de ECS
  ecs: {
    // Configuración del servicio
    service: {
      desiredCount: 2, // Número de instancias
      maxPercent: 200,
      minPercent: 50
    },
    // Configuración de Auto Scaling
    autoScaling: {
      min: 1,
      max: 4,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 70
    }
  },

  // Configuración de healthcheck
  healthCheck: {
    path: '/health',
    interval: 30, // segundos
    timeout: 5, // segundos
    retries: 3
  }
}; 