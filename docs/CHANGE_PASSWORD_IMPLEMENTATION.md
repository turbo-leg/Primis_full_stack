# Change Password Implementation Guide

## Overview

Complete implementation of the password change functionality with comprehensive error handling across frontend and backend.

## Backend Implementation

### API Endpoint

- **Route:** `POST /api/v1/auth/change-password`
- **File:** `backend/app/api/auth.py`
- **Authentication:** Required (Bearer token)

### Request Body

```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword123",
  "confirm_password": "newPassword123"
}
```

### Response

**Success (200 OK):**

```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Current password is incorrect
- `400 Bad Request`: New passwords do not match
- `400 Bad Request`: Password must be at least 8 characters long
- `400 Bad Request`: New password must be different from current password
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Database or system error

### Backend Validation Logic

1. ✅ Verify current password matches stored hash
2. ✅ Validate new password and confirmation match
3. ✅ Check password length (minimum 8 characters)
4. ✅ Prevent password reuse (new ≠ current)
5. ✅ Hash new password with bcrypt
6. ✅ Update database
7. ✅ Return success message

### Schema Addition

**File:** `backend/app/api/schemas.py`

```python
class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
```

## Frontend Implementation

### Settings Page

- **File:** `frontend/src/app/[locale]/dashboard/settings/page.tsx`
- **Route:** `/en/dashboard/settings` or `/mn/dashboard/settings`
- **Accessible to:** All authenticated users (student, teacher, admin, parent)

### Security Section Features

1. **Current Password Input**

   - Type: password
   - Placeholder: "Enter your current password"
   - Required: true

2. **New Password Input**

   - Type: password (with show/hide toggle)
   - Placeholder: "Enter new password (min 8 characters)"
   - Show/hide Eye icon button
   - Required: true

3. **Confirm Password Input**

   - Type: password
   - Placeholder: "Confirm your new password"
   - Required: true

4. **Change Password Button**
   - Shows "Change Password" normally
   - Shows "Updating..." during submission
   - Disabled during submission

### Client-Side Validation

```typescript
// Validation checks before API call:
1. Passwords must match (newPassword === confirmPassword)
2. Password length must be >= 8 characters
3. New password must differ from current (currentPassword !== newPassword)
```

### Error Handling

Comprehensive error extraction from multiple error response formats:

```typescript
// Priority order for error messages:
1. error?.response?.data?.detail (FastAPI standard)
2. error?.response?.data?.message (Custom message field)
3. error?.response?.data?.error (Error field)
4. error?.message (Axios error message)
5. "Failed to change password" (Fallback)
```

### Success Handling

- Display success message with green checkmark icon
- Reset all form fields to empty
- Auto-clear message after 3 seconds
- No page reload required

### API Integration

- **Endpoint:** `/api/v1/auth/change-password`
- **Method:** POST
- **Auth:** Automatic Bearer token injection via axios interceptor
- **Error Handling:** Catches and displays user-friendly messages
- **Logging:** Console.error() for debugging

## Navigation Integration

### Desktop View (≥768px)

Settings appears in main menu for all user types:

- **Student:** Dashboard → Courses → Assignments → Attendance → Grades → **Settings**
- **Teacher:** Dashboard → Courses → Students → Mark Attendance → Grade Assignments → Analytics → **Settings**
- **Admin:** Dashboard → Courses → User Management → Analytics → Reports → **Settings**
- **Parent:** Dashboard → Courses → **Settings**

### Mobile View (<768px)

Access via hamburger menu sidebar:

1. Tap hamburger menu button (top right)
2. Scroll down to "Settings"
3. Tap "Settings" option
4. Sidebar automatically closes
5. Taken to settings page

## Testing Guide

### Manual Testing Steps

#### 1. Access Settings Page

1. Log in to the application
2. Desktop: Click "Settings" in main navigation menu
3. Mobile: Tap hamburger menu → tap "Settings"

#### 2. Test Change Password Form

Navigate to "Security" section on settings page

#### 3. Test Case 1: Successful Password Change

**Input:**

- Current Password: [your current password]
- New Password: `TestPass123`
- Confirm Password: `TestPass123`

**Expected:**

- ✅ Success message: "Password changed successfully"
- ✅ Form clears (all fields empty)
- ✅ Message disappears after 3 seconds
- ✅ User can login with new password

#### 4. Test Case 2: Passwords Don't Match

**Input:**

- Current Password: [correct password]
- New Password: `TestPass123`
- Confirm Password: `DifferentPass123`

**Expected:**

- ❌ Error: "Passwords do not match"
- ❌ Form remains populated
- ❌ API not called

#### 5. Test Case 3: Password Too Short

**Input:**

- Current Password: [correct password]
- New Password: `short1`
- Confirm Password: `short1`

**Expected:**

- ❌ Error: "Password must be at least 8 characters"
- ❌ Form remains populated
- ❌ API not called

#### 6. Test Case 4: Same as Current Password

**Input:**

- Current Password: [current password]
- New Password: [same as current]
- Confirm Password: [same as current]

**Expected:**

- ❌ Error: "New password must be different from current password"
- ❌ Form remains populated
- ❌ API not called (client-side check)

#### 7. Test Case 5: Wrong Current Password

**Input:**

- Current Password: `WrongPassword123`
- New Password: `TestPass456`
- Confirm Password: `TestPass456`

**Expected:**

- ❌ Error: "Current password is incorrect"
- ❌ Form remains populated
- ✅ Button shows "Updating..." during request
- ❌ No password changed

#### 8. Test Case 6: Show/Hide Password

1. Click the Eye icon next to "New Password" field
2. Password should become visible (type changes to "text")
3. Click Eye icon again
4. Password should be hidden (type changes to "password")

### cURL Testing (Backend Direct)

```bash
# Get auth token first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "currentpassword",
    "user_type": "student"
  }'

# Use token from response as $TOKEN

# Change password
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "currentpassword",
    "new_password": "newpassword123",
    "confirm_password": "newpassword123"
  }'
```

## File Changes Summary

### Backend Files Modified

1. **`backend/app/api/auth.py`**

   - Added `ChangePassword` schema import
   - Added `change_password()` endpoint function
   - Comprehensive validation logic
   - Error handling with specific messages

2. **`backend/app/api/schemas.py`**
   - Added `ChangePassword` Pydantic model
   - Fields: current_password, new_password, confirm_password

### Frontend Files Modified

1. **`frontend/src/app/[locale]/dashboard/settings/page.tsx`**

   - Updated imports to include `apiClient`
   - Enhanced `handlePasswordChange()` function
   - Comprehensive error handling
   - Better error message extraction

2. **`frontend/src/lib/api.ts`**

   - Improved error handling in response interceptor
   - Enhanced `post()` method with error propagation
   - Comments explaining error flow

3. **`frontend/src/components/navigation.tsx`**
   - Added "Settings" menu item for all user types
   - Settings appears at end of role-specific menus

## Error Handling Flow

### Frontend Error Flow

```
User submits form
    ↓
Client-side validation
    ↓ (if fails)
Display error immediately
    ↓ (if passes)
Call API with axios
    ↓ (if error)
Catch error from interceptor
    ↓
Extract error message from response
    ↓
Display error message
    ↓
Keep form populated for retry
```

### Backend Error Flow

```
Receive change-password request
    ↓
Check authentication (get_current_user)
    ↓ (if unauthorized)
Return 401 Unauthorized
    ↓ (if authorized)
Verify current password
    ↓ (if incorrect)
Raise 400 "Current password is incorrect"
    ↓ (if correct)
Validate new passwords match
    ↓ (if not match)
Raise 400 "New passwords do not match"
    ↓ (if match)
Validate password length
    ↓ (if too short)
Raise 400 "Password must be at least 8 characters long"
    ↓ (if valid length)
Validate different from current
    ↓ (if same)
Raise 400 "New password must be different from current password"
    ↓ (if different)
Hash new password
    ↓
Update user in database
    ↓
Commit transaction
    ↓
Return 200 "Password changed successfully"
```

## Security Considerations

1. **Password Hashing:** Uses bcrypt (industry standard)
2. **Current Password Verification:** Required to prevent unauthorized changes
3. **Token Authentication:** Requires valid JWT token
4. **HTTPS:** Should be used in production
5. **Password Requirements:** Minimum 8 characters enforced
6. **No Password Reuse:** Prevents immediately resetting to same password
7. **Error Messages:** Generic enough to not reveal if password exists

## Known Limitations

1. **Password History:** Not implemented (can add in future)
2. **Email Notification:** Not sent after password change (can add)
3. **Session Invalidation:** User remains logged in after change
4. **Rate Limiting:** Not implemented (recommended for production)
5. **Force Password Change:** Not implemented for first-time users

## Future Enhancements

1. Send email confirmation after password change
2. Implement password history to prevent reuse
3. Add password strength meter
4. Send notification to other devices about password change
5. Add 2FA/MFA support
6. Implement rate limiting per IP
7. Add password change required on first login
8. Implement password expiration policies

## Deployment Notes

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:password@host:5432/db
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Database Migration

```bash
# Run alembic migrations (automatically runs on backend startup)
alembic upgrade head
```

### Security Headers (nginx/server)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## Troubleshooting

### "Current password is incorrect" even with correct password

- ✓ Verify password was typed correctly (case-sensitive)
- ✓ Check user is logged in as the correct user
- ✓ Verify auth token is valid and not expired
- ✓ Check database connection

### "Failed to change password" with no specific error

- ✓ Check API endpoint is accessible
- ✓ Verify Bearer token in Authorization header
- ✓ Check backend logs for database errors
- ✓ Ensure database connection is working

### Form not clearing after successful change

- ✓ Check browser console for JavaScript errors
- ✓ Verify success message appears (green checkmark)
- ✓ Form data might be persisted by browser cache - clear and reload

### Cannot access Settings page

- ✓ Verify user is authenticated
- ✓ Check navigation menu shows "Settings" option
- ✓ Verify route exists: `/[locale]/dashboard/settings`
- ✓ Check user type is one of: student, teacher, admin, parent

## Support

For issues or questions:

1. Check browser console (F12) for error messages
2. Check backend logs for API errors
3. Review this documentation
4. Check git commit history for changes
