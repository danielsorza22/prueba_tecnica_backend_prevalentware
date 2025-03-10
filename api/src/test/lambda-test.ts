import { handler } from '../aws/lambda';
import { Context } from 'aws-lambda';

const testEvent = {
  version: "2.0",
  routeKey: "POST /graphql",
  rawPath: "/graphql",
  headers: {
    "content-type": "application/json",
    "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJQcmV2YWxlbnR3YXJlIiwiaWF0IjoxNjkyOTEwNDcwLCJleHAiOjE3MjQ0NDY0NzAsImF1ZCI6Ind3dy5wcmV2YWxlbnR3YXJlLmNvbSIsInN1YiI6ImpvaG4uaGVybmFuZGV6QHRlc3QuY29tIiwiR2l2ZW5OYW1lIjoiSmhvbiIsIlN1cm5hbWUiOiJIZXJuYW5kZXoiLCJFbWFpbCI6ImpvaG4uaGVybmFuZGV6QHRlc3QuY29tIiwiUm9sZSI6ImNsbHBuMWRzZzAwMDAzODdlNnhxamRtdGQifQ.VWo5YWAyGa3klFDVQUo73xzFqkjR6DCEDskwZh3NpAY"
  },
  requestContext: {
    http: {
      method: "POST",
      path: "/graphql"
    }
  },
  body: JSON.stringify({
    query: `query Users { 
      users { 
        items { 
          name 
        } 
      } 
    }`
  })
};

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'test',
  memoryLimitInMB: '128',
  awsRequestId: 'test',
  logGroupName: 'test',
  logStreamName: 'test',
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

async function testLambda() {
  try {
    const response = await handler(testEvent as any, mockContext, () => {});
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testLambda(); 