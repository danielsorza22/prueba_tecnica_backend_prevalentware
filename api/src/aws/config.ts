// Configuración para AWS Lambda y otros servicios de AWS
export const awsConfig = {
  // Región de AWS donde se desplegará la función Lambda
  region: process.env.AWS_REGION || 'us-east-1',
  
  // Configuración de la función Lambda
  lambda: {
    // Tiempo máximo de ejecución (en segundos)
    timeout: 30,
    // Memoria asignada (en MB)
    memorySize: 1024,
    // Variables de entorno específicas para Lambda
    environment: {
      NODE_ENV: 'production',
      // Aquí puedes agregar otras variables de entorno necesarias
    }
  },

  // Configuración de API Gateway
  apiGateway: {
    // Configuración CORS
    cors: {
      allowOrigins: ['*'], // Reemplazar con los dominios permitidos en producción
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization']
    }
  }
}; 