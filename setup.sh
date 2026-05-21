#!/bin/bash

# Trainarium Quick Start Script
# This script sets up everything needed to run Trainarium locally

echo "🚀 Welcome to Trainarium Setup!"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please update .env.local with your configuration:"
    echo "   - DATABASE_URL"
    echo "   - NEXTAUTH_SECRET (generate: openssl rand -base64 32)"
    echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional)"
    echo ""
    read -p "Press Enter after updating .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo ""
echo "🗄️  Setting up database..."
npm run prisma:push

# Start development server
echo ""
echo "✨ Starting development server..."
echo "📍 Open http://localhost:3000 in your browser"
echo ""
npm run dev
