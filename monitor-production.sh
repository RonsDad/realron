#!/bin/bash

# Ron AI Healthcare Copilot - Production Monitoring Script
set -e

REGION="us-west-2"
ASG_NAME="ron-ai-production-asg"
ALB_NAME="ron-ai-alb"
TARGET_GROUP_NAME="ron-ai-targets"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}$1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

check_infrastructure() {
    print_header "🏗️  Infrastructure Status"
    
    # Check Auto Scaling Group
    ASG_STATUS=$(aws autoscaling describe-auto-scaling-groups \
        --auto-scaling-group-names $ASG_NAME \
        --region $REGION \
        --query 'AutoScalingGroups[0]' 2>/dev/null || echo "null")
    
    if [ "$ASG_STATUS" != "null" ]; then
        DESIRED=$(echo $ASG_STATUS | jq -r '.DesiredCapacity')
        RUNNING=$(echo $ASG_STATUS | jq -r '.Instances | map(select(.LifecycleState == "InService")) | length')
        MIN_SIZE=$(echo $ASG_STATUS | jq -r '.MinSize')
        MAX_SIZE=$(echo $ASG_STATUS | jq -r '.MaxSize')
        
        print_status "INFO" "Auto Scaling Group: $RUNNING/$DESIRED instances running (Min: $MIN_SIZE, Max: $MAX_SIZE)"
        
        if [ $RUNNING -eq $DESIRED ]; then
            print_status "OK" "All desired instances are running"
        else
            print_status "WARNING" "Instance count mismatch - some instances may be starting/stopping"
        fi
    else
        print_status "ERROR" "Auto Scaling Group not found"
        return 1
    fi
    
    # Check Load Balancer
    ALB_STATUS=$(aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --region $REGION \
        --query 'LoadBalancers[0]' 2>/dev/null || echo "null")
    
    if [ "$ALB_STATUS" != "null" ]; then
        ALB_STATE=$(echo $ALB_STATUS | jq -r '.State.Code')
        ALB_DNS=$(echo $ALB_STATUS | jq -r '.DNSName')
        
        if [ "$ALB_STATE" = "active" ]; then
            print_status "OK" "Load Balancer is active: $ALB_DNS"
        else
            print_status "WARNING" "Load Balancer state: $ALB_STATE"
        fi
    else
        print_status "ERROR" "Load Balancer not found"
    fi
    
    # Check Target Group Health
    TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
        --names $TARGET_GROUP_NAME \
        --region $REGION \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$TARGET_GROUP_ARN" ]; then
        HEALTHY_TARGETS=$(aws elbv2 describe-target-health \
            --target-group-arn $TARGET_GROUP_ARN \
            --region $REGION \
            --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`] | length(@)' \
            --output text)
        
        TOTAL_TARGETS=$(aws elbv2 describe-target-health \
            --target-group-arn $TARGET_GROUP_ARN \
            --region $REGION \
            --query 'TargetHealthDescriptions | length(@)' \
            --output text)
        
        print_status "INFO" "Target Health: $HEALTHY_TARGETS/$TOTAL_TARGETS targets healthy"
        
        if [ $HEALTHY_TARGETS -eq $TOTAL_TARGETS ] && [ $HEALTHY_TARGETS -gt 0 ]; then
            print_status "OK" "All targets are healthy"
        elif [ $HEALTHY_TARGETS -gt 0 ]; then
            print_status "WARNING" "Some targets are unhealthy"
        else
            print_status "ERROR" "No healthy targets"
        fi
    fi
}

check_application_health() {
    print_header "🏥 Application Health"
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --region $REGION \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ALB_DNS" ]; then
        # Test health endpoint
        if curl -f -s --max-time 10 "http://$ALB_DNS/health" > /dev/null; then
            print_status "OK" "Health endpoint responding"
        else
            print_status "ERROR" "Health endpoint not responding"
        fi
        
        # Test frontend
        if curl -f -s --max-time 10 "http://$ALB_DNS" > /dev/null; then
            print_status "OK" "Frontend accessible"
        else
            print_status "ERROR" "Frontend not accessible"
        fi
        
        # Test backend API
        if curl -f -s --max-time 10 "http://$ALB_DNS/api/health" > /dev/null; then
            print_status "OK" "Backend API responding"
        else
            print_status "WARNING" "Backend API not responding (may be normal if endpoint doesn't exist)"
        fi
    else
        print_status "ERROR" "Cannot determine ALB DNS name"
    fi
}

check_instance_health() {
    print_header "💻 Instance Health"
    
    # Get instance IDs from ASG
    INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
        --auto-scaling-group-names $ASG_NAME \
        --region $REGION \
        --query 'AutoScalingGroups[0].Instances[?LifecycleState==`InService`].InstanceId' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$INSTANCE_IDS" ]; then
        for INSTANCE_ID in $INSTANCE_IDS; do
            # Get instance details
            INSTANCE_INFO=$(aws ec2 describe-instances \
                --instance-ids $INSTANCE_ID \
                --region $REGION \
                --query 'Reservations[0].Instances[0]' 2>/dev/null)
            
            if [ "$INSTANCE_INFO" != "null" ]; then
                INSTANCE_STATE=$(echo $INSTANCE_INFO | jq -r '.State.Name')
                INSTANCE_TYPE=$(echo $INSTANCE_INFO | jq -r '.InstanceType')
                INSTANCE_AZ=$(echo $INSTANCE_INFO | jq -r '.Placement.AvailabilityZone')
                LAUNCH_TIME=$(echo $INSTANCE_INFO | jq -r '.LaunchTime')
                
                print_status "INFO" "Instance $INSTANCE_ID ($INSTANCE_TYPE) in $INSTANCE_AZ"
                
                if [ "$INSTANCE_STATE" = "running" ]; then
                    print_status "OK" "  State: $INSTANCE_STATE (launched: $LAUNCH_TIME)"
                else
                    print_status "WARNING" "  State: $INSTANCE_STATE"
                fi
                
                # Check instance status
                STATUS_CHECK=$(aws ec2 describe-instance-status \
                    --instance-ids $INSTANCE_ID \
                    --region $REGION \
                    --query 'InstanceStatuses[0]' 2>/dev/null || echo "null")
                
                if [ "$STATUS_CHECK" != "null" ]; then
                    SYSTEM_STATUS=$(echo $STATUS_CHECK | jq -r '.SystemStatus.Status // "unknown"')
                    INSTANCE_STATUS=$(echo $STATUS_CHECK | jq -r '.InstanceStatus.Status // "unknown"')
                    
                    if [ "$SYSTEM_STATUS" = "ok" ] && [ "$INSTANCE_STATUS" = "ok" ]; then
                        print_status "OK" "  Status checks: System=$SYSTEM_STATUS, Instance=$INSTANCE_STATUS"
                    else
                        print_status "WARNING" "  Status checks: System=$SYSTEM_STATUS, Instance=$INSTANCE_STATUS"
                    fi
                fi
            fi
        done
    else
        print_status "WARNING" "No running instances found in Auto Scaling Group"
    fi
}

check_cloudwatch_metrics() {
    print_header "📊 CloudWatch Metrics (Last 5 minutes)"
    
    END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S")
    START_TIME=$(date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%S")
    
    # CPU Utilization
    CPU_METRICS=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/EC2 \
        --metric-name CPUUtilization \
        --dimensions Name=AutoScalingGroupName,Value=$ASG_NAME \
        --statistics Average \
        --start-time $START_TIME \
        --end-time $END_TIME \
        --period 300 \
        --region $REGION \
        --query 'Datapoints[0].Average' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$CPU_METRICS" ] && [ "$CPU_METRICS" != "None" ]; then
        CPU_PERCENT=$(printf "%.1f" $CPU_METRICS)
        if (( $(echo "$CPU_METRICS < 70" | bc -l) )); then
            print_status "OK" "Average CPU Utilization: ${CPU_PERCENT}%"
        elif (( $(echo "$CPU_METRICS < 85" | bc -l) )); then
            print_status "WARNING" "Average CPU Utilization: ${CPU_PERCENT}%"
        else
            print_status "ERROR" "High CPU Utilization: ${CPU_PERCENT}%"
        fi
    else
        print_status "INFO" "CPU metrics not available yet"
    fi
    
    # ALB Request Count
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --region $REGION \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ALB_ARN" ]; then
        REQUEST_COUNT=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/ApplicationELB \
            --metric-name RequestCount \
            --dimensions Name=LoadBalancer,Value=$(basename $ALB_ARN) \
            --statistics Sum \
            --start-time $START_TIME \
            --end-time $END_TIME \
            --period 300 \
            --region $REGION \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$REQUEST_COUNT" ] && [ "$REQUEST_COUNT" != "None" ]; then
            print_status "INFO" "Request Count (5 min): $REQUEST_COUNT"
        fi
        
        # Response Time
        RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/ApplicationELB \
            --metric-name TargetResponseTime \
            --dimensions Name=LoadBalancer,Value=$(basename $ALB_ARN) \
            --statistics Average \
            --start-time $START_TIME \
            --end-time $END_TIME \
            --period 300 \
            --region $REGION \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$RESPONSE_TIME" ] && [ "$RESPONSE_TIME" != "None" ]; then
            RESPONSE_MS=$(printf "%.0f" $(echo "$RESPONSE_TIME * 1000" | bc -l))
            if [ $RESPONSE_MS -lt 1000 ]; then
                print_status "OK" "Average Response Time: ${RESPONSE_MS}ms"
            elif [ $RESPONSE_MS -lt 3000 ]; then
                print_status "WARNING" "Average Response Time: ${RESPONSE_MS}ms"
            else
                print_status "ERROR" "High Response Time: ${RESPONSE_MS}ms"
            fi
        fi
    fi
}

show_scaling_activity() {
    print_header "📈 Recent Scaling Activity"
    
    ACTIVITIES=$(aws autoscaling describe-scaling-activities \
        --auto-scaling-group-name $ASG_NAME \
        --max-items 5 \
        --region $REGION \
        --query 'Activities[*].[StartTime,ActivityId,Description,StatusCode]' \
        --output table 2>/dev/null || echo "")
    
    if [ -n "$ACTIVITIES" ]; then
        echo "$ACTIVITIES"
    else
        print_status "INFO" "No recent scaling activities"
    fi
}

show_recent_logs() {
    print_header "📝 Recent CloudWatch Logs"
    
    # Check if log group exists
    LOG_GROUP="ron-ai-production"
    if aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION --query 'logGroups[0]' --output text &>/dev/null; then
        print_status "INFO" "Recent log entries from $LOG_GROUP:"
        
        # Get recent log events
        aws logs filter-log-events \
            --log-group-name $LOG_GROUP \
            --start-time $(date -d '1 hour ago' +%s)000 \
            --region $REGION \
            --query 'events[-10:].[timestamp,message]' \
            --output table 2>/dev/null || print_status "WARNING" "Unable to fetch log events"
    else
        print_status "INFO" "CloudWatch log group not found - logs may not be configured yet"
    fi
}

generate_production_report() {
    local report_file="production_health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Ron AI Healthcare Copilot - Production Health Report"
        echo "=================================================="
        echo "Generated: $(date)"
        echo "Region: $REGION"
        echo ""
        
        check_infrastructure 2>&1
        echo ""
        check_application_health 2>&1
        echo ""
        check_instance_health 2>&1
        echo ""
        check_cloudwatch_metrics 2>&1
        echo ""
        show_scaling_activity 2>&1
        
    } > "$report_file"
    
    print_status "OK" "Production health report generated: $report_file"
}

# Main execution
main() {
    echo -e "${CYAN}🏥 Ron AI Healthcare Copilot - Production Monitor${NC}"
    echo "=================================================="
    echo ""
    
    case "${1:-status}" in
        "status"|"")
            check_infrastructure
            echo ""
            check_application_health
            echo ""
            check_instance_health
            ;;
        "infrastructure")
            check_infrastructure
            ;;
        "health")
            check_application_health
            ;;
        "instances")
            check_instance_health
            ;;
        "metrics")
            check_cloudwatch_metrics
            ;;
        "scaling")
            show_scaling_activity
            ;;
        "logs")
            show_recent_logs
            ;;
        "report")
            generate_production_report
            ;;
        "full")
            check_infrastructure
            echo ""
            check_application_health
            echo ""
            check_instance_health
            echo ""
            check_cloudwatch_metrics
            echo ""
            show_scaling_activity
            echo ""
            show_recent_logs
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  status         - Check infrastructure and application status (default)"
            echo "  infrastructure - Check AWS infrastructure only"
            echo "  health         - Check application health only"
            echo "  instances      - Check EC2 instance status"
            echo "  metrics        - Show CloudWatch metrics"
            echo "  scaling        - Show recent scaling activities"
            echo "  logs           - Show recent CloudWatch logs"
            echo "  report         - Generate comprehensive health report"
            echo "  full           - Run all checks"
            echo "  help           - Show this help message"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    print_status "ERROR" "AWS CLI is required but not installed"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_status "ERROR" "jq is required but not installed. Please install jq for JSON parsing."
    exit 1
fi

# Run main function with all arguments
main "$@"
