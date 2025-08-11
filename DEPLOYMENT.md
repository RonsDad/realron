# Ron AI Healthcare Copilot - Deployment Guide

This guide provides comprehensive instructions for deploying your Ron AI Healthcare Copilot on various hardware platforms and cloud providers.

## 🚀 Quick Start

Choose your preferred deployment method:

1. **Docker (Recommended for local/VPS)** - `./deploy-docker.sh`
2. **AWS EC2** - `./deploy-aws.sh`
3. **Google Cloud Platform** - `./deploy-gcp.sh`

## 📋 Prerequisites

### Common Requirements
- Your `.env` file configured with all API keys
- Internet connection for downloading dependencies
- At least 4GB RAM and 2 CPU cores recommended

### Platform-Specific Requirements

#### Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM recommended

#### AWS Deployment
- AWS CLI configured with appropriate permissions
- EC2, VPC, and Security Group permissions
- Key pair for SSH access

#### GCP Deployment
- Google Cloud SDK (gcloud) installed and authenticated
- Compute Engine API enabled
- Appropriate IAM permissions

## 🐳 Docker Deployment (Recommended)

### Advantages
- Consistent environment across platforms
- Easy scaling and management
- Built-in service orchestration
- Automatic health checks and restarts

### Quick Deploy
```bash
./deploy-docker.sh
```

### Manual Docker Setup
```bash
# Build and start services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included
- **Backend API** (Port 8000)
- **Frontend** (Port 3000)
- **Nginx Reverse Proxy** (Port 80/443)
- **Redis Cache** (Port 6379)
- **PostgreSQL Database** (Port 5432)

## ☁️ AWS EC2 Deployment

### Advantages
- Scalable compute resources
- Integrated with AWS ecosystem
- Professional-grade infrastructure
- Easy backup and monitoring

### Quick Deploy
```bash
./deploy-aws.sh
```

### What It Creates
- EC2 instance (t3.large by default)
- Security groups with appropriate rules
- Key pair for SSH access
- Nginx reverse proxy configuration
- PM2 process management
- Automatic SSL setup (optional)

### Instance Specifications
- **Instance Type**: t3.large (2 vCPUs, 8GB RAM)
- **Storage**: 20GB SSD
- **OS**: Amazon Linux 2023
- **Network**: Public subnet with Elastic IP

### Post-Deployment
```bash
# SSH into instance
ssh -i ron-ai-key.pem ec2-user@<PUBLIC_IP>

# Check application status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all
```

## 🌐 Google Cloud Platform Deployment

### Advantages
- Global infrastructure
- Advanced networking capabilities
- Integrated monitoring and logging
- Competitive pricing

### Quick Deploy
```bash
./deploy-gcp.sh
```

### What It Creates
- Compute Engine instance (e2-standard-4)
- Firewall rules for HTTP/HTTPS access
- Docker-based deployment
- Automatic startup scripts

### Instance Specifications
- **Machine Type**: e2-standard-4 (4 vCPUs, 16GB RAM)
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS
- **Network**: External IP with HTTP/HTTPS access

## 📊 Monitoring and Maintenance

### Health Monitoring
```bash
# Check overall system status
./monitor.sh

# Check specific components
./monitor.sh health      # Service health only
./monitor.sh resources   # System resources
./monitor.sh processes   # Running processes
./monitor.sh logs        # Log analysis
./monitor.sh network     # Network connectivity

# Generate comprehensive report
./monitor.sh report

# Perform maintenance tasks
./monitor.sh maintenance
```

### Log Management
- **Backend logs**: `backend/api.log`
- **System logs**: `/var/log/ron-ai/`
- **Docker logs**: `docker-compose logs`
- **PM2 logs**: `pm2 logs`

### Performance Monitoring
```bash
# Docker resource usage
docker stats

# System resource usage
htop

# Network connections
netstat -tulpn

# Disk usage
df -h
```

## 🔒 Security Considerations

### SSL/TLS Setup
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update Nginx configuration
3. Redirect HTTP to HTTPS
4. Configure HSTS headers

### Firewall Configuration
- Only expose necessary ports (80, 443, 22)
- Use security groups/firewall rules
- Consider VPN access for admin functions
- Regular security updates

### API Key Management
- Store API keys in environment variables
- Use secrets management services
- Rotate keys regularly
- Monitor API usage

## 🔧 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check logs
docker-compose logs backend
# or
pm2 logs backend

# Common causes:
# - Missing API keys in .env
# - Port conflicts
# - Python dependency issues
```

#### Frontend Build Failures
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules .next
npm install
npm run build
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Reset database
docker-compose down
docker volume rm ron-ai_postgres_data
docker-compose up -d
```

#### High Memory Usage
```bash
# Check memory usage
./monitor.sh resources

# Restart services
docker-compose restart
# or
pm2 restart all
```

### Performance Optimization

#### Backend Optimization
- Enable Redis caching
- Optimize database queries
- Use connection pooling
- Implement request rate limiting

#### Frontend Optimization
- Enable Nginx gzip compression
- Configure browser caching
- Optimize images and assets
- Use CDN for static content

#### Infrastructure Optimization
- Use load balancers for high availability
- Implement auto-scaling
- Set up monitoring and alerting
- Regular performance testing

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas
- CDN for static assets
- Container orchestration (Kubernetes)

### Vertical Scaling
- Increase instance size
- Add more CPU/RAM
- Faster storage (NVMe SSD)
- Dedicated database server

### Auto-Scaling Setup
```bash
# AWS Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name ron-ai-asg \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 2

# GCP Managed Instance Group
gcloud compute instance-groups managed create ron-ai-mig \
  --size 2 \
  --template ron-ai-template
```

## 🔄 Backup and Recovery

### Database Backups
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U ron_ai_user ron_ai > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U ron_ai_user ron_ai < backup.sql
```

### Application Backups
```bash
# Create full backup
tar -czf ron-ai-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=venv \
  --exclude=.git \
  .
```

### Automated Backups
- Set up cron jobs for regular backups
- Use cloud storage for backup retention
- Test restore procedures regularly
- Document recovery processes

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] All API keys configured and tested
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security review completed

### Deployment
- [ ] Deploy to staging environment first
- [ ] Run comprehensive tests
- [ ] Deploy to production
- [ ] Verify all services are running
- [ ] Test critical functionality
- [ ] Monitor for issues

### Post-Deployment
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Schedule regular backups
- [ ] Document operational procedures
- [ ] Train team on maintenance tasks

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies monthly
- Review and rotate API keys quarterly
- Monitor resource usage weekly
- Test backup/restore procedures monthly
- Security patches as needed

### Emergency Procedures
1. **Service Down**: Check logs, restart services
2. **High Load**: Scale up resources, check for issues
3. **Security Incident**: Isolate, investigate, patch
4. **Data Loss**: Restore from backup, investigate cause

### Getting Help
- Check logs first: `./monitor.sh logs`
- Review this documentation
- Check GitHub issues
- Contact support team

---

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Google Cloud Compute Engine](https://cloud.google.com/compute/docs)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PM2 Process Manager](https://pm2.keymetrics.io/docs/)

---

*Last updated: $(date)*
