#!/bin/bash

# Ron AI Healthcare Copilot - Monitoring and Maintenance Script
set -e

echo "📊 Ron AI Healthcare Copilot - System Monitor"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        print_status "OK" "$service_name is healthy"
        return 0
    else
        print_status "ERROR" "$service_name is not responding"
        return 1
    fi
}

# Function to check system resources
check_system_resources() {
    print_status "INFO" "System Resource Usage:"
    
    # CPU Usage
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        print_status "WARNING" "High CPU usage: ${cpu_usage}%"
    else
        print_status "OK" "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory Usage
    memory_info=$(vm_stat | grep -E "(free|inactive|active|wired)")
    free_pages=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    inactive_pages=$(echo "$memory_info" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
    active_pages=$(echo "$memory_info" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    wired_pages=$(echo "$memory_info" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
    
    page_size=4096
    total_memory=$(((free_pages + inactive_pages + active_pages + wired_pages) * page_size / 1024 / 1024))
    used_memory=$(((active_pages + wired_pages) * page_size / 1024 / 1024))
    memory_percent=$((used_memory * 100 / total_memory))
    
    if [ $memory_percent -gt 85 ]; then
        print_status "WARNING" "High memory usage: ${memory_percent}% (${used_memory}MB/${total_memory}MB)"
    else
        print_status "OK" "Memory usage: ${memory_percent}% (${used_memory}MB/${total_memory}MB)"
    fi
    
    # Disk Usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt 85 ]; then
        print_status "WARNING" "High disk usage: ${disk_usage}%"
    else
        print_status "OK" "Disk usage: ${disk_usage}%"
    fi
}

# Function to check Docker containers (if using Docker)
check_docker_containers() {
    if command -v docker &> /dev/null; then
        print_status "INFO" "Docker Container Status:"
        
        # Check if docker-compose is being used
        if [ -f "docker-compose.yml" ]; then
            if command -v docker-compose &> /dev/null; then
                DOCKER_COMPOSE_CMD="docker-compose"
            else
                DOCKER_COMPOSE_CMD="docker compose"
            fi
            
            # Get container status
            containers=$($DOCKER_COMPOSE_CMD ps --format json 2>/dev/null || echo "[]")
            
            if [ "$containers" != "[]" ]; then
                echo "$containers" | jq -r '.[] | "\(.Name): \(.State)"' 2>/dev/null || echo "Unable to parse container status"
            else
                print_status "WARNING" "No Docker containers found or docker-compose not running"
            fi
        else
            # Check regular Docker containers
            running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v "NAMES" || echo "")
            if [ -n "$running_containers" ]; then
                echo "$running_containers"
            else
                print_status "WARNING" "No running Docker containers found"
            fi
        fi
    else
        print_status "INFO" "Docker not installed or not in PATH"
    fi
}

# Function to check process status
check_processes() {
    print_status "INFO" "Process Status:"
    
    # Check for Python processes (backend)
    python_processes=$(pgrep -f "python.*api.py" || echo "")
    if [ -n "$python_processes" ]; then
        print_status "OK" "Backend Python process running (PID: $python_processes)"
    else
        print_status "WARNING" "Backend Python process not found"
    fi
    
    # Check for Node.js processes (frontend)
    node_processes=$(pgrep -f "node.*next" || echo "")
    if [ -n "$node_processes" ]; then
        print_status "OK" "Frontend Node.js process running (PID: $node_processes)"
    else
        print_status "WARNING" "Frontend Node.js process not found"
    fi
    
    # Check for PM2 processes
    if command -v pm2 &> /dev/null; then
        pm2_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | "\(.name): \(.pm2_env.status)"' 2>/dev/null || echo "")
        if [ -n "$pm2_status" ]; then
            print_status "INFO" "PM2 Process Status:"
            echo "$pm2_status"
        fi
    fi
}

# Function to check log files
check_logs() {
    print_status "INFO" "Recent Log Analysis:"
    
    # Check backend logs
    if [ -f "backend/api.log" ]; then
        error_count=$(tail -100 backend/api.log | grep -i error | wc -l)
        if [ $error_count -gt 0 ]; then
            print_status "WARNING" "Found $error_count errors in backend logs (last 100 lines)"
        else
            print_status "OK" "No recent errors in backend logs"
        fi
    fi
    
    # Check system logs for the application
    if command -v journalctl &> /dev/null; then
        recent_errors=$(journalctl -u ron-ai --since "1 hour ago" --no-pager -q | grep -i error | wc -l 2>/dev/null || echo "0")
        if [ $recent_errors -gt 0 ]; then
            print_status "WARNING" "Found $recent_errors errors in system logs (last hour)"
        else
            print_status "OK" "No recent errors in system logs"
        fi
    fi
}

# Function to check network connectivity
check_network() {
    print_status "INFO" "Network Connectivity:"
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_status "OK" "Internet connectivity available"
    else
        print_status "ERROR" "No internet connectivity"
    fi
    
    # Check API endpoints
    if curl -f -s --max-time 5 "https://api.anthropic.com" > /dev/null 2>&1; then
        print_status "OK" "Anthropic API reachable"
    else
        print_status "WARNING" "Anthropic API not reachable"
    fi
}

# Function to perform maintenance tasks
perform_maintenance() {
    print_status "INFO" "Performing maintenance tasks..."
    
    # Clean up old log files
    find . -name "*.log" -type f -mtime +7 -exec rm {} \; 2>/dev/null || true
    print_status "OK" "Cleaned up old log files"
    
    # Clean up temporary files
    find /tmp -name "ron-ai-*" -type f -mtime +1 -exec rm {} \; 2>/dev/null || true
    print_status "OK" "Cleaned up temporary files"
    
    # Update package lists (if running as root)
    if [ "$EUID" -eq 0 ]; then
        if command -v apt-get &> /dev/null; then
            apt-get update -qq
            print_status "OK" "Updated package lists"
        elif command -v yum &> /dev/null; then
            yum check-update -q
            print_status "OK" "Updated package lists"
        fi
    fi
}

# Function to generate health report
generate_health_report() {
    local report_file="health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Ron AI Healthcare Copilot - Health Report"
        echo "========================================"
        echo "Generated: $(date)"
        echo ""
        
        echo "System Information:"
        echo "- OS: $(uname -s) $(uname -r)"
        echo "- Hostname: $(hostname)"
        echo "- Uptime: $(uptime)"
        echo ""
        
        echo "Service Status:"
        check_service_health "Backend" "http://localhost:8000/health" 5 2>&1
        check_service_health "Frontend" "http://localhost:3000" 5 2>&1
        echo ""
        
        echo "Resource Usage:"
        check_system_resources 2>&1
        echo ""
        
        echo "Process Status:"
        check_processes 2>&1
        echo ""
        
        echo "Network Status:"
        check_network 2>&1
        
    } > "$report_file"
    
    print_status "OK" "Health report generated: $report_file"
}

# Main execution
main() {
    case "${1:-status}" in
        "status"|"")
            echo ""
            check_service_health "Backend API" "http://localhost:8000/health"
            check_service_health "Frontend" "http://localhost:3000"
            echo ""
            check_system_resources
            echo ""
            check_processes
            echo ""
            check_docker_containers
            ;;
        "health")
            check_service_health "Backend API" "http://localhost:8000/health"
            check_service_health "Frontend" "http://localhost:3000"
            ;;
        "resources")
            check_system_resources
            ;;
        "processes")
            check_processes
            ;;
        "logs")
            check_logs
            ;;
        "network")
            check_network
            ;;
        "maintenance")
            perform_maintenance
            ;;
        "report")
            generate_health_report
            ;;
        "full")
            echo ""
            check_service_health "Backend API" "http://localhost:8000/health"
            check_service_health "Frontend" "http://localhost:3000"
            echo ""
            check_system_resources
            echo ""
            check_processes
            echo ""
            check_docker_containers
            echo ""
            check_logs
            echo ""
            check_network
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  status      - Check service status and basic system info (default)"
            echo "  health      - Check service health only"
            echo "  resources   - Check system resource usage"
            echo "  processes   - Check running processes"
            echo "  logs        - Analyze log files"
            echo "  network     - Check network connectivity"
            echo "  maintenance - Perform maintenance tasks"
            echo "  report      - Generate comprehensive health report"
            echo "  full        - Run all checks"
            echo "  help        - Show this help message"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
