import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { APP_NAME, CIDR_RANGE, PROJECT } from '@/config';

export class VPC extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
  }
  buildVPC(deployEnvironment: string) {
    const identifier = `${PROJECT}-${APP_NAME}-vpc-${deployEnvironment}`;
    const vpc = new ec2.Vpc(this, identifier, {
      vpcName: identifier,
      ipAddresses: ec2.IpAddresses.cidr(CIDR_RANGE),
      maxAzs: 2,
      natGateways: 0, // Disable NAT gateways
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
          // Enable auto-assign public IPv4 address
          mapPublicIpOnLaunch: true,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: 'Private',
          cidrMask: 24,
        },
      ],
    });
    return vpc;
  }
}
