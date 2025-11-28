#!/usr/bin/env pwsh

# 🚀 Quick Start Script for Recycling Centers Management API
# Created by the Wealthiest Programmer in the Universe 💎

Write-Host "♻️ Recycling Centers Management API - Quick Start" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    # Try to connect to PostgreSQL
    $env:PGPASSWORD = "your_password"
    $pgTest = psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL connection failed. Please ensure PostgreSQL is running." -ForegroundColor Red
        Write-Host "💡 Update your DATABASE_URL in .env file with correct credentials" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify PostgreSQL connection. Please ensure it's running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "🗃️ Setting up database..." -ForegroundColor Yellow

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

# Push database schema
Write-Host "📊 Pushing database schema..." -ForegroundColor Cyan
npx prisma db push

# Seed database
Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Cyan
npx prisma db seed

Write-Host ""
Write-Host "🚀 Starting the application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "💎 Application will be available at:" -ForegroundColor Green
Write-Host "   📡 API: http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host "   📚 Docs: http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 Test credentials:" -ForegroundColor Green
Write-Host "   Admin: admin@recycling.com / admin123" -ForegroundColor Cyan
Write-Host "   Manager: manager@recycling.com / manager123" -ForegroundColor Cyan
Write-Host "   User: user@recycling.com / user123" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛠️ Available commands:" -ForegroundColor Green
Write-Host "   npm run start:dev     - Start in development mode" -ForegroundColor Cyan
Write-Host "   npm run prisma:studio - Open Prisma Studio" -ForegroundColor Cyan
Write-Host "   npm run build         - Build for production" -ForegroundColor Cyan
Write-Host ""

# Start the application
npm run start:dev
