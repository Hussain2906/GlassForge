# 🚀 GlassForge EC2 Deployment Guide

Complete guide to deploy GlassForge on AWS EC2 with PostgreSQL.

## 📋 Prerequisites

- AWS Account
- Domain name (optional, but recommended)
- SSH key pair for EC2

## 🖥️ Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. **Name**: `glassforge-production`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance Type**: `t3.medium` (2 vCPU, 4GB RAM) - minimum recommended
5. **Key Pair**: Create new or select existing
6. **Network Settings**:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow Custom TCP (port 3000) from anywhere (temporary, for testing)
   - Allow Custom TCP (port 3001) from anywhere (temporary, for testing)
7. **Storage**: 20GB gp3 (minimum)
8. Click **Launch Instance**

### 1.2 Connect to EC2
```bash
# Download your key pair (e.g., glassforge-key.pem)
chmod 400 glassforge-key.pem

# Connect to EC2
ssh -i glassforge-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 🔧 Step 2: Setup Server

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Node.js 18+
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2.3 Install PostgreSQL
```bash
# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 2.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.5 Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🗄️ Step 3: Setup PostgreSQL Database

### 3.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE glassforge;
CREATE USER glassforge_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE glassforge TO glassforge_user;
ALTER DATABASE glassforge OWNER TO glassforge_user;

# Exit PostgreSQL
\q
```

### 3.2 Configure PostgreSQL for Local Access
```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line before other rules:
# local   all             glassforge_user                         md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3.3 Test Database Connection
```bash
psql -U glassforge_user -d glassforge -h localhost
# Enter password when prompted
# If successful, you'll see: glassforge=>
\q
```

## 📦 Step 4: Deploy Application

### 4.1 Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/Hussain2906/GlassForge.git
cd GlassForge
```

### 4.2 Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Backend `.env` content:**
```env
DATABASE_URL_APP="postgresql://glassforge_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/glassforge"
SHADOW_DATABASE_URL_APP="postgresql://glassforge_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/glassforge_shadow"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=production
```

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run seed
npx ts-node prisma/seed-glass-data.ts
npx ts-node prisma/seed-customers.ts

# Build backend (if using TypeScript compilation)
npm run build  # If you have a build script
```

### 4.3 Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

**Frontend `.env.local` content:**
```env
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP:3001
```

```bash
# Build frontend for production
npm run build
```

## 🚀 Step 5: Start Applications with PM2

### 5.1 Start Backend
```bash
cd /home/ubuntu/GlassForge/backend

# Start with PM2
pm2 start npm --name "glassforge-backend" -- run dev

# Or if you have a start script:
# pm2 start npm --name "glassforge-backend" -- start
```

### 5.2 Start Frontend
```bash
cd /home/ubuntu/GlassForge/frontend

# Start with PM2
pm2 start npm --name "glassforge-frontend" -- start
```

### 5.3 Configure PM2 Startup
```bash
# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Verify PM2 status
pm2 status
pm2 logs
```

## 🌐 Step 6: Configure Nginx Reverse Proxy

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/glassforge
```

**Nginx configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # Or use IP: YOUR_EC2_PUBLIC_IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Or use IP: YOUR_EC2_PUBLIC_IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Enable Configuration
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/glassforge /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 Step 7: Setup SSL with Let's Encrypt (Optional but Recommended)

### 7.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get SSL Certificate
```bash
# For domain-based setup
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

### 7.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

## 🔥 Step 8: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

## ✅ Step 9: Verify Deployment

### 9.1 Check Services
```bash
# Check PM2 processes
pm2 status

# Check logs
pm2 logs glassforge-backend --lines 50
pm2 logs glassforge-frontend --lines 50

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

### 9.2 Test Application
```bash
# Test backend API
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000

# Test from browser
# Open: http://YOUR_EC2_PUBLIC_IP
```

## 🔄 Step 10: Update/Redeploy Application

Create a deployment script:

```bash
nano /home/ubuntu/deploy.sh
```

**deploy.sh content:**
```bash
#!/bin/bash

echo "🚀 Deploying GlassForge..."

cd /home/ubuntu/GlassForge

# Pull latest code
git pull origin master

# Update backend
echo "📦 Updating backend..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart glassforge-backend

# Update frontend
echo "🎨 Updating frontend..."
cd ../frontend
npm install
npm run build
pm2 restart glassforge-frontend

echo "✅ Deployment complete!"
pm2 status
```

```bash
# Make executable
chmod +x /home/ubuntu/deploy.sh

# Run deployment
./deploy.sh
```

## 📊 Step 11: Monitoring & Maintenance

### 11.1 View Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 11.2 Database Backup
```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U glassforge_user -h localhost glassforge > $BACKUP_DIR/glassforge_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "glassforge_*.sql" -mtime +7 -delete

echo "Backup completed: glassforge_$DATE.sql"
```

```bash
chmod +x /home/ubuntu/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

## 🎯 Quick Commands Reference

```bash
# Restart services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql

# View status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Update application
cd /home/ubuntu/GlassForge && git pull && ./deploy.sh
```

## 🔧 Troubleshooting

### Backend not starting
```bash
pm2 logs glassforge-backend
# Check database connection in .env
# Verify PostgreSQL is running
```

### Frontend not loading
```bash
pm2 logs glassforge-frontend
# Check NEXT_PUBLIC_API_URL in .env.local
# Verify backend is running
```

### Database connection issues
```bash
# Test connection
psql -U glassforge_user -d glassforge -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx errors
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

## 📝 Important Notes

1. **Change default passwords** in production
2. **Setup regular backups** for database
3. **Monitor disk space** regularly
4. **Keep system updated**: `sudo apt update && sudo apt upgrade`
5. **Use environment variables** for sensitive data
6. **Setup monitoring** (CloudWatch, Datadog, etc.)
7. **Configure log rotation** to prevent disk fill

## 🎉 Your Application is Live!

- **Frontend**: http://YOUR_EC2_PUBLIC_IP
- **Backend API**: http://YOUR_EC2_PUBLIC_IP:3001
- **With Domain**: https://yourdomain.com

## 💡 Next Steps

1. Point your domain to EC2 IP
2. Setup SSL with Let's Encrypt
3. Configure CloudWatch monitoring
4. Setup automated backups
5. Configure email notifications
6. Setup CI/CD pipeline

---

**Need help?** Check logs with `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
