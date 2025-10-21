# API Testing Guide - Assignment System

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned

## Starting the Application

### Option 1: Start All Services (Recommended)

```bash
cd college-prep-platform
docker-compose up
```

This will start:

- PostgreSQL database
- Redis cache
- FastAPI backend (with hot reload)
- Next.js frontend

Wait for the backend to initialize (you'll see "Uvicorn running on 0.0.0.0:8000")

### Option 2: Start Only Backend & Database

```bash
docker-compose up postgres redis backend
```

## API Documentation

Once the backend is running, access:

- **Swagger UI** (Interactive API docs): http://localhost:8000/docs
- **ReDoc** (API documentation): http://localhost:8000/redoc
- **API Health**: http://localhost:8000/health

## Testing Assignment System

### 1. Authentication

First, log in as a teacher or student to get a JWT token.

#### Login as Teacher

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "teacher123"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "user_id": 1,
    "email": "teacher@example.com",
    "user_type": "teacher"
  }
}
```

Copy the `access_token` for subsequent requests.

### 2. Teacher: Create Assignment

```bash
curl -X POST http://localhost:8000/api/teachers/assignments \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "title": "Math Homework - Chapter 5",
    "description": "Complete all exercises from Chapter 5",
    "due_date": "2025-10-26T23:59:59",
    "max_points": 100.0,
    "instructions": "Show all work for full credit"
  }'
```

Response:

```json
{
  "assignment_id": 1,
  "course_id": 1,
  "title": "Math Homework - Chapter 5",
  "description": "Complete all exercises from Chapter 5",
  "due_date": "2025-10-26T23:59:59",
  "max_points": 100.0,
  "instructions": "Show all work for full credit",
  "created_by_id": 1,
  "created_at": "2025-10-19T10:30:00",
  "course_title": "Mathematics 101",
  "submissions_count": 0
}
```

### 3. Student: Submit Assignment

#### Login as Student

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "student123"
  }'
```

#### Submit with Text Only

```bash
curl -X POST http://localhost:8000/api/students/assignments/1/submit \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'submission_text=My answer to the assignment...'
```

#### Submit with File

```bash
curl -X POST http://localhost:8000/api/students/assignments/1/submit \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -F "file=@/path/to/homework.pdf" \
  -F "submission_text=My homework answers"
```

Response:

```json
{
  "message": "Assignment submitted successfully",
  "submission_id": 1,
  "submitted_at": "2025-10-19T14:30:00"
}
```

### 4. Student: Get Own Submission

```bash
curl -X GET http://localhost:8000/api/students/assignments/1/submission \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

Response:

```json
{
  "submission_id": 1,
  "assignment_id": 1,
  "student_id": 5,
  "submission_text": "My answer to the assignment...",
  "file_url": "https://res.cloudinary.com/...",
  "submitted_at": "2025-10-19T14:30:00",
  "grade": null,
  "feedback": null,
  "graded_at": null,
  "assignment_title": "Math Homework - Chapter 5"
}
```

### 5. Teacher: Get All Submissions

```bash
curl -X GET http://localhost:8000/api/teachers/assignments/1/submissions \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

Response:

```json
[
  {
    "submission_id": 1,
    "assignment_id": 1,
    "student_id": 5,
    "student_name": "John Doe",
    "submission_text": "My answer to the assignment...",
    "file_url": "https://res.cloudinary.com/...",
    "submitted_at": "2025-10-19T14:30:00",
    "grade": null,
    "feedback": null,
    "graded_at": null,
    "assignment_title": "Math Homework - Chapter 5"
  }
]
```

### 6. Teacher: Grade Submission

```bash
curl -X PUT http://localhost:8000/api/teachers/assignments/1/submissions/1/grade \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 85.5,
    "feedback": "Great work! You showed all your work clearly."
  }'
```

Response:

```json
{
  "message": "Assignment graded successfully",
  "submission_id": 1,
  "grade": 85.5,
  "feedback": "Great work! You showed all your work clearly.",
  "graded_at": "2025-10-19T15:45:00"
}
```

### 7. Student: Get Graded Assignment

```bash
curl -X GET http://localhost:8000/api/students/assignments/1/submission \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

Response:

```json
{
  "submission_id": 1,
  "assignment_id": 1,
  "student_id": 5,
  "submission_text": "My answer to the assignment...",
  "file_url": "https://res.cloudinary.com/...",
  "submitted_at": "2025-10-19T14:30:00",
  "grade": 85.5,
  "feedback": "Great work! You showed all your work clearly.",
  "graded_at": "2025-10-19T15:45:00",
  "assignment_title": "Math Homework - Chapter 5"
}
```

## Using Swagger UI

The easiest way to test is using the interactive Swagger UI:

1. Open http://localhost:8000/docs
2. Click "Authorize" button
3. Select "HTTPBearer" and paste your JWT token
4. Try out endpoints directly from the browser

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Rebuild containers
docker-compose build --no-cache
docker-compose up
```

### File Upload Not Working

1. Verify Cloudinary credentials in backend/.env
2. Check if file size exceeds limits
3. See backend logs: `docker-compose logs backend`

## Sample Test Data

The system can be pre-populated with test data by running:

```bash
docker-compose exec backend python scripts/init_db.py
```

This creates:

- 2 Admin users
- 3 Teachers
- 10 Students
- 5 Courses with enrollments
- 3 Sample assignments

## Performance Testing

### Load Test Create Submissions

```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/students/assignments/1/submit \
    -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "submission_text=Submission $i" &
done
wait
```

### Monitor Backend Performance

```bash
docker stats backend
```

## Database Inspection

### Access PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d college_prep
```

### View Assignments

```sql
SELECT * FROM assignments;
```

### View Submissions

```sql
SELECT
  s.submission_id,
  s.student_id,
  a.title,
  s.grade,
  s.submitted_at
FROM assignment_submissions s
JOIN assignments a ON s.assignment_id = a.assignment_id;
```

## Environment Variables

Edit `backend/.env` for configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/college_prep

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256

# Environment
ENVIRONMENT=development
DEBUG=True
```

## Next Steps

After testing, proceed to frontend implementation:

1. Create assignment submission form component
2. Create assignment grading interface
3. Add file upload UI
4. Integrate with student dashboard
5. Integrate with teacher dashboard

---

**For questions or issues**, check backend logs:

```bash
docker-compose logs -f backend
```
