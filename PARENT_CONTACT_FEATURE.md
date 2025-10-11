# Parent Contact & Monthly Attendance Report Features

## Overview

This document outlines the implementation of two key features: parent contact information in student registration and monthly attendance reports.

## 1. Parent Contact Information

### Backend Changes

#### Database Schema

- Added two new required fields to `students` table:
  - `parent_email` (VARCHAR(255), NOT NULL)
  - `parent_phone` (VARCHAR(20), NOT NULL)

#### API Updates

- **Models** (`backend/app/models/models.py`):
  - Updated `Student` model with parent contact columns
- **Schemas** (`backend/app/api/schemas.py`):

  - `StudentCreate`: Added required `parent_email` and `parent_phone` fields
  - `StudentResponse`: Includes parent contact in responses

- **Registration Endpoint** (`backend/app/api/auth.py`):

  - `/api/v1/auth/register/student` now requires and stores parent contact info

- **Seed Data** (`backend/scripts/init_db.py`):
  - Demo students have parent contact information:
    - Student 1 (Jane Doe): parent@demo.com / 1234567893
    - Student 2 (Bob Wilson): guardian@demo.com / 1234567895

### Frontend Changes

#### Registration Form (`frontend/src/app/register/page.tsx`)

- Added conditional parent contact section that appears only when "Student" user type is selected
- Two new required fields for students:
  - **Parent/Guardian Email** (required, validated email format)
  - **Parent/Guardian Phone** (required, phone format)
- Form validation ensures parent fields are filled when registering as a student
- Visual separation with a border and section header for parent information

#### Type Definitions (`frontend/src/types/index.ts`)

- Updated `RegisterData` interface to include:
  - `parent_email?: string`
  - `parent_phone?: string`

#### Features

- ✅ Dynamic form: parent fields only show for student registration
- ✅ Required field validation with error messages
- ✅ Proper icons (Mail and Phone) for visual clarity
- ✅ Red asterisk (\*) to indicate required fields
- ✅ Seamless integration with existing registration flow

## 2. Monthly Attendance Report

### Backend Implementation

#### New API Endpoint

- **Route**: `GET /api/v1/attendance/student/{student_id}/monthly-report`
- **Query Parameters**:
  - `year` (optional): Defaults to current year
  - `month` (optional): Defaults to current month

#### Response Structure

```json
{
  "student_id": 1,
  "student_name": "Jane Doe",
  "parent_email": "parent@demo.com",
  "parent_phone": "1234567893",
  "year": 2024,
  "month": 10,
  "overall_stats": {
    "total_classes": 15,
    "present": 13,
    "absent": 1,
    "late": 1,
    "excused": 0,
    "attendance_percentage": 86.67
  },
  "by_course": [
    {
      "course_id": 1,
      "course_title": "Advanced Mathematics",
      "total_classes": 8,
      "present": 7,
      "absent": 1,
      "late": 0,
      "excused": 0,
      "attendance_percentage": 87.5,
      "records": [
        {
          "date": "2024-10-01T10:00:00",
          "status": "present",
          "notes": null
        }
      ]
    }
  ]
}
```

#### Authorization

- Students can view their own reports
- Teachers and admins can view any student's report
- Parents will be able to view their children's reports

### Frontend Implementation

#### New Component (`frontend/src/components/MonthlyAttendanceReport.tsx`)

Features:

- **Month/Year Selector**: Dropdown menus to navigate historical data
- **Overall Statistics Cards**:
  - Total Classes (gray)
  - Present Count (green)
  - Absent Count (red)
  - Late Count (yellow)
  - Attendance Percentage (blue)
- **Per-Course Breakdown**:
  - Course title and statistics
  - Color-coded badges for different statuses
  - Detailed attendance records with dates
  - Individual status indicators
- **Parent Contact Display**: Shows parent email and phone for reference
- **Responsive Design**: Grid layout adapts to screen size

#### Dashboard Integration

##### Student Dashboard (`frontend/src/app/dashboard/student/page.tsx`)

- Added tab navigation: "Overview" and "Monthly Attendance Report"
- Clicking "Monthly Attendance Report" tab displays the full report
- Seamless transition between dashboard views

##### Parent Dashboard (`frontend/src/app/dashboard/parent/page.tsx`)

- Similar tab structure with child selector
- Parents can view monthly reports for each of their children
- Shows parent contact info from student records

#### API Client (`frontend/src/lib/api.ts`)

- New method: `getMonthlyAttendanceReport(studentId, year?, month?)`
- Returns typed monthly report data

## Testing

### Backend Testing

```powershell
# Login as student
$token = (Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"student@demo.com","password":"password123"}').access_token

# Get current month's report
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/attendance/student/1/monthly-report" -Method GET -Headers @{Authorization="Bearer $token"}

# Get specific month
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/attendance/student/1/monthly-report?year=2024&month=10" -Method GET -Headers @{Authorization="Bearer $token"}
```

### Frontend Testing

1. Navigate to registration page
2. Select "Student" user type
3. Verify parent contact fields appear
4. Try submitting without parent info (should fail validation)
5. Fill in all fields including parent contact
6. Complete registration

For attendance reports:

1. Login as student
2. Navigate to "Monthly Attendance Report" tab
3. Select different months/years using dropdowns
4. Verify data displays correctly with color-coded status

## Database Migration

The parent contact fields were added via direct SQL:

```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20);

UPDATE students SET parent_email = 'parent@demo.com', parent_phone = '1234567893'
WHERE email = 'student@demo.com';
```

## Future Enhancements

### Potential Improvements

1. **Email Notifications**: Send monthly reports to parent emails automatically
2. **PDF Export**: Allow downloading reports as PDF
3. **Attendance Trends**: Add graphs showing attendance over time
4. **Multi-Child Support**: Enhanced parent view for multiple children
5. **SMS Notifications**: Send attendance alerts via parent phone
6. **Threshold Alerts**: Notify when attendance drops below certain percentage
7. **Comparison View**: Compare student attendance with class average

## Dependencies

- No new dependencies required
- Uses existing FastAPI, SQLAlchemy, React, and Tailwind CSS setup

## Security Considerations

- Parent email/phone validation on both frontend and backend
- Authorization checks ensure only authorized users access reports
- CORS properly configured for cross-origin requests
- Parent contact data stored securely in database

## Deployment Notes

- Backend restart required after schema changes
- Frontend will automatically pick up new features on next build
- Database migration applied via SQL (consider creating proper Alembic migration for production)
