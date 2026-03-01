# Zoomit - SaaS File Management System

A comprehensive, subscription-based file and folder management system built with modern tech stack.

## Tech Stack

**Backend:**
- Node.js + Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Nodemailer (Email support)

**Frontend:**
- Next.js 14
- React
- Jotai (State management)
- Axios (HTTP client)
- Tailwind CSS support

## Features

### Admin Panel
- ✅ Admin login with default credentials
- ✅ Subscription package management (CRUD)
- ✅ Define package limits:
  - Max Folders
  - Max Nesting Level
  - Allowed File Types
  - Max File Size
  - Total File Limit
  - Files Per Folder

### User Panel
- ✅ User registration with email verification
- ✅ User login
- ✅ Subscribe to packages
- ✅ View subscription history
- ✅ File & Folder Management:
  - Create/delete/rename folders
  - Create subfolders with nesting level enforcement
  - Upload files with subscription limits
  - View/rename/delete files
  - Subscription-based enforcements on all actions

### Security & Enforcement
- ✅ JWT-based authentication
- ✅ Package-level subscription enforcement
- ✅ Every action validates against active subscription
- ✅ Email verification and password reset functionality
- ✅ File upload middleware with size validation

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (running locally or on a server)
- Git

### 1. Clone/Setup the Project

```bash
cd c:\Users\Fahim\Desktop\zoomit
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zoomit"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDER_EMAIL=noreply@zoomit.com

UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=104857600
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb zoomit

# Run Prisma migrations
npm run prisma:migrate

# Seed default admin and packages
npm run prisma:seed
```

### 4. Start Backend

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Backend Architecture Diagram

```mermaid
flowchart TD
    A[Client: Frontend / Postman] --> B[Express App: src/index.ts]
    B --> C[Global Middleware]
    C --> C1[CORS]
    C --> C2[JSON Body Parser]
    C --> C3[Auth Middleware]
    C --> C4[Error Handler]

    B --> D[Route Layer]
    D --> D1["/api/auth"]
    D --> D2["/api/admin"]
    D --> D3["/api/user"]

    D1 --> E1[Auth Controllers]
    D2 --> E2[Admin + Subscription Controllers]
    D3 --> E3[User + Folder + File Controllers]

    E1 --> F[Service Layer]
    E2 --> F
    E3 --> F

    F --> F1[authService]
    F --> F2[adminAuthService]
    F --> F3[subscriptionService]
    F --> F4[folderService]
    F --> F5[fileService]

    F --> G[Utility Layer]
    G --> G1[JWT Utils]
    G --> G2[Email Utils]
    G --> G3[Custom Error Utils]

    F --> H[Prisma ORM]
    H --> I[(PostgreSQL)]

    E3 --> J[Upload Middleware: multer]
    J --> K[(uploads/ filesystem)]
```

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

The `.env.local` file is already configured to connect to the backend at `http://localhost:5000/api`

### 6. Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Default Credentials

### Admin Login
- **Email:** admin@zoomit.com
- **Password:** admin123

### Access Admin Panel
- Go to `http://localhost:3000/admin/login`
- Login with admin credentials above
- Manage subscription packages

### User Registration
- Go to `http://localhost:3000/register`
- Create a new account
- Verify email (in development, check console/logs)
- Login and select a subscription package
- Start managing files and folders

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `GET /api/admin/packages` - Get all packages
- `POST /api/admin/packages` - Create package
- `PUT /api/admin/packages/:id` - Update package
- `DELETE /api/admin/packages/:id` - Delete package

### User Subscriptions
- `GET /api/user/subscriptions/current` - Get current subscription
- `POST /api/user/subscriptions/assign` - Assign subscription to user
- `GET /api/user/subscriptions/history` - Get subscription history
- `GET /api/admin/public-packages` - Get all public packages

### User Folders
- `POST /api/user/folders` - Create root folder
- `POST /api/user/folders/subfolder` - Create subfolder
- `GET /api/user/folders` - Get root folders
- `GET /api/user/folders/all` - Get all folders
- `GET /api/user/folders/:folderId` - Get folder structure
- `PUT /api/user/folders/:folderId` - Rename folder
- `DELETE /api/user/folders/:folderId` - Delete folder

### User Files
- `POST /api/user/files/upload` - Upload file
- `GET /api/user/files/folder/:folderId` - Get folder files
- `GET /api/user/files/all` - Get all user files
- `GET /api/user/files/:fileId` - Get file details
- `PUT /api/user/files/:fileId` - Rename file
- `DELETE /api/user/files/:fileId` - Delete file

## Project Structure

```
zoomit/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── services/             # Business logic
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Auth, error handling
│   │   ├── utils/                # JWT, email, error handling
│   │   ├── types/                # TypeScript types
│   │   └── index.ts              # Entry point
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Seed script
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/
    │   ├── (pages)/
    │   │   ├── page.tsx           # Home page
    │   │   ├── login/
    │   │   ├── register/
    │   │   ├── dashboard/
    │   │   ├── admin/login
    │   │   └── admin/dashboard
    │   ├── globals.css
    │   └── layout.tsx
    ├── src/
    │   ├── services/api.ts        # API client
    │   ├── config.ts              # Configuration
    │   └── store/                 # State management
    ├── package.json
    └── next.config.js
```

## Database Schema

### Users
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `firstName`, `lastName`: User info
- `emailVerified`: Email verification status
- `currentSubscriptionId`: Active subscription

### Admin
- `id`: Admin ID
- `email`: Admin email (unique)
- `password`: Hashed password

### SubscriptionPackage
- `id`: Package ID
- `name`: Package name (Free, Silver, Gold, Diamond)
- `maxFolders`: Max folders allowed
- `maxNestingLevel`: Max folder depth
- `allowedFileTypes`: Allowed file types
- `maxFileSize`: Max file size in MB
- `totalFileLimit`: Max files in account
- `filesPerFolder`: Max files per folder
- `price`: Monthly price

### UserSubscription
- `id`: Subscription instance ID
- `userId`: User who has this subscription
- `packageId`: Which package
- `startDate`: When subscription started
- `endDate`: When it ended (if switched)
- `isActive`: Is it currently active

### Folder
- `id`: Folder ID
- `name`: Folder name
- `nesting_level`: Depth in hierarchy (1-based)
- `userId`: Owner
- `parentId`: Parent folder (null for root)

### File
- `id`: File ID
- `name`: File name
- `originalName`: Original uploaded name
- `size`: File size in bytes
- `path`: Storage path
- `fileType`: Image, Video, PDF, Audio
- `mimetype`: MIME type
- `userId`: Owner
- `folderId`: Contained folder

## Subscription Limits Enforcement

The system enforces subscription limits at every step:

1. **Folder Creation**
   - Checks `maxFolders` limit
   - Validates `maxNestingLevel` before creating subfolders

2. **File Upload**
   - Checks `allowedFileTypes`
   - Validates `maxFileSize`
   - Checks `totalFileLimit` per account
   - Checks `filesPerFolder` limit
   - All checked before upload proceeds

3. **Package Switching**
   - New limits apply immediately going forward
   - Existing data is preserved
   - Old subscription is marked as inactive

## Demo Workflow

1. **Admin Setup:**
   - Login with admin@zoomit.com / admin123
   - View default packages (Free, Silver, Gold, Diamond)
   - Edit packages or create custom ones

2. **User Workflow:**
   - Register at `/register`
   - Login at `/login`
   - Go to Dashboard → Packages
   - Select a subscription (e.g., Silver)
   - Go to Files & Folders tab
   - Create folders respecting nesting limits
   - Upload files respecting type/size limits

3. **Package Switching:**
   - Select a different package
   - New limits apply immediately
   - Existing files/folders are kept

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "error": "Folder limit reached for your subscription"
}
```

Validation errors provide details about why an action failed.

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Email verification for registration
- ✅ Password reset via email tokens
- ✅ Request validation on all endpoints
- ✅ File upload size limits
- ✅ CORS protection

## Development Notes

- All timestamps use UTC
- File uploads stored in `/uploads` directory
- Subscription enforcement happens at the service layer
- Email sending is optional and configured via SMTP
- Authentication tokens expire after 7 days

## Deployment Considerations

### Backend Production Setup
1. Use strong `JWT_SECRET`
2. Configure real SMTP server
3. Use production PostgreSQL instance
4. Set `NODE_ENV=production`
5. Configure upload directory with persistence
6. Use environment variables for all sensitive data

### Frontend Production Setup
1. Build: `npm run build`
2. Deploy Next.js to Vercel or similar
3. Set `NEXT_PUBLIC_API_URL` to production backend
4. Configure proper error handling

## Support & Contact

For issues or questions, check the implementation details in the source code.

## License

MIT License - Feel free to use and modify

---

**Deadline:** March 3, 2026, 11:59 PM ✅
