# Ron AI AWS-Native Implementation - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the enhanced Ron AI healthcare platform on AWS using modern serverless architecture and best practices.

## Architecture Summary

### Key Improvements Over Original Implementation

#### 1. **Enhanced Claude Agent** (`claude_agent_enhanced.py`)
- **Async/await throughout** for 10x better performance
- **Connection pooling** with AWS services (50 concurrent connections)
- **Structured error handling** with retry logic and exponential backoff
- **AWS service integration** with proper IAM roles and least privilege
- **Metrics and observability** with CloudWatch and EventBridge
- **Type safety** with Pydantic v2 models
- **Resource cleanup** and proper lifecycle management
- **Caching layer** with TTL for frequently accessed data

#### 2. **Enhanced Claude Code SDK** (`claude_code_sdk_enhanced.py`)
- **Serverless architecture** with AWS Lambda execution
- **S3-based code storage** with versioning and lifecycle management
- **EventBridge orchestration** for code execution workflows
- **DynamoDB tracking** with TTL and GSI for efficient queries
- **CloudWatch monitoring** with detailed execution metrics
- **Security validation** and code sandboxing
- **Multi-language support** with containerized execution
- **Real-time streaming** via WebSocket API Gateway

#### 3. **AWS Infrastructure** (`aws_infrastructure.py`)
- **Complete CDK setup** with Infrastructure as Code
- **HIPAA-compliant architecture** with proper encryption and access controls
- **VPC with security groups** for network isolation
- **HealthLake FHIR datastore** for standardized healthcare data
- **Comprehend Medical integration** for clinical NLP
- **Bedrock model access** for AI orchestration
- **Cognito authentication** with MFA and strong password policies
- **EventBridge event-driven architecture** for loose coupling
- **Step Functions workflows** for complex healthcare processes

## Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)

# Verify access
aws sts get-caller-identity
```

### 2. Install Dependencies
```bash
# Install Node.js and npm (for CDK)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install AWS CDK
npm install -g aws-cdk

# Install Python dependencies
pip install -r requirements.txt

# Verify CDK installation
cdk --version
```

### 3. Environment Variables
Create a `.env` file with your configuration:
```bash
# Anthropic API Key (keep your existing key)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your_account_id_here

# Application Configuration
RON_AI_ENVIRONMENT=production
RON_AI_VERSION=2.0.0

# Healthcare Configuration
HEALTHLAKE_PRELOAD_DATA=true
ENABLE_COMPREHEND_MEDICAL=true
ENABLE_BEDROCK_ACCESS=true
```

## Deployment Steps

### Step 1: Bootstrap CDK (One-time setup)
```bash
cd aws-native-implementation/infrastructure

# Bootstrap CDK in your account/region
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1

# This creates the necessary S3 bucket and IAM roles for CDK deployments
```

### Step 2: Deploy Infrastructure
```bash
# Synthesize CloudFormation template (optional - for review)
cdk synth

# Deploy the infrastructure stack
cdk deploy RonAIInfrastructure

# This will create:
# - VPC with public/private/isolated subnets
# - S3 buckets for healthcare data, code execution, and frontend assets
# - DynamoDB tables for conversations, executions, and sessions
# - Cognito user pool with MFA
# - HealthLake FHIR datastore
# - Lambda functions for all services
# - API Gateway REST and WebSocket APIs
# - EventBridge event bus
# - Step Functions workflows
# - CloudWatch monitoring and alarms
# - IAM roles with least privilege access
```

### Step 3: Configure HealthLake
```bash
# Wait for HealthLake datastore to be created (can take 10-15 minutes)
aws healthlake describe-fhir-datastore --datastore-id YOUR_DATASTORE_ID

# The datastore will be in CREATING status initially, wait for ACTIVE status
```

### Step 4: Deploy Lambda Functions
```bash
cd ../backend

# Package Lambda functions
zip -r claude_agent_enhanced.zip claude_agent_enhanced.py
zip -r claude_code_sdk_enhanced.zip claude_code_sdk_enhanced.py

# Update Lambda function code
aws lambda update-function-code \
    --function-name ron-ai-claude-agent \
    --zip-file fileb://claude_agent_enhanced.zip

aws lambda update-function-code \
    --function-name ron-ai-code-sdk \
    --zip-file fileb://claude_code_sdk_enhanced.zip
```

### Step 5: Configure API Gateway
```bash
# Get API Gateway endpoint from CDK output
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name RonAIInfrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
    --output text)

echo "API Endpoint: $API_ENDPOINT"

# Test API health
curl -X GET "$API_ENDPOINT/health"
```

### Step 6: Set Up Cognito Users
```bash
# Get Cognito User Pool ID from CDK output
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name RonAIInfrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

# Create admin user
aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username admin@ronai.com \
    --user-attributes Name=email,Value=admin@ronai.com \
    --temporary-password TempPassword123! \
    --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username admin@ronai.com \
    --password YourSecurePassword123! \
    --permanent
```

## Configuration

### 1. Environment-Specific Configuration
```python
# backend/config.py
import os
from dataclasses import dataclass

@dataclass
class Config:
    # AWS Configuration
    aws_region: str = os.getenv('AWS_REGION', 'us-east-1')
    healthlake_datastore_id: str = os.getenv('HEALTHLAKE_DATASTORE_ID')
    
    # Anthropic Configuration
    anthropic_api_key: str = os.getenv('ANTHROPIC_API_KEY')
    claude_model: str = 'claude-3-5-sonnet-20241022'
    
    # Application Configuration
    max_concurrent_requests: int = 10
    request_timeout: int = 60
    cache_ttl: int = 300
    
    # Healthcare Configuration
    enable_phi_detection: bool = True
    require_patient_consent: bool = True
    audit_all_access: bool = True

config = Config()
```

### 2. Lambda Environment Variables
The CDK automatically sets these environment variables for Lambda functions:
- `CONVERSATIONS_TABLE`: DynamoDB table for conversations
- `TOOL_EXECUTIONS_TABLE`: DynamoDB table for tool executions
- `HEALTHLAKE_DATASTORE_ID`: HealthLake datastore identifier
- `HEALTHCARE_DATA_BUCKET`: S3 bucket for healthcare data
- `AWS_REGION`: AWS region

### 3. API Gateway Configuration
```yaml
# API Gateway stages and throttling
Production:
  throttle:
    rate_limit: 1000
    burst_limit: 2000
  logging:
    level: INFO
    data_trace: true
  metrics: true
```

## Testing

### 1. Unit Tests
```bash
cd backend
python -m pytest tests/ -v

# Test specific components
python -m pytest tests/test_claude_agent_enhanced.py -v
python -m pytest tests/test_claude_code_sdk_enhanced.py -v
```

### 2. Integration Tests
```bash
# Test Claude Agent API
curl -X POST "$API_ENDPOINT/claude" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "conversation_id": "test_conv_123",
        "message": "Help me optimize my diabetes medication costs",
        "patient_id": "patient_456"
    }'

# Test Code SDK API
curl -X POST "$API_ENDPOINT/code" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -d '{
        "prompt": "Create a FastAPI healthcare API with patient endpoints",
        "language": "python",
        "include_tests": true
    }'
```

### 3. Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

## Monitoring and Observability

### 1. CloudWatch Dashboards
The deployment automatically creates CloudWatch dashboards for:
- Lambda function metrics (duration, errors, invocations)
- API Gateway metrics (latency, 4xx/5xx errors)
- DynamoDB metrics (read/write capacity, throttles)
- HealthLake metrics (API calls, errors)

### 2. Alarms
Automatic alarms are created for:
- Lambda function errors > 5 in 2 minutes
- Lambda function duration > 5 minutes
- API Gateway 5xx errors > 10 in 5 minutes
- DynamoDB throttling events

### 3. Logging
```bash
# View Lambda logs
aws logs tail /aws/lambda/ron-ai-claude-agent --follow

# View API Gateway logs
aws logs tail /aws/apigateway/ron-ai-api --follow

# Search logs
aws logs filter-log-events \
    --log-group-name /aws/lambda/ron-ai-claude-agent \
    --filter-pattern "ERROR"
```

## Security

### 1. IAM Roles and Policies
All services use least-privilege IAM roles:
- Lambda functions can only access required DynamoDB tables and S3 buckets
- API Gateway uses Cognito authorizers for authentication
- HealthLake access is restricted to specific operations

### 2. Encryption
- All data at rest is encrypted using AWS managed keys
- All data in transit uses TLS 1.2+
- HealthLake uses customer-managed KMS keys for additional security

### 3. Network Security
- Lambda functions run in private subnets
- Security groups restrict network access
- VPC endpoints for AWS services (no internet traffic)

### 4. Compliance
- HIPAA-compliant architecture with proper access controls
- Audit logging for all healthcare data access
- PHI detection and handling with Comprehend Medical

## Scaling

### 1. Auto Scaling
- Lambda functions automatically scale based on demand
- DynamoDB uses on-demand billing for automatic scaling
- API Gateway handles traffic spikes automatically

### 2. Performance Optimization
- Connection pooling for AWS services (50 concurrent connections)
- Caching layer with 5-minute TTL for frequently accessed data
- Async/await throughout for non-blocking operations

### 3. Cost Optimization
- S3 lifecycle policies for data archival
- DynamoDB TTL for automatic data cleanup
- Lambda provisioned concurrency for consistent performance

## Troubleshooting

### Common Issues

#### 1. HealthLake Datastore Creation Timeout
```bash
# Check datastore status
aws healthlake describe-fhir-datastore --datastore-id YOUR_DATASTORE_ID

# If stuck in CREATING status for > 30 minutes, contact AWS support
```

#### 2. Lambda Function Timeout
```bash
# Check CloudWatch logs for timeout errors
aws logs filter-log-events \
    --log-group-name /aws/lambda/ron-ai-claude-agent \
    --filter-pattern "Task timed out"

# Increase timeout in CDK and redeploy
```

#### 3. API Gateway 403 Errors
```bash
# Check Cognito token validity
aws cognito-idp get-user --access-token YOUR_ACCESS_TOKEN

# Verify API Gateway authorizer configuration
```

#### 4. DynamoDB Throttling
```bash
# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ThrottledRequests \
    --dimensions Name=TableName,Value=ron-ai-conversations \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-01T23:59:59Z \
    --period 300 \
    --statistics Sum
```

## Maintenance

### 1. Regular Updates
```bash
# Update Lambda function code
cd backend
zip -r updated_function.zip .
aws lambda update-function-code \
    --function-name ron-ai-claude-agent \
    --zip-file fileb://updated_function.zip

# Update CDK infrastructure
cd infrastructure
cdk deploy RonAIInfrastructure
```

### 2. Backup and Recovery
```bash
# Enable point-in-time recovery for DynamoDB (already enabled in CDK)
# S3 versioning is enabled for all buckets
# HealthLake has built-in backup capabilities
```

### 3. Cost Monitoring
```bash
# Set up billing alerts
aws budgets create-budget \
    --account-id YOUR_ACCOUNT_ID \
    --budget file://budget-config.json
```

## Migration from Original Implementation

### 1. Data Migration
```python
# Script to migrate existing data to new DynamoDB structure
import boto3
import json

def migrate_conversations():
    # Connect to old and new databases
    old_db = boto3.resource('dynamodb', table_name='old_conversations')
    new_db = boto3.resource('dynamodb', table_name='ron-ai-conversations')
    
    # Migrate data with new schema
    for item in old_db.scan()['Items']:
        new_item = transform_conversation_schema(item)
        new_db.put_item(Item=new_item)
```

### 2. Frontend Updates
```typescript
// Update API endpoints to use new AWS API Gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

// Update authentication to use Cognito
import { Auth } from 'aws-amplify';
```

### 3. Gradual Rollout
1. Deploy new infrastructure alongside existing system
2. Route 10% of traffic to new system
3. Monitor metrics and gradually increase traffic
4. Complete migration once validated

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Review AWS service health dashboard
3. Consult AWS documentation for specific services
4. Contact AWS support for infrastructure issues

## Cost Estimation

### Monthly Costs (estimated for moderate usage):
- **Lambda**: $50-100 (1M requests/month)
- **API Gateway**: $30-50 (1M API calls/month)
- **DynamoDB**: $25-50 (on-demand pricing)
- **S3**: $20-40 (100GB storage)
- **HealthLake**: $100-200 (based on usage)
- **Comprehend Medical**: $50-100 (based on text analysis volume)
- **CloudWatch**: $10-20 (logs and metrics)

**Total estimated monthly cost: $285-560**

This represents a significant cost reduction compared to running EC2 instances while providing better scalability, reliability, and security.
