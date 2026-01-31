#!/bin/bash

# Clawpass Setup Script
# This script helps you set up the Clawpass development environment

set -e

echo "🔧 Setting up Clawpass..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build the project
echo "🔨 Building the project..."
npm run build
echo "✅ Project built successfully"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test
echo "✅ Tests passed"
echo ""

# Run linter
echo "🔍 Running linter..."
npm run lint
echo "✅ Linting passed"
echo ""

# Run type checker
echo "📝 Running type checker..."
npm run typecheck
echo "✅ Type checking passed"
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure your settings"
echo "  2. Read QUICKSTART.md for usage examples"
echo "  3. Check out examples/ for integration patterns"
echo "  4. Run 'npm run dev' to start development mode"
echo ""
echo "Happy coding! 🚀"
