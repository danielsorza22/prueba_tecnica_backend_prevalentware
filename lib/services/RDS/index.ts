import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { ScheduleType, buildCron } from '@/utils/cron';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import { Lambda } from '@/lib/services/Lambda';
import { Environment } from '@/types';
import { APP_NAME, PROJECT } from '@/config';

export class RDS extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  buildDatabase(
    vpc: ec2.IVpc,
    securityGroup: ec2.SecurityGroup,
    dbSecret: secretsManager.Secret,
    deployEnvironment: string,
    id: string
  ) {
    const project = PROJECT.toLowerCase().replace(/-/g, '_');
    const identifier = `${PROJECT}-${APP_NAME}-db-${deployEnvironment}`;

    const cluster = new rds.DatabaseInstance(this, identifier, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        deployEnvironment === Environment.PROD
          ? ec2.InstanceSize.MICRO
          : ec2.InstanceSize.MICRO
      ),
      vpc,
      caCertificate: rds.CaCertificate.RDS_CA_RDS2048_G1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      credentials: rds.Credentials.fromSecret(dbSecret),
      allocatedStorage: 20,
      instanceIdentifier: identifier,
      databaseName: `${project}`,
      multiAz: false,
      publiclyAccessible: true,
      storageType: rds.StorageType.GP2,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      securityGroups: [securityGroup],
    });

    if (deployEnvironment === Environment.PROD) {
      // add a lambda function to turn off or start the database
      new Lambda(
        this,
        `${PROJECT}-${APP_NAME}-db-manager-${deployEnvironment}`
      ).buildDBManagerLambda(
        cluster,
        {
          startSchedule: null,
          stopSchedule: buildCron(ScheduleType.EVERY_DAY, 18, -5),
        },
        deployEnvironment,
        id
      );
    }

    if (deployEnvironment === Environment.DEV) {
      // add a lambda function to turn off or start the database
      new Lambda(
        this,
        `${PROJECT}-${APP_NAME}-db-manager-${deployEnvironment}`
      ).buildDBManagerLambda(
        cluster,
        {
          startSchedule: null, // buildCron(ScheduleType.EVERY_DAY, 6, -5),
          stopSchedule: buildCron(ScheduleType.EVERY_DAY, 18, -5),
        },
        deployEnvironment,
        id
      );
    }

    //this.addCustomerTags(cluster);
    return cluster;
  }
  buildDatabaseSecurityGroup(vpc: ec2.Vpc, environment: Environment) {
    const identifier = `${PROJECT}-${APP_NAME}-db-sg-${environment}`;
    const securityGroup = new ec2.SecurityGroup(this, identifier, {
      securityGroupName: identifier,
      vpc,
      description: 'Allow postgres access',
      allowAllOutbound: true, // set to false if you want to control outbound traffic
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // or specify a particular CIDR block or security group
      ec2.Port.tcp(5432)
    );

    return securityGroup;
  }
}
