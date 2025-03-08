import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { execSync } from 'child_process';
import 'dotenv/config';

const sm = new SecretsManagerClient({ region: 'us-east-1' });
export const runMigration = async () => {
  try {
    const schema = process.argv.slice(2)[0];
    if (schema !== 'npx') {
      const getSecretValueCommand = new GetSecretValueCommand({
        SecretId: process.env.SECRET_ID,
      });
      const dbURL = await sm.send(getSecretValueCommand);
      const secretString = JSON.parse(dbURL.SecretString || '{}');
      const url = `postgresql://${secretString.username}:${secretString.password}@${secretString.host}:${secretString.port}/${secretString.dbname}?schema=${schema}`;
      process.env.DATABASE_URL = url;
      // eslint-disable-next-line
      console.log('Iniciando migracion');
      execSync(process.argv.slice(3).join(' ') ?? 'npx prisma migrate dev', {
        stdio: 'inherit',
      });
      // eslint-disable-next-line
      console.log('Migracion finalizada');
    } else {
      // eslint-disable-next-line
      console.error('Falta el esquema');
    }
  } catch (e) {
    // eslint-disable-next-line
    console.log('Error getting secret', e);
    process.exit(1);
  }
};

runMigration();
