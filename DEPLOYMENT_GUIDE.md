# MediGenix AI - Production Deployment Guide

## 🚀 Deployment Readiness Checklist

### ✅ Application Status
- [x] All features implemented and tested
- [x] Authentication system (Emergent Google Login)
- [x] AI features (Image Analysis + Voice Input)
- [x] Wearable device integration (Manual + API-ready)
- [x] Responsive design (Mobile/Tablet/Desktop)
- [x] Database schema finalized
- [x] API endpoints documented

---

## 📋 Environment Variables

### Backend (.env)
```bash
# Database
MONGO_URL=mongodb://your-production-mongodb:27017
DB_NAME=medigenix_production

# AI Integration
EMERGENT_LLM_KEY=sk-emergent-YOUR_PRODUCTION_KEY

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=your-secret-key-here

# Optional
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
```

### Frontend (.env)
```bash
# Backend API
REACT_APP_BACKEND_URL=https://api.yourdomain.com

# Feature Flags
REACT_APP_ENABLE_VOICE_INPUT=true
REACT_APP_ENABLE_IMAGE_ANALYSIS=true
REACT_APP_ENABLE_WEARABLES=true

# Analytics (Optional)
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

---

## 🏗️ Infrastructure Requirements

### Minimum Requirements
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Bandwidth**: 100GB/month
- **SSL Certificate**: Required (Let's Encrypt recommended)

### Recommended for Production
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Bandwidth**: 500GB/month
- **CDN**: CloudFlare or similar
- **Backup**: Daily automated backups

---

## 🐳 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Create Dockerfile for Backend
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 2. Create Dockerfile for Frontend
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: always
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: medigenix_production

  backend:
    build: ./backend
    restart: always
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=medigenix_production
      - EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY}
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - REACT_APP_BACKEND_URL=https://api.yourdomain.com
    depends_on:
      - backend

volumes:
  mongo_data:
```

#### 4. Deploy Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

---

### Option 2: Traditional Server Deployment

#### 1. Install Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3.11 python3-pip nodejs npm mongodb nginx certbot

# Install yarn
npm install -g yarn

# Install PM2 for process management
npm install -g pm2
```

#### 2. Setup Backend
```bash
cd /var/www/medigenix/backend
pip3 install -r requirements.txt

# Start with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name medigenix-backend
pm2 save
pm2 startup
```

#### 3. Setup Frontend
```bash
cd /var/www/medigenix/frontend
yarn install
yarn build

# Copy build to nginx
sudo cp -r build/* /var/www/html/
```

#### 4. Configure Nginx
```nginx
# /etc/nginx/sites-available/medigenix
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
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

#### 5. Enable Site & SSL
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/medigenix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 3: Cloud Platform Deployment

#### AWS (Elastic Beanstalk)
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init medigenix-ai

# Create environment
eb create medigenix-production

# Deploy
eb deploy

# Open app
eb open
```

#### Google Cloud Platform (App Engine)
```yaml
# app.yaml
runtime: python311
env: standard

handlers:
  - url: /api/.*
    script: auto
    secure: always

  - url: /.*
    static_files: frontend/build/index.html
    upload: frontend/build/.*

env_variables:
  MONGO_URL: "your-mongo-connection"
  EMERGENT_LLM_KEY: "your-llm-key"
```

```bash
gcloud app deploy
```

#### Heroku
```bash
# Create Procfile
echo "web: uvicorn backend.server:app --host=0.0.0.0 --port=$PORT" > Procfile

# Deploy
heroku create medigenix-ai
heroku addons:create mongolab:sandbox
git push heroku main
```

#### Vercel (Frontend) + Railway (Backend)
```bash
# Frontend to Vercel
vercel --prod

# Backend to Railway
railway login
railway init
railway up
```

---

## 🔒 Security Hardening

### 1. Environment Security
```bash
# Set proper file permissions
chmod 600 .env
chmod 700 /var/www/medigenix

# Disable directory listing
echo "Options -Indexes" > /var/www/html/.htaccess
```

### 2. Database Security
```bash
# MongoDB authentication
mongo admin --eval '
db.createUser({
  user: "medigenix_admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "medigenix_production" } ]
})
'

# Update connection string
MONGO_URL=mongodb://medigenix_admin:PASSWORD@localhost:27017/medigenix_production
```

### 3. Rate Limiting (nginx)
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... rest of proxy config
}
```

### 4. CORS Configuration
```python
# backend/server.py - Update CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "https://www.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
pip install sentry-sdk
npm install @sentry/react

# Configure Sentry
# backend/server.py
import sentry_sdk
sentry_sdk.init(dsn="YOUR_SENTRY_DSN")

# frontend/src/index.js
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
```

### 2. Server Monitoring
```bash
# Install monitoring stack
docker run -d --name prometheus prom/prometheus
docker run -d --name grafana grafana/grafana
```

### 3. Log Management
```bash
# Centralized logging
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and Test
        run: |
          cd backend && pip install -r requirements.txt && pytest
          cd ../frontend && yarn install && yarn test
      
      - name: Deploy
        run: |
          # Your deployment commands
          ssh user@server 'cd /var/www/medigenix && git pull && pm2 restart all'
```

---

## 🧪 Post-Deployment Testing

### Health Check Endpoints
```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Frontend
curl https://yourdomain.com

# Auth flow
curl https://api.yourdomain.com/api/auth/me -H "Cookie: session_token=test"
```

### Load Testing
```bash
# Install ab (Apache Bench)
sudo apt install apache2-utils

# Run load test
ab -n 1000 -c 10 https://api.yourdomain.com/api/
```

---

## 📈 Scaling Strategy

### Horizontal Scaling
```bash
# Add more backend instances
docker-compose up -d --scale backend=5

# Load balancer (nginx)
upstream backend {
    least_conn;
    server backend1:8001;
    server backend2:8001;
    server backend3:8001;
}
```

### Database Scaling
```bash
# MongoDB replica set
# Enable replication in docker-compose
services:
  mongodb:
    command: mongod --replSet rs0
    
# Initialize replica set
mongo --eval 'rs.initiate()'
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue: CORS errors**
```bash
# Check CORS_ORIGINS in .env
# Ensure credentials=true in frontend axios
```

**Issue: Database connection failed**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

**Issue: SSL certificate expired**
```bash
# Renew Let's Encrypt
sudo certbot renew
sudo systemctl reload nginx
```

**Issue: High memory usage**
```bash
# Check processes
pm2 list
docker stats

# Restart services
pm2 restart all
docker-compose restart
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Monitoring tools setup
- [ ] Error tracking configured

### Deployment
- [ ] Code deployed to production
- [ ] Database migrations run
- [ ] Services restarted
- [ ] Health checks passing
- [ ] Smoke tests completed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test authentication flow
- [ ] Confirm AI features working
- [ ] Monitor resource usage

---

## 🎯 Production URLs

**Frontend**: https://medigenix.yourdomain.com
**Backend API**: https://api.medigenix.yourdomain.com
**Admin Panel**: https://admin.medigenix.yourdomain.com (if applicable)

---

## 📞 Support & Maintenance

### Backup Strategy
- Database: Daily automated backups
- Application: Git repository
- User uploads: S3/Cloud Storage

### Update Schedule
- Security patches: Immediate
- Bug fixes: Weekly
- Feature releases: Monthly
- Major versions: Quarterly

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: January 2026
**Version**: 1.0.0
