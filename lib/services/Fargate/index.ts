import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

import { APP_NAME, PROJECT } from '@/config';
import { Duration } from 'aws-cdk-lib';
import { Environment } from '@/types';

export class Fargate extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }
  buildECSCluster(
    dockerFilePath: string,
    secret: secretsManager.ISecret | undefined,
    vpc: ec2.IVpc,
    id: string,
    environment: Environment
  ) {
    const cluster = new ecs.Cluster(this, `${id}-ecs-cluster`, {
      vpc: vpc,

      clusterName: `${PROJECT}-${APP_NAME}-cluster-${environment}`,
      containerInsights: true,
    });

    // fargate task definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'ApiTaskDefinition',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
      }
    );

    // const container = fargateTaskDefinition.addContainer(
    //   `${id}-task-container`,
    //   {
    //     // Use an image from Amazon ECR
    //     image: ecs.ContainerImage.fromAsset(dockerFilePath, {
    //       file: 'Dockerfile.fargate',
    //     }),
    //     logging: ecs.LogDrivers.awsLogs({
    //       streamPrefix: `${PROJECT}-${APP_NAME}-logs-${environment}`,
    //     }),

    //     portMappings: [
    //       { containerPort: 80, hostPort: 80 },
    //       { containerPort: 443, hostPort: 443 },
    //     ],
    //     environment: {
    //       SECRET_ID: secret?.secretName || '',
    //       AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    //       TEST: 'false',
    //     },
    //     healthCheck: {
    //       command: [
    //         'CMD-SHELL',
    //         'curl -f http://localhost:80/healthcheck || exit 1',
    //       ],
    //       interval: Duration.minutes(1),
    //       timeout: Duration.seconds(5),
    //       retries: 3,
    //       startPeriod: Duration.seconds(0),
    //     },
    //   }
    // );

    if (secret) {
      // Create an IAM policy statement that allows access to the secret
      const secretAccessPolicy = new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [secret.secretArn], // Ensure that `secret` is the AWS Secrets Manager secret object
        effect: iam.Effect.ALLOW,
      });

      // Attach the policy statement to the task role
      fargateTaskDefinition.taskRole.addToPrincipalPolicy(secretAccessPolicy);
    }

    return { cluster, fargateTaskDefinition };
  }

  buildECSFargateService(
    cluster: ecs.Cluster,
    taskDefinition: ecs.FargateTaskDefinition,
    vpc: ec2.IVpc,
    desiredCount: number = 2,
    id: string,
    environment: Environment
  ) {
    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}-fargate-service`,
      {
        cluster: cluster, // Required
        desiredCount, // Default is 1
        taskDefinition: taskDefinition, // Required
        cpu: 512, // Default is 256
        memoryLimitMiB: 2048, // Default is 512

        publicLoadBalancer: true, // Default is true
        loadBalancerName: `${PROJECT}-${APP_NAME}-lb-${environment}`,
        healthCheckGracePeriod: Duration.minutes(1),
        propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
        minHealthyPercent: 0,
        maxHealthyPercent: 400,
      }
    );

    service.targetGroup.configureHealthCheck({
      port: '80',
      protocol: elbv2.Protocol.HTTP,
      enabled: true,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      path: '/healthcheck',
      interval: Duration.minutes(3),
      timeout: Duration.minutes(1),
    });

    const lb = service.loadBalancer;
    const sg = new ec2.SecurityGroup(this, `${id}-https-security-group`, {
      vpc,
      securityGroupName: `${PROJECT}-${APP_NAME}-https-security-group-${environment}`,
    });

    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );
    lb.addSecurityGroup(sg);

    // const certificateArn =
    //   'arn:aws:acm:us-east-1:957462150790:certificate/dd869319-e2bd-4298-b695-1291210cfe95';

    // const httpsListener = lb.addListener(`${id}-https-listener`, {
    //   port: 443,
    //   certificates: [elbv2.ListenerCertificate.fromArn(certificateArn)],
    //   open: true,
    //   defaultTargetGroups: [service.targetGroup],
    // });

    return service;
  }
}
