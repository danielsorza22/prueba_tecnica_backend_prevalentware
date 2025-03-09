#!/bin/bash

echo "Building ECS image..."
docker build -t my-graphql-api:ecs .

echo "Building Lambda image..."
docker build -t my-graphql-api:lambda -f Dockerfile.lambda .

echo "Testing ECS image..."
docker run -d --name test-ecs -p 4000:4000 my-graphql-api:ecs

echo "Testing Lambda image..."
docker run -d --name test-lambda -p 9000:8080 my-graphql-api:lambda

echo "Waiting for services to start..."
sleep 5

echo "Testing ECS endpoint..."
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __typename }"}'

echo "Testing Lambda endpoint..."
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"body":"{\"query\":\"query { __typename }\"}"}'

echo "Cleaning up..."
docker stop test-ecs test-lambda
docker rm test-ecs test-lambda 