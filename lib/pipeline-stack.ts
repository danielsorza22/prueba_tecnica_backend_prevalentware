import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { APP_NAME, PROJECT } from '@/config';
import { Environment } from '@/types';
import { SecretsManager } from './services/SecretsManager';
import { CodePipeline } from './services/CodePipeline';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // crear un secrets manager para guardar el token de GitHub
    const pipeLineSecret = new SecretsManager(
      this,
      `${id}-pipeline-secret`
    ).buildSecretManager(
      `${PROJECT}-${APP_NAME}-pipeline-secret`,
      'secret to keep github credentials',
      false
    );

    // crear un role para que el pipeline pueda desplegar
    const pipeLine = new CodePipeline(this, `${id}-pipeline`);
    const role = pipeLine.buildPipelineRole();

    // construir el pipeline de DEV
    pipeLine.buildPipeline(role, pipeLineSecret, Environment.DEV, id);

    // construir el pipeline de TEST
    pipeLine.buildPipeline(role, pipeLineSecret, Environment.TEST, id);

    // construir el pipeline de PROD
    pipeLine.buildPipeline(role, pipeLineSecret, Environment.PROD, id);
  }
}
