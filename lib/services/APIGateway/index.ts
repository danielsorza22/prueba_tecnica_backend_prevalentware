import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import { APP_NAME, PROJECT } from '@/config';

export class APIGateway extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  buildApiGateway(
    lambda: lambda.DockerImageFunction,
    deployEnvironment: string
  ) {
    const identifier = `${PROJECT}-${APP_NAME}-api-${deployEnvironment}`;
    const apiGw = new apiGateway.LambdaRestApi(this, identifier, {
      restApiName: identifier,
      handler: lambda,
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: [
          ...apiGateway.Cors.DEFAULT_HEADERS,
          'next-auth.session-token',
        ],
      },
    });
    return apiGw;
  }
}
