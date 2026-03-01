# Testing Guide - Zoomit SaaS File Management System

This guide walks through testing all features of the Zoomit system.

## Prerequisites
- Both backend and frontend running
- Database seeded with default data
- All services accessible

## Test Scenarios

### 1. Admin Panel Testing

#### Test 1.1: Admin Login
1. Go to `http://localhost:3000/admin/login`
2. Enter credentials:
   - Email: `admin@zoomit.com`
   - Password: `admin123`
3. ✅ Should redirect to `/admin/dashboard`

#### Test 1.2: View Default Packages
1. On admin dashboard, go to "Subscription Packages" tab
2. Should see 4 default packages:
   - Free
   - Silver
   - Gold
   - Diamond
3. Each showing:
   - Name and description
   - Price
   - All limits
   - File types allowed

#### Test 1.3: Create Custom Package
1. Click "+ New Package"
2. Fill form:
   - Name: "Basic"
   - Description: "Test package"
   - Max Folders: 5
   - Nesting Level: 2
   - File Types: Check "Image" and "PDF"
   - Max File Size: 10
   - Total Files: 20
   - Files/Folder: 5
   - Price: 4.99
3. Click "Create Package"
4. ✅ Should appear in list immediately

#### Test 1.4: Edit Package
1. Click "Edit" on any package
2. Change values (e.g., maxFolders to 15)
3. Click "Update Package"
4. ✅ Should see updated values

#### Test 1.5: Delete Package
1. Click "Delete" on test package
2. Confirm deletion
3. ✅ Package should disappear from list

#### Test 1.6: Admin Logout
1. Click "Logout" button
2. ✅ Should redirect to `/login`

---

### 2. User Registration & Authentication Testing

#### Test 2.1: User Registration
1. Go to `http://localhost:3000/register`
2. Fill form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: SecurePassword123
   - Confirm Password: SecurePassword123
3. Click "Register"
4. ✅ Should show success message
5. Should redirect to login after 2 seconds

#### Test 2.2: Invalid Password
1. Try to register with:
   - Email: test@example.com
   - Password: weak
2. ✅ Should show error: "Password must be at least 8 characters..."

#### Test 2.3: Existing Email
1. Try to register with admin email: admin@zoomit.com
2. ✅ Should show error: "User already exists"

#### Test 2.4: Email Verification
1. After registration, user should receive email (check logs in dev mode)
2. ✅ Email verification token should be displayed in console

#### Test 2.5: User Login
1. Go to `http://localhost:3000/login`
2. Enter credentials from Test 2.1:
   - Email: john@example.com
   - Password: SecurePassword123
3. Click "Login"
4. ✅ Should redirect to `/dashboard`

#### Test 2.6: Invalid Credentials
1. Try logging in with:
   - Email: john@example.com
   - Password: WrongPassword
2. ✅ Should show error: "Invalid email or password"

#### Test 2.7: Demo Credentials Display
1. On login page, scroll down
2. ✅ Should see demo credentials box

---

### 3. Subscription Management Testing

#### Test 3.1: View Current Subscription
1. Login as user (from Test 2.5)
2. Go to Dashboard tab
3. ✅ Area showing "No subscription selected" (if none assigned)

#### Test 3.2: Browse Available Packages
1. Click "Packages" tab
2. ✅ Should see all admin-created packages in grid
3. Each showing all details and "Select Plan" button

#### Test 3.3: Select Package
1. In Packages tab, click "Select Plan" on any package
2. ✅ Package details should appear in Dashboard tab
3. ✅ Button should change to "Current Plan"

#### Test 3.4: Package Details Verification
1. After selecting "Silver" package, verify shown:
   - Max Folders: 10
   - Max Nesting Level: 3
   - Allowed File Types: Image, Video, PDF, Audio
   - Max File Size: 50MB
   - Total File Limit: 100
   - Files Per Folder: 25

#### Test 3.5: Switch Package
1. Select different package (e.g., Gold)
2. ✅ Details should update immediately
3. ✅ Silver package now shows "Select Plan"
4. Click "Packages" tab → "Gold" now shows "Current Plan"

#### Test 3.6: View Subscription History
1. Under "Files & Folders" (or create separate history endpoint call)
2. ✅ Should see all subscription changes with dates:
   - Free plan - active date
   - Silver plan - Active date to X date
   - Gold plan - Active date

---

### 4. File & Folder Management Testing

#### Test 4.1: Create Root Folder
1. Go to "Files & Folders" tab
2. Enter "Documents" in folder name field
3. Click "Create Folder"
4. ✅ "Documents" folder appears in grid

#### Test 4.2: Folder Limit Enforcement
1. Create folders until reaching package max (10 for Silver)
2. Try to create 11th folder
3. ✅ Should show error: "Folder limit reached"
4. Cannot create more folders

#### Test 4.3: Create Subfolder
1. Click on "Documents" folder
2. You're now inside "Documents"
3. Enter "Work" in folder name
4. Click "Create Folder"
5. ✅ "Work" appears as subfolder
6. Breadcrumb shows: "Back" button and "📁 Documents"

#### Test 4.4: Nesting Level Enforcement
1. Create nested folders to approach maxNestingLevel (3 for Silver)
2. Try to create level 4 subfolder
3. ✅ Should show error: "Nesting level exceeds maximum"

#### Test 4.5: Navigate Folder Hierarchy
1. Have folder structure: Documents > Work > Projects
2. Click on folder to enter
3. ✅ Breadcrumb updates
4. Click "Back" button
5. ✅ Returns to parent folder

#### Test 4.6: Delete Folder
1. Click on folder with no contents
2. (Add delete button and test)
3. ✅ Folder disappears

#### Test 4.7: Rename Folder
1. (Add rename functionality)
2. Change folder name
3. ✅ Updated name appears

---

### 5. File Upload Testing

#### Test 5.1: Upload Valid File
1. Select a JPEG image
2. Go to folder
3. (Add upload button)
4. Select file from "Documents" folder
5. ✅ File appears in listing with size

#### Test 5.2: File Type Restriction
1. Try uploading .exe file
2. ✅ Should show error: "File type not allowed. Allowed types: Image, Video, PDF, Audio"
3. File not added

#### Test 5.3: File Size Limit
1. For Silver plan (50MB max):
2. Try uploading 100MB file
3. ✅ Should show error: "File size exceeds maximum of 50MB"

#### Test 5.4: Total File Limit
1. Upload files until totalFileLimit (100 for Silver)
2. Try to upload 101st file
3. ✅ Should show error: "Total file limit (100) reached"

#### Test 5.5: Files Per Folder Limit
1. Upload files to one folder until filesPerFolder limit (25 for Silver)
2. Try to upload 26th file to same folder
3. ✅ Should show error: "Folder file limit (25) reached"
4. Should be able to upload to different folder

#### Test 5.6: File Operations
1. Upload file
2. ✅ File appears in listing with:
   - Name
   - Size (in MB)
   - Upload date

#### Test 5.7: Rename File
1. (Add rename functionality to UI)
2. Change file name
3. ✅ Updated name appears

#### Test 5.8: Delete File
1. (Add delete functionality)
2. Delete file
3. ✅ File disappears
4. Count decreases (can now upload more if limit reached)

---

### 6. Subscription Enforcement Across Package Changes

#### Test 6.1: Upgrade Plan Increases Limits
1. On "Free" plan (5MB max file size)
2. Try uploading 10MB file
3. ✅ Error shown
4. Upgrade to "Silver" (50MB max)
5. Try uploading same 10MB file
6. ✅ Should succeed

#### Test 6.2: Downgrade Plan Maintains Data
1. On "Gold" plan with many files/folders
2. Switch to "Silver" plan
3. ✅ All existing files/folders preserved
4. New uploads follow Silver limits

#### Test 6.3: New Limits Apply Forward Only
1. On Silver: create 50 folders (exceeds Silver max of 10)
2. Switch to Free (max 3 folders)
3. ✅ Can still see and access all 50 folders
4. Cannot create new folder (limit is 3)

---

### 7. Error Handling Testing

#### Test 7.1: No Package Selected
1. Clear browser localStorage (or logout/login)
2. Go to "Files & Folders"
3. Try to create folder without subscription
4. ✅ Should show: "No subscription package assigned. Please select a package first."

#### Test 7.2: Validation Error Messages
1. Try various invalid actions
2. All should show clear, specific error messages
3. No cryptic technical errors shown

#### Test 7.3: Unauthorized Access
1. Get JWT token from one user
2. Try to access another user's files
3. ✅ Should fail or show only own files

---

### 8. UI/UX Testing

#### Test 8.1: Responsive Design
1. Test on desktop (1920px)
2. ✅ Layout should be clean and organized
3. Test on tablet (768px)
4. ✅ Should adapt reasonably
5. Test on mobile (375px)
6. ✅ Should be usable

#### Test 8.2: Loading States
1. Watch for loading indicators when:
   - Logging in
   - Creating folders
   - Uploading files
   - Switching packages

#### Test 8.3: Error Message Display
1. All errors should:
   - ✅ Be visible and readable
   - ✅ Appear in red boxes
   - ✅ Have clear messaging
   - ✅ Not block the UI

#### Test 8.4: Success Confirmations
1. After successful actions:
   - ✅ Show confirmation message or alert
   - ✅ UI updates reflect the change
   - ✅ Loading state clears

---

### 9. Database Testing

#### Test 9.1: Query Database Directly
```sql
-- Check users
SELECT id, email, "emailVerified", "currentSubscriptionId" FROM users;

-- Check subscriptions
SELECT * FROM user_subscriptions;

-- Check folders
SELECT id, name, nesting_level, "userId" FROM folders;

-- Check files
SELECT id, name, size, "fileType" FROM files;
```

#### Test 9.2: Verify Relationships
1. User has currentSubscriptionId pointing to active subscription
2. UserSubscription has valid userId and packageId
3. Folders have valid userId and parentId (if subfolder)
4. Files have valid userId and folderId

---

### 10. Performance Testing

#### Test 10.1: Large Folder Count
1. Create 100+ folders
2. ✅ Page should still load in reasonable time
3. List should be scrollable

#### Test 10.2: Many Files in Folder
1. Upload 50+ files to one folder
2. ✅ Listing should load quickly
3. UI should remain responsive

#### Test 10.3: API Response Times
1. Monitor network requests
2. Typical response times should be <500ms
3. File uploads should show progress

---

### 11. Edge Cases

#### Test 11.1: Exactly At Limit
1. For Silver: create exactly 10 folders
2. ✅ Should succeed
3. 11th folder should fail

#### Test 11.2: Delete to Make Room
1. At file limit
2. Delete 1 file
3. ✅ Should be able to upload new file

#### Test 11.3: Empty Folder Deletion
1. Create empty folder
2. Delete it
3. ✅ Should succeed without warning

#### Test 11.4: Delete Folder With Contents
1. Create folder with files
2. Try to delete folder  (check if requires confirmation)
3. ✅ Should delete all contents

#### Test 11.5: Special Characters in Names
1. Create folder: "Test_Folder-2024"
2. ✅ Should work
3. Create file: "Document (1).pdf"
4. ✅ Should work

---

## Checklist Summary

### Admin Features
- [ ] Admin login with correct credentials
- [ ] View all subscription packages
- [ ] Create new package
- [ ] Edit existing package
- [ ] Delete package
- [ ] Admin logout

### User Auth
- [ ] Register with valid data
- [ ] Registration validates password strength
- [ ] Registration rejects existing email
- [ ] Login with correct credentials
- [ ] Login rejects invalid password
- [ ] User logout

### Subscriptions
- [ ] View current subscription
- [ ] Browse all packages
- [ ] Select package
- [ ] Switch between packages
- [ ] View subscription history
- [ ] Limits update when package changes

### File Management
- [ ] Create root folder
- [ ] Create subfolder
- [ ] Navigate folder structure
- [ ] Folder limit enforcement
- [ ] Nesting level enforcement
- [ ] Delete folder
- [ ] Rename folder

### File Operations
- [ ] Upload valid file type
- [ ] File type restriction enforced
- [ ] File size limit enforced
- [ ] Total file limit enforced
- [ ] Per-folder file limit enforced
- [ ] Delete file
- [ ] Rename file
- [ ] File appears in correct folder

### Error Handling
- [ ] Clear error messages
- [ ] Validation errors shown before action
- [ ] Unauthorized access prevented
- [ ] No sensitive data in errors

### UI/UX
- [ ] Responsive design
- [ ] Loading indicators shown
- [ ] Success confirmations given
- [ ] Error messages formatted clearly
- [ ] Navigation is intuitive

---

## Testing Commands

### Reset Database
```bash
cd backend
npm run prisma:migrate reset
npm run prisma:seed
```

### Check API Directly
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123","firstName":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zoomit.com","password":"admin123"}'

# Get current subscription (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/user/subscriptions/current
```

---

## Reporting Issues

When testing, if something fails:
1. Check backend console for errors
2. Check browser console for errors
3. Check database for expected data
4. Verify environment variables are set
5. Ensure both servers are running

---

**Happy Testing! 🧪**
