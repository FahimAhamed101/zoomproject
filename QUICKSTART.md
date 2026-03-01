# Quick Start Guide

## Prerequisites
- PostgreSQL installed and running
- Node.js 18+ installed
- npm installed

## Step 1: Setup PostgreSQL Database

```bash
# Connect to PostgreSQL (adjust credentials as needed)
psql -U postgres

# Create the database
CREATE DATABASE zoomit;
CREATE USER zoomit_user WITH PASSWORD 'zoomit_password';
ALTER ROLE zoomit_user SET client_encoding TO 'utf8';
ALTER ROLE zoomit_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE zoomit_user SET default_transaction_deferrable TO on;
ALTER ROLE zoomit_user SET default_transaction_read_only TO off;
ALTER ROLE zoomit_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE zoomit TO zoomit_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO zoomit_user;
\q
```

## Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
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

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start the backend
npm run dev
```

Backend will be available at `http://localhost:5000`

## Step 3: Setup Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Step 4: Access the Application

### User Panel
- Homepage: `http://localhost:3000`
- Register: `http://localhost:3000/register`
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard` (after login)

### Admin Panel
- Admin Login: `http://localhost:3000/admin/login`
- Admin Dashboard: `http://localhost:3000/admin/dashboard` (after login)

## Default Credentials

### Admin
```
Email: admin@zoomit.com
Password: admin123
```

### Demo Subscription Packages (Pre-created)
1. **Free** - Basic tier
2. **Silver** - Professional tier
3. **Gold** - Business tier
4. **Diamond** - Enterprise tier

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify credentials match

### Prisma Migration Issues
```bash
# Reset database (caution: deletes data)
npm run prisma:migrate reset

# Or recreate the database
dropdb zoomit
createdb zoomit
npm run prisma:migrate
npm run prisma:seed
```

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Can change with `PORT=3001 npm run dev`

### Email Verification Not Working
- In development, check backend console logs
- Configure real SMTP for production
- Or skip email verification by modifying code

## Testing the Features

1. **Create Admin Packages**
   - Login to admin panel
   - Create custom subscription packages
   - Test different limits

2. **User Registration & Subscription**
   - Register new user account
   - Verify email (check console in dev)
   - Select subscription package
   - View package details and history

3. **File &Folder Management**
   - Create folders (respects max folder limit)
   - Create subfolders (respects nesting level)
   - Upload files (respects file type, size, and count limits)
   - Try exceeding limits to see error messages

4. **Package Switching**
   - Select different subscription
   - Verify new limits apply
   - Check subscription history

## API Testing

All endpoints require JWT token in Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/user/folders
```

## Database Backup

```bash
# Backup
pg_dump -U zoomit_user zoomit > backup.sql

# Restore
psql -U zoomit_user zoomit < backup.sql
```

## Performance Tips

- Use indexing on frequently queried fields
- Implement pagination for large file lists
- Cache subscription limits after user login
- Consider CDN for file uploads in production

## Next Steps

1. Configure production database
2. Setup real email service (Gmail, SendGrid, etc.)
3. Deploy backend to cloud (Heroku, AWS, DigitalOcean)
4. Deploy frontend (Vercel, Netlify)
5. Configure custom domain and SSL

---

**All set! Enjoy using Zoomit! 🚀**
