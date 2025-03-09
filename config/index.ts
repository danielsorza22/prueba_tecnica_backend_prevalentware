export const APP_NAME = 'prueba-tecnica-backend';
export const PROJECT = 'prevalentware';
export const ACCOUNT = process.env.AWS_ACCOUNT_ID || '';
export const REGION = process.env.AWS_REGION || 'us-east-1';
export const REPO = process.env.GITHUB_REPOSITORY || 'prueba-tecnica-backend';
export const CIDR_RANGE = '10.0.0.0/16';

export const BUCKETS = {
  artifacts: 'artifacts-bucket',
};

export const config = {
  app: {
    name: APP_NAME,
    env: process.env.NODE_ENV || 'development',
  },
  aws: {
    account: ACCOUNT,
    region: REGION,
  },
  vpc: {
    maxAzs: 2,
    cidr: CIDR_RANGE,
  },
  rds: {
    instanceType: 't3.micro',
    databaseName: 'mydb',
  },
  lambda: {
    memorySize: 1024,
    timeout: 30,
  },
  ecs: {
    desiredCount: 2,
    cpu: 256,
    memoryLimitMiB: 512,
  },
}; 