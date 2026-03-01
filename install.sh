#!/bin/bash
# Zoomit Installer - Automated setup script

set -e

echo "🚀 Zoomit - SaaS File Management System Installer"
echo "=================================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    exit 1
fi

echo "✅ All prerequisites found"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL="postgresql://zoomit_user:zoomit_password@localhost:5432/zoomit"
JWT_SECRET="super-secret-key-change-in-production"
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=104857600

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_EMAIL=noreply@zoomit.com
EOF
fi

echo "Installing backend dependencies..."
npm install

echo "Setting up database..."
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

echo "Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete"
echo ""

echo "=================================================="
echo "✅ Installation Complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌐 Access the application:"
echo "  Homepage: http://localhost:3000"
echo "  Admin Panel: http://localhost:3000/admin/login"
echo ""
echo "🔐 Default Credentials:"
echo "  Admin Email: admin@zoomit.com"
echo "  Admin Password: admin123"
echo ""
echo "📚 For more details, see README.md and QUICKSTART.md"
echo "=================================================="
