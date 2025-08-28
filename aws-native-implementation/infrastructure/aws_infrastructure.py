"""
AWS Infrastructure Setup for Enhanced Ron AI
Using AWS CDK for Infrastructure as Code

This creates a complete AWS healthcare-compliant infrastructure including:
1. HealthLake FHIR data store
2. Comprehend Medical integration
3. Bedrock model access
4. Lambda functions for serverless compute
5. API Gateway for REST/WebSocket APIs
6. DynamoDB for fast data access
7. S3 for file storage
8. EventBridge for event-driven architecture
9. CloudWatch for monitoring
10. VPC with proper security groups
11. IAM roles with least privilege
12. Cognito for authentication
"""

from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_logs as logs,
    aws_cognito as cognito,
    aws_ec2 as ec2,
    aws_healthlake as healthlake,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    CfnOutput
)
from constructs import Construct
import json

class RonAIInfrastructureStack(Stack):
    """
    Complete AWS infrastructure for Ron AI healthcare platform
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC for secure networking
        self.vpc = self._create_vpc()
        
        # Create S3 buckets
        self.buckets = self._create_s3_buckets()
        
        # Create DynamoDB tables
        self.tables = self._create_dynamodb_tables()
        
        # Create Cognito for authentication
        self.auth = self._create_cognito()
        
        # Create HealthLake data store
        self.healthlake = self._create_healthlake()
        
        # Create IAM roles
        self.roles = self._create_iam_roles()
        
        # Create Lambda functions
        self.lambdas = self._create_lambda_functions()
        
        # Create API Gateway
        self.api = self._create_api_gateway()
        
        # Create EventBridge
        self.eventbridge = self._create_eventbridge()
        
        # Create Step Functions for workflows
        self.workflows = self._create_step_functions()
        
        # Create CloudWatch dashboards
        self._create_monitoring()
        
        # Output important values
        self._create_outputs()
    
    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with proper security configuration"""
        
        vpc = ec2.Vpc(
            self, "RonAIVPC",
            max_azs=3,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )
        
        # Security group for Lambda functions
        self.lambda_sg = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )
        
        # Security group for HealthLake
        self.healthlake_sg = ec2.SecurityGroup(
            self, "HealthLakeSecurityGroup",
            vpc=vpc,
            description="Security group for HealthLake access"
        )
        
        return vpc
    
    def _create_s3_buckets(self) -> dict:
        """Create S3 buckets for different purposes"""
        
        buckets = {}
        
        # Healthcare data bucket (HIPAA compliant)
        buckets['healthcare_data'] = s3.Bucket(
            self, "HealthcareDataBucket",
            bucket_name=f"ron-ai-healthcare-data-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="ArchiveOldData",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Code execution bucket
        buckets['code_execution'] = s3.Bucket(
            self, "CodeExecutionBucket",
            bucket_name=f"ron-ai-code-execution-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="CleanupExecutions",
                    enabled=True,
                    expiration=Duration.days(30)
                )
            ]
        )
        
        # Frontend assets bucket
        buckets['frontend_assets'] = s3.Bucket(
            self, "FrontendAssetsBucket",
            bucket_name=f"ron-ai-frontend-assets-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            website_index_document="index.html"
        )
        
        return buckets
    
    def _create_dynamodb_tables(self) -> dict:
        """Create DynamoDB tables for application data"""
        
        tables = {}
        
        # Conversations table
        tables['conversations'] = dynamodb.Table(
            self, "ConversationsTable",
            table_name="ron-ai-conversations",
            partition_key=dynamodb.Attribute(
                name="conversation_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
            time_to_live_attribute="ttl"
        )
        
        # Tool executions table
        tables['tool_executions'] = dynamodb.Table(
            self, "ToolExecutionsTable",
            table_name="ron-ai-tool-executions",
            partition_key=dynamodb.Attribute(
                name="execution_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl"
        )
        
        # Add GSI for querying by conversation_id
        tables['tool_executions'].add_global_secondary_index(
            index_name="ConversationIndex",
            partition_key=dynamodb.Attribute(
                name="conversation_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        # Code executions table
        tables['code_executions'] = dynamodb.Table(
            self, "CodeExecutionsTable",
            table_name="ron-ai-code-executions",
            partition_key=dynamodb.Attribute(
                name="execution_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl"
        )
        
        # Patient sessions table
        tables['patient_sessions'] = dynamodb.Table(
            self, "PatientSessionsTable",
            table_name="ron-ai-patient-sessions",
            partition_key=dynamodb.Attribute(
                name="patient_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="session_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl"
        )
        
        return tables
    
    def _create_cognito(self) -> dict:
        """Create Cognito user pool for authentication"""
        
        # User pool
        user_pool = cognito.UserPool(
            self, "RonAIUserPool",
            user_pool_name="ron-ai-users",
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=12,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True
            ),
            mfa=cognito.Mfa.REQUIRED,
            mfa_second_factor=cognito.MfaSecondFactor(
                sms=True,
                otp=True
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # User pool client
        user_pool_client = cognito.UserPoolClient(
            self, "RonAIUserPoolClient",
            user_pool=user_pool,
            user_pool_client_name="ron-ai-client",
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    authorization_code_grant=True,
                    implicit_code_grant=True
                ),
                scopes=[
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE
                ]
            )
        )
        
        # Identity pool
        identity_pool = cognito.CfnIdentityPool(
            self, "RonAIIdentityPool",
            identity_pool_name="ron-ai-identity-pool",
            allow_unauthenticated_identities=False,
            cognito_identity_providers=[
                cognito.CfnIdentityPool.CognitoIdentityProviderProperty(
                    client_id=user_pool_client.user_pool_client_id,
                    provider_name=user_pool.user_pool_provider_name
                )
            ]
        )
        
        return {
            'user_pool': user_pool,
            'user_pool_client': user_pool_client,
            'identity_pool': identity_pool
        }
    
    def _create_healthlake(self) -> healthlake.CfnFHIRDatastore:
        """Create HealthLake FHIR data store"""
        
        datastore = healthlake.CfnFHIRDatastore(
            self, "RonAIHealthLakeDatastore",
            datastore_name="ron-ai-fhir-datastore",
            datastore_type_version="R4",
            preload_data_config=healthlake.CfnFHIRDatastore.PreloadDataConfigProperty(
                preload_data_type="SYNTHEA"
            ),
            sse_configuration=healthlake.CfnFHIRDatastore.SseConfigurationProperty(
                kms_encryption_config=healthlake.CfnFHIRDatastore.KmsEncryptionConfigProperty(
                    cmk_type="AWS_OWNED_KMS_KEY"
                )
            )
        )
        
        return datastore
    
    def _create_iam_roles(self) -> dict:
        """Create IAM roles with least privilege"""
        
        roles = {}
        
        # Lambda execution role
        roles['lambda_execution'] = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ],
            inline_policies={
                "HealthcareAccess": iam.PolicyDocument(
                    statements=[
                        # DynamoDB access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            resources=[
                                table.table_arn for table in self.tables.values()
                            ] + [
                                f"{table.table_arn}/index/*" for table in self.tables.values()
                            ]
                        ),
                        # S3 access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                bucket.bucket_arn for bucket in self.buckets.values()
                            ] + [
                                f"{bucket.bucket_arn}/*" for bucket in self.buckets.values()
                            ]
                        ),
                        # HealthLake access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "healthlake:ReadResource",
                                "healthlake:CreateResource",
                                "healthlake:UpdateResource",
                                "healthlake:DeleteResource",
                                "healthlake:SearchWithGet",
                                "healthlake:SearchWithPost"
                            ],
                            resources=[self.healthlake.attr_datastore_arn]
                        ),
                        # Comprehend Medical access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "comprehendmedical:DetectEntitiesV2",
                                "comprehendmedical:DetectPHI",
                                "comprehendmedical:InferICD10CM",
                                "comprehendmedical:InferRxNorm",
                                "comprehendmedical:InferSNOMEDCT"
                            ],
                            resources=["*"]
                        ),
                        # Bedrock access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "bedrock:InvokeModel",
                                "bedrock:InvokeModelWithResponseStream"
                            ],
                            resources=["*"]
                        ),
                        # EventBridge access
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "events:PutEvents"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            }
        )
        
        # API Gateway execution role
        roles['api_gateway'] = iam.Role(
            self, "APIGatewayRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ]
        )
        
        return roles
    
    def _create_lambda_functions(self) -> dict:
        """Create Lambda functions for different services"""
        
        functions = {}
        
        # Claude Agent Lambda
        functions['claude_agent'] = _lambda.Function(
            self, "ClaudeAgentFunction",
            function_name="ron-ai-claude-agent",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="claude_agent_enhanced.lambda_handler",
            code=_lambda.Code.from_asset("../backend"),
            timeout=Duration.minutes(15),
            memory_size=1024,
            role=self.roles['lambda_execution'],
            vpc=self.vpc,
            security_groups=[self.lambda_sg],
            environment={
                "CONVERSATIONS_TABLE": self.tables['conversations'].table_name,
                "TOOL_EXECUTIONS_TABLE": self.tables['tool_executions'].table_name,
                "HEALTHLAKE_DATASTORE_ID": self.healthlake.attr_datastore_id,
                "HEALTHCARE_DATA_BUCKET": self.buckets['healthcare_data'].bucket_name,
                "AWS_REGION": self.region
            },
            layers=[
                _lambda.LayerVersion.from_layer_version_arn(
                    self, "AnthropicLayer",
                    # Use pre-built layer with anthropic SDK
                    layer_version_arn=f"arn:aws:lambda:{self.region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:59"
                )
            ]
        )
        
        # Code SDK Lambda
        functions['code_sdk'] = _lambda.Function(
            self, "CodeSDKFunction",
            function_name="ron-ai-code-sdk",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="claude_code_sdk_enhanced.lambda_handler",
            code=_lambda.Code.from_asset("../backend"),
            timeout=Duration.minutes(15),
            memory_size=2048,
            role=self.roles['lambda_execution'],
            vpc=self.vpc,
            security_groups=[self.lambda_sg],
            environment={
                "CODE_EXECUTIONS_TABLE": self.tables['code_executions'].table_name,
                "CODE_EXECUTION_BUCKET": self.buckets['code_execution'].bucket_name,
                "AWS_REGION": self.region
            }
        )
        
        # Healthcare Tools Lambda
        functions['healthcare_tools'] = _lambda.Function(
            self, "HealthcareToolsFunction",
            function_name="ron-ai-healthcare-tools",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="healthcare_tools.lambda_handler",
            code=_lambda.Code.from_asset("../backend"),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=self.roles['lambda_execution'],
            vpc=self.vpc,
            security_groups=[self.lambda_sg],
            environment={
                "HEALTHLAKE_DATASTORE_ID": self.healthlake.attr_datastore_id,
                "HEALTHCARE_DATA_BUCKET": self.buckets['healthcare_data'].bucket_name
            }
        )
        
        # WebSocket connection handler
        functions['websocket_handler'] = _lambda.Function(
            self, "WebSocketHandlerFunction",
            function_name="ron-ai-websocket-handler",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="websocket_handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend"),
            timeout=Duration.minutes(1),
            memory_size=256,
            role=self.roles['lambda_execution'],
            environment={
                "CONVERSATIONS_TABLE": self.tables['conversations'].table_name
            }
        )
        
        return functions
    
    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with REST and WebSocket APIs"""
        
        # REST API
        api = apigateway.RestApi(
            self, "RonAIAPI",
            rest_api_name="ron-ai-api",
            description="Ron AI Healthcare Platform API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # Cognito authorizer
        authorizer = apigateway.CognitoUserPoolsAuthorizer(
            self, "APIAuthorizer",
            cognito_user_pools=[self.auth['user_pool']]
        )
        
        # Claude Agent endpoints
        claude_resource = api.root.add_resource("claude")
        claude_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(self.lambdas['claude_agent']),
            authorizer=authorizer
        )
        
        # Code SDK endpoints
        code_resource = api.root.add_resource("code")
        code_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(self.lambdas['code_sdk']),
            authorizer=authorizer
        )
        
        # Healthcare tools endpoints
        tools_resource = api.root.add_resource("tools")
        tools_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(self.lambdas['healthcare_tools']),
            authorizer=authorizer
        )
        
        # WebSocket API
        websocket_api = apigateway.WebSocketApi(
            self, "RonAIWebSocketAPI",
            api_name="ron-ai-websocket",
            description="Ron AI WebSocket API for real-time communication"
        )
        
        # WebSocket routes
        websocket_api.add_route(
            "$connect",
            integration=apigateway.WebSocketLambdaIntegration(
                "ConnectIntegration",
                self.lambdas['websocket_handler']
            )
        )
        
        websocket_api.add_route(
            "$disconnect",
            integration=apigateway.WebSocketLambdaIntegration(
                "DisconnectIntegration", 
                self.lambdas['websocket_handler']
            )
        )
        
        websocket_api.add_route(
            "message",
            integration=apigateway.WebSocketLambdaIntegration(
                "MessageIntegration",
                self.lambdas['claude_agent']
            )
        )
        
        return api
    
    def _create_eventbridge(self) -> events.EventBus:
        """Create EventBridge for event-driven architecture"""
        
        # Custom event bus
        event_bus = events.EventBus(
            self, "RonAIEventBus",
            event_bus_name="ron-ai-events"
        )
        
        # Rules for different event types
        
        # Tool execution events
        tool_execution_rule = events.Rule(
            self, "ToolExecutionRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["ron-ai.claude-agent"],
                detail_type=["Tool Execution Complete"]
            )
        )
        
        # Code execution events
        code_execution_rule = events.Rule(
            self, "CodeExecutionRule",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["ron-ai.code-sdk"],
                detail_type=["Code Execution Request"]
            )
        )
        
        # Add targets (could be Lambda, SNS, SQS, etc.)
        code_execution_rule.add_target(
            targets.LambdaFunction(self.lambdas['code_sdk'])
        )
        
        return event_bus
    
    def _create_step_functions(self) -> dict:
        """Create Step Functions for complex workflows"""
        
        workflows = {}
        
        # Healthcare workflow
        healthcare_workflow = sfn.StateMachine(
            self, "HealthcareWorkflow",
            state_machine_name="ron-ai-healthcare-workflow",
            definition=sfn.Chain.start(
                tasks.LambdaInvoke(
                    self, "ExtractEntities",
                    lambda_function=self.lambdas['healthcare_tools'],
                    payload=sfn.TaskInput.from_object({
                        "action": "extract_entities",
                        "input.$": "$"
                    })
                )
            ).next(
                tasks.LambdaInvoke(
                    self, "AnalyzeCost",
                    lambda_function=self.lambdas['healthcare_tools'],
                    payload=sfn.TaskInput.from_object({
                        "action": "analyze_cost",
                        "input.$": "$"
                    })
                )
            ).next(
                tasks.LambdaInvoke(
                    self, "GenerateRecommendations",
                    lambda_function=self.lambdas['claude_agent'],
                    payload=sfn.TaskInput.from_object({
                        "action": "generate_recommendations",
                        "input.$": "$"
                    })
                )
            ),
            timeout=Duration.minutes(30)
        )
        
        workflows['healthcare'] = healthcare_workflow
        
        return workflows
    
    def _create_monitoring(self):
        """Create CloudWatch dashboards and alarms"""
        
        # CloudWatch dashboard
        dashboard = logs.LogGroup(
            self, "RonAIDashboard",
            log_group_name="/aws/lambda/ron-ai",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Alarms for Lambda functions
        for name, function in self.lambdas.items():
            # Error rate alarm
            function.metric_errors().create_alarm(
                self, f"{name}ErrorAlarm",
                alarm_name=f"ron-ai-{name}-errors",
                threshold=5,
                evaluation_periods=2
            )
            
            # Duration alarm
            function.metric_duration().create_alarm(
                self, f"{name}DurationAlarm", 
                alarm_name=f"ron-ai-{name}-duration",
                threshold=Duration.minutes(5).to_milliseconds(),
                evaluation_periods=2
            )
    
    def _create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "APIEndpoint",
            value=self.api.url,
            description="REST API endpoint"
        )
        
        CfnOutput(
            self, "UserPoolId",
            value=self.auth['user_pool'].user_pool_id,
            description="Cognito User Pool ID"
        )
        
        CfnOutput(
            self, "UserPoolClientId",
            value=self.auth['user_pool_client'].user_pool_client_id,
            description="Cognito User Pool Client ID"
        )
        
        CfnOutput(
            self, "HealthLakeDatastoreId",
            value=self.healthlake.attr_datastore_id,
            description="HealthLake Datastore ID"
        )
        
        CfnOutput(
            self, "HealthcareDataBucket",
            value=self.buckets['healthcare_data'].bucket_name,
            description="Healthcare Data S3 Bucket"
        )


# CDK App
from aws_cdk import App

app = App()
RonAIInfrastructureStack(app, "RonAIInfrastructure")
app.synth()
