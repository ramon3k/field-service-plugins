# AWS Deployment Guide
**Field Service Management System on Amazon Web Services**

## 🚀 Overview

This guide covers deploying your Field Service application to AWS using:
- **Amazon RDS** for SQL Server database
- **Elastic Beanstalk** or **EC2** for the Node.js application
- **S3** for file storage (plugin uploads, attachments)
- **Route 53** for DNS (optional)
- **Certificate Manager** for SSL

### Cost Estimate

| Resource | Instance Type | Monthly Cost |
|----------|---------------|--------------|
| RDS SQL Server Express | db.t3.micro | ~$15-25 |
| Elastic Beanstalk (EC2) | t3.micro | ~$8 |
| Application Load Balancer | - | ~$16 |
| S3 Storage | 5GB | ~$0.12 |
| Data Transfer | 10GB/month | ~$0.90 |
| **Total** | | **~$40-50/month** |

💡 **Free Tier**: AWS offers 12 months free for eligible services (EC2, RDS, etc.)

---

## Prerequisites

### 1. AWS Account

Sign up at: https://aws.amazon.com/free/

### 2. AWS CLI

**Install AWS CLI**:
```powershell
# Download from: https://aws.amazon.com/cli/
# Or use MSI installer:
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Configure AWS CLI**:
```powershell
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### 3. Elastic Beanstalk CLI (Optional)

```powershell
pip install awsebcli
```

---

## Deployment Option 1: Elastic Beanstalk (Recommended - Easiest)

**Benefits:**
- ✅ Automatic deployment and scaling
- ✅ Built-in load balancing
- ✅ Easy rollback
- ✅ Environment management (dev/staging/prod)
- ✅ Integrated monitoring

### Step 1: Prepare Application

1. **Create `package.json` for deployment**:

Create a file `package-aws.json` with production dependencies only:

```json
{
  "name": "field-service-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node server/api.cjs"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mssql": "^9.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^6.0.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

2. **Build the frontend**:

```powershell
npm run build
```

This creates the `dist/` folder with production-ready frontend files.

3. **Create `.ebignore`** (tells EB what to skip):

```
node_modules/
.git/
.env
.env.*
*.log
src/
.vscode/
installers/
database/demo-data/
```

### Step 2: Initialize Elastic Beanstalk

```powershell
# Initialize EB app
eb init

# Choose:
# - Region: us-east-1 (or your preferred region)
# - Application name: field-service-app
# - Platform: Node.js
# - Platform branch: Node.js 18
# - CodeCommit: No
# - SSH: Yes (recommended)
```

### Step 3: Create Environment

```powershell
# Create environment
eb create field-service-production

# This will:
# - Create EC2 instance
# - Set up load balancer
# - Configure security groups
# - Deploy your application

# Wait 5-10 minutes for environment creation
```

### Step 4: Configure Environment Variables

```powershell
# Set environment variables
eb setenv \
  DB_SERVER=your-rds-endpoint.rds.amazonaws.com \
  DB_NAME=FieldServiceDB \
  DB_USER=admin \
  DB_PASSWORD=YourStrongPassword123! \
  DB_AUTH=SQL \
  JWT_SECRET=your-super-secret-jwt-key-change-this \
  PORT=8080 \
  NODE_ENV=production
```

### Step 5: Create RDS SQL Server Database

**Option A: Via AWS Console**

1. Go to **RDS Console**: https://console.aws.amazon.com/rds/
2. Click **Create database**
3. Choose:
   - **Standard Create**
   - Engine: **Microsoft SQL Server**
   - Edition: **Express Edition** (free tier eligible)
   - Template: **Free tier** (if available) or **Dev/Test**
   - DB instance identifier: `field-service-db`
   - Master username: `admin`
   - Master password: (set a strong password)
   - DB instance class: `db.t3.micro`
   - Storage: 20 GB (default)
   - VPC: Same as your Elastic Beanstalk environment
   - Public access: **No** (more secure)
   - VPC security group: Create new → `field-service-db-sg`
   - Initial database name: `FieldServiceDB`
4. Click **Create database**
5. Wait 5-10 minutes for creation

**Option B: Via AWS CLI**

```powershell
aws rds create-db-instance `
  --db-instance-identifier field-service-db `
  --db-instance-class db.t3.micro `
  --engine sqlserver-ex `
  --master-username admin `
  --master-user-password YourStrongPassword123! `
  --allocated-storage 20 `
  --vpc-security-group-ids sg-xxxxxxxxx `
  --db-subnet-group-name default `
  --backup-retention-period 7 `
  --no-publicly-accessible
```

### Step 6: Configure Security Groups

Allow EB instance to connect to RDS:

```powershell
# Get your EB security group ID
$ebSecurityGroup = (aws elasticbeanstalk describe-environment-resources --environment-name field-service-production --query "EnvironmentResources.Instances[0].Id" --output text)

# Get RDS security group ID
$rdsSecurityGroup = (aws rds describe-db-instances --db-instance-identifier field-service-db --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)

# Allow inbound from EB to RDS (port 1433)
aws ec2 authorize-security-group-ingress `
  --group-id $rdsSecurityGroup `
  --protocol tcp `
  --port 1433 `
  --source-group $ebSecurityGroup
```

### Step 7: Migrate Database Schema

1. **Get RDS endpoint**:
   ```powershell
   aws rds describe-db-instances --db-instance-identifier field-service-db --query "DBInstances[0].Endpoint.Address" --output text
   ```

2. **Connect via SSMS**:
   - Server: `field-service-db.xxxx.us-east-1.rds.amazonaws.com,1433`
   - Authentication: **SQL Server Authentication**
   - Username: `admin`
   - Password: (your password)

3. **Run schema scripts**:
   ```sql
   -- Run your database schema
   -- database/schema.sql
   -- database/create-admin-user.sql
   ```

### Step 8: Deploy Application

```powershell
# Deploy
eb deploy

# Monitor deployment
eb logs

# Open in browser
eb open
```

Your app is now live at: `http://field-service-production.us-east-1.elasticbeanstalk.com`

### Step 9: Configure HTTPS (SSL)

1. **Request SSL certificate** (AWS Certificate Manager):
   ```powershell
   aws acm request-certificate `
     --domain-name fieldservice.yourdomain.com `
     --validation-method DNS
   ```

2. **Verify ownership** via DNS (follow instructions in console)

3. **Configure load balancer** to use HTTPS:
   - Go to EC2 → Load Balancers
   - Select your EB load balancer
   - Add listener: HTTPS (443)
   - Select your SSL certificate
   - Forward to target group

4. **Update your domain DNS** to point to the load balancer

### Step 10: Set Up Custom Domain (Optional)

**Using Route 53**:

```powershell
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(Get-Date -Format "yyyyMMddHHmmss")

# Get load balancer DNS name
$lbDNS = (aws elbv2 describe-load-balancers --query "LoadBalancers[0].DNSName" --output text)

# Create A record
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "fieldservice.yourdomain.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "'"$lbDNS"'"}]
    }
  }]
}'
```

---

## Deployment Option 2: EC2 (More Control)

**Use this if you need:**
- Full control over the server
- Custom OS-level configuration
- Ability to run Windows Server
- Direct access to file system

### Step 1: Launch EC2 Instance

```powershell
# Create key pair for SSH
aws ec2 create-key-pair --key-name field-service-key --query 'KeyMaterial' --output text > field-service-key.pem

# Launch EC2 instance (Ubuntu)
aws ec2 run-instances `
  --image-id ami-0c55b159cbfafe1f0 `
  --instance-type t3.micro `
  --key-name field-service-key `
  --security-group-ids sg-xxxxxxxxx `
  --subnet-id subnet-xxxxxxxxx `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FieldServiceApp}]'
```

### Step 2: Configure Security Group

```powershell
# Allow HTTP (80), HTTPS (443), SSH (22)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### Step 3: Connect to Instance

```powershell
# Get public IP
$publicIP = (aws ec2 describe-instances --filters "Name=tag:Name,Values=FieldServiceApp" --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

# SSH (Windows: use PuTTY or WSL)
ssh -i field-service-key.pem ubuntu@$publicIP
```

### Step 4: Install Node.js

```bash
# On the EC2 instance
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### Step 5: Deploy Application

```bash
# Clone or upload your app
git clone https://github.com/YOUR_USERNAME/field-service-plugins.git
cd field-service-plugins

# Install dependencies
npm install

# Build frontend
npm run build

# Create .env file
nano .env
# (Add your environment variables)

# Install PM2 for process management
sudo npm install -g pm2

# Start app
cd server
pm2 start api.cjs --name field-service-api

# Auto-start on reboot
pm2 startup
pm2 save
```

### Step 6: Set Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/field-service
```

Add:
```nginx
server {
    listen 80;
    server_name fieldservice.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/field-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Install SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d fieldservice.yourdomain.com
```

---

## S3 for File Storage (Plugin Uploads)

### Step 1: Create S3 Bucket

```powershell
aws s3 mb s3://field-service-uploads --region us-east-1
```

### Step 2: Configure Bucket Policy

```powershell
# Create policy file: s3-policy.json
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/aws-elasticbeanstalk-ec2-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::field-service-uploads/*"
    }
  ]
}
"@ | Out-File s3-policy.json

# Apply policy
aws s3api put-bucket-policy --bucket field-service-uploads --policy file://s3-policy.json
```

### Step 3: Update Application Code

Install AWS SDK:
```powershell
npm install @aws-sdk/client-s3
```

Update `server/api.cjs`:
```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });

// When uploading files
const uploadToS3 = async (file) => {
  const params = {
    Bucket: 'field-service-uploads',
    Key: `plugins/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  await s3Client.send(new PutObjectCommand(params));
  return `https://field-service-uploads.s3.amazonaws.com/plugins/${file.originalname}`;
};
```

---

## RDS SQL Server Details

### Backup Configuration

RDS automatically backs up your database:

```powershell
# Set backup retention to 7 days
aws rds modify-db-instance `
  --db-instance-identifier field-service-db `
  --backup-retention-period 7 `
  --preferred-backup-window "03:00-04:00"
```

### Manual Snapshots

```powershell
# Create snapshot
aws rds create-db-snapshot `
  --db-instance-identifier field-service-db `
  --db-snapshot-identifier field-service-snapshot-$(Get-Date -Format "yyyyMMdd")
```

### Restore from Snapshot

```powershell
aws rds restore-db-instance-from-db-snapshot `
  --db-instance-identifier field-service-db-restored `
  --db-snapshot-identifier field-service-snapshot-20251030
```

### Scaling

```powershell
# Upgrade instance class
aws rds modify-db-instance `
  --db-instance-identifier field-service-db `
  --db-instance-class db.t3.small `
  --apply-immediately
```

---

## Monitoring and Logging

### CloudWatch Logs

**Elastic Beanstalk automatically sends logs to CloudWatch.**

View logs:
```powershell
# Via CLI
eb logs

# Stream logs in real-time
eb logs --stream

# Via console
# CloudWatch → Logs → /aws/elasticbeanstalk/field-service-production
```

### Set Up Alarms

```powershell
# CPU usage alarm
aws cloudwatch put-metric-alarm `
  --alarm-name field-service-high-cpu `
  --alarm-description "Alert when CPU exceeds 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/EC2 `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:field-service-alerts
```

### RDS Monitoring

```powershell
# Database connections
aws cloudwatch get-metric-statistics `
  --namespace AWS/RDS `
  --metric-name DatabaseConnections `
  --dimensions Name=DBInstanceIdentifier,Value=field-service-db `
  --start-time 2025-10-30T00:00:00Z `
  --end-time 2025-10-30T23:59:59Z `
  --period 3600 `
  --statistics Average
```

---

## Auto Scaling (Optional)

### Configure Elastic Beanstalk Auto Scaling

```powershell
# Edit .ebextensions/autoscaling.config
```

Create `.ebextensions/autoscaling.config`:
```yaml
option_settings:
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 4
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Statistic: Average
    Unit: Percent
    UpperThreshold: 75
    LowerThreshold: 25
```

Deploy:
```powershell
eb deploy
```

---

## Cost Optimization

### 1. Use Reserved Instances

Save up to 70% by committing to 1-3 years:

```powershell
# Purchase RI for EC2
aws ec2 purchase-reserved-instances-offering `
  --reserved-instances-offering-id xxxxxxxxxxx `
  --instance-count 1
```

### 2. Use RDS Reserved Instances

```powershell
aws rds purchase-reserved-db-instances-offering `
  --reserved-db-instances-offering-id xxxxxxxxxxx `
  --db-instance-count 1
```

### 3. Enable S3 Lifecycle Policies

Move old files to cheaper storage:

```json
{
  "Rules": [
    {
      "Id": "MoveToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### 4. Set Up Budget Alerts

```powershell
aws budgets create-budget `
  --account-id YOUR_ACCOUNT_ID `
  --budget file://budget.json `
  --notifications-with-subscribers file://notifications.json
```

---

## Disaster Recovery

### Multi-Region Deployment

Deploy to multiple regions for high availability:

```powershell
# Deploy to us-east-1
eb create field-service-prod-east

# Deploy to us-west-2
eb create field-service-prod-west --region us-west-2
```

Use **Route 53 health checks** to failover automatically.

### Database Replication

Enable **RDS Multi-AZ** for automatic failover:

```powershell
aws rds modify-db-instance `
  --db-instance-identifier field-service-db `
  --multi-az `
  --apply-immediately
```

---

## Troubleshooting

### Application not starting

```powershell
# Check logs
eb logs

# SSH into instance
eb ssh

# Check PM2 status (if using EC2)
pm2 logs field-service-api
```

### Can't connect to RDS

- Verify security group allows inbound from EC2
- Check RDS endpoint is correct in environment variables
- Test connection with SSMS or Azure Data Studio

### High costs

- Check CloudWatch metrics for unused resources
- Enable Cost Explorer in AWS Console
- Set up billing alerts

---

## Comparison: AWS vs Azure

| Feature | AWS | Azure |
|---------|-----|-------|
| **Database** | RDS SQL Server (~$15-25/mo) | Azure SQL (~$15/mo) |
| **Compute** | Elastic Beanstalk/EC2 (~$8/mo) | App Service (~$13/mo) |
| **Learning Curve** | Moderate | Easier (if you know Windows) |
| **Free Tier** | 12 months | 12 months |
| **Management** | More manual | More automated |
| **Best For** | Maximum flexibility | .NET/Microsoft stack |

---

## Next Steps

✅ **Deployed to AWS?** Great! Now:
- Set up automated backups
- Configure monitoring and alerts
- Test disaster recovery plan
- Document your infrastructure

📚 **Related Guides:**
- [AZURE-DEPLOYMENT-GUIDE.md](AZURE-DEPLOYMENT-GUIDE.md) - Deploy to Azure instead
- [LOCAL-INSTALL.md](LOCAL-INSTALL.md) - Local installation
- [INTERNET-ACCESS-GUIDE.md](INTERNET-ACCESS-GUIDE.md) - Expose local to internet

---

## Support

- **AWS Documentation**: https://docs.aws.amazon.com/
- **GitHub Issues**: [Report issues](https://github.com/ramon3k/field-service-plugins/issues)
- **Community**: Check Discussions for help

---

## License

This software is licensed under AGPL-3.0. See [LICENSE.txt](LICENSE.txt) for details.
