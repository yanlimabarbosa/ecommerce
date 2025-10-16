# Quick Setup Guide

## Prerequisites
- Docker Desktop
- Node.js 18+
- Git

## Steps

```bash
# 1. Clone and install
git clone https://github.com/yanlimabarbosa/ecommerce.git
cd ecommerce
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Start services
npm run setup
# Wait 30-60 seconds

# 4. Setup database
npx prisma db push

# 5. Run app
npm run dev
```

## Access
- Auth Service: http://localhost:6001
- API Gateway: http://localhost:8080
- MongoDB: `mongodb://appuser:appsecret@localhost:27017/development?authSource=development&replicaSet=rs0`

## Commands
- `npm run docker:stop` - Stop services
- `npm run docker:logs` - View logs  
- `npm run docker:reset` - Fresh start (⚠️ deletes data)

## Troubleshooting
- **Services unhealthy?** Wait 15s, check: `npm run docker:logs`
- **Port in use?** Run: `npm run docker:stop`
- **Fresh start?** Run: `npm run docker:reset && npx prisma db push`
