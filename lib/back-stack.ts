/* eslint-disable */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Environment } from '@/types';
import { APIGateway } from '@/lib/services/APIGateway';
//import { Fargate } from '@/lib/services/Fargate';
import { Lambda } from '@/lib/services/Lambda';
import { RDS } from '@/lib/services/RDS';
import { S3 } from '@/lib/services/S3';
import { SecretsManager } from '@/lib/services/SecretsManager';

import { VPC } from '@/lib/services/VPC';
import { APP_NAME, BUCKETS, PROJECT } from '@/config';

interface BucketInput {
  name: string;
  versioned?: boolean;
  lifecycleRules?: cdk.aws_s3.LifecycleRule[];
}

export class BackStack extends cdk.Stack {
  deployEnvironment: Environment;
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps,
    env?: Environment | undefined
  ) {
    super(scope, id, props);

    this.deployEnvironment = env || Environment.DEV;

    const dbSecret = new SecretsManager(
      this,
      `${id}-dbSecret`
    ).buildSecretManager(
      `${PROJECT}-${APP_NAME}-db-secret-${this.deployEnvironment}`,
      'secret to keep db credentials',
      true
    );

    // Este secret es para almacenar las variables de entorno para evitar .env y deben ser guardadas manualmente por la consola de AWS
    const applicationSecret = new SecretsManager(
      this,
      `${id}-applicationSecret`
    ).buildSecretManager(
      `${PROJECT}-${APP_NAME}-app-secret-${this.deployEnvironment}`,
      'secret to keep environment variables',
      false
    );

    // Crear cluster de base de datos solo si el entorno es diferente de test
    let cluster = undefined;
    if (this.deployEnvironment !== Environment.TEST) {
      const vpc = new VPC(this, `${id}-vpc`).buildVPC(this.deployEnvironment);
      const rds = new RDS(this, `${id}-rds`);
      const securityGroup = rds.buildDatabaseSecurityGroup(
        vpc,
        this.deployEnvironment
      );
      cluster = rds.buildDatabase(
        vpc,
        securityGroup,
        dbSecret,
        this.deployEnvironment,
        id
      );
    }

    // Convertir el objeto BUCKETS en un array de BucketInput
    const bucketInputs: BucketInput[] = Object.entries(BUCKETS).map(([_, value]) => ({
      name: value as string,
      versioned: true,
    }));

    // Crear los buckets
    this.createBuckets(bucketInputs);

    const s3 = new S3(this, `${id}-s3`);
    const buckets = s3.buildS3Array(BUCKETS, this.deployEnvironment);
    const privateBucket = buckets.find((bucket) => !bucket.isPublic)?.bucket;

    const lambda = new Lambda(this, `${id}-lambda`).buildServerLambda(
      cluster,
      privateBucket,
      dbSecret,
      applicationSecret,
      this.deployEnvironment
    );

    const apiGateway = new APIGateway(this, `${id}-apiGateway`).buildApiGateway(
      lambda,
      this.deployEnvironment
    );

    // Se genera server de fargate cuando el entorno sea produccion y el aplicativo lo requiera, de lo contrario desplegar en lambda
    // if (this.deployEnvironment === Environment.PROD) {
    //   //ecs fargate for gateway
    //   const fargate = new Fargate(this, `${id}-fargate`);
    //   const { cluster: ecsCluster, fargateTaskDefinition } = fargate.buildECSCluster(
    //     'api',
    //     dbSecret,
    //     vpc
    //   );
    //   const ecsService = fargate.buildECSFargateService(ecsCluster, fargateTaskDefinition, vpc);
    // }
  }

  private createBuckets(buckets: BucketInput[]) {
    buckets.forEach((bucket) => {
      new cdk.aws_s3.Bucket(this, `${bucket.name}-bucket`, {
        bucketName: bucket.name,
        versioned: bucket.versioned,
        lifecycleRules: bucket.lifecycleRules,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    });
  }
}
