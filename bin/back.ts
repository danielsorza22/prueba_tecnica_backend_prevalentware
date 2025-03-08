#!/usr/bin/env node
/* eslint-disable */
import * as cdk from 'aws-cdk-lib';
import { BackStack } from '@/lib/back-stack';
import { PipelineStack } from '@/lib/pipeline-stack';
import { ACCOUNT, APP_NAME, REGION, PROJECT } from '@/config';
import { Environment } from '@/types';

const app = new cdk.App();


const backStackDev = new BackStack(
  app,
  `${PROJECT}-${APP_NAME}-stack-${Environment.DEV}`,
  {
    env: { account: ACCOUNT, region: REGION },
  },
  Environment.DEV
);

const backStackTest = new BackStack(
  app,
  `${PROJECT}-${APP_NAME}-stack-${Environment.TEST}`,
  {
    env: { account: ACCOUNT, region: REGION },
  },
  Environment.TEST
);

const backStackProd = new BackStack(
  app,
  `${PROJECT}-${APP_NAME}-stack-${Environment.PROD}`,
  {
    env: { account: ACCOUNT, region: REGION },
  },
  Environment.PROD
);

const pipelineStack = new PipelineStack(
  app,
  `${PROJECT}-${APP_NAME}-stack-cicd`,
  {
    env: { account: ACCOUNT, region: REGION },
  }
);

