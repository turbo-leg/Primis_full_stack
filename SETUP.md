# College Prep Platform - Setup Instructions

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

## Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   ```bash
   copy .env.example .env
   # Edit .env file with your database and Redis configurations
   ```

5. **Initialize database:**

   ```bash
   alembic upgrade head
   ```

6. **Create first admin user (optional):**

   ```bash
   python scripts/create_admin.py
   ```

7. **Start the server:**

   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at: http://localhost:8000
   API Documentation: http://localhost:8000/docs

## Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   copy .env.example .env.local
   # Edit .env.local file with your API URL
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

   The application will be available at: http://localhost:3000

## Docker Setup (Alternative)

1. **Start all services:**

   ```bash
   docker-compose up -d
   ```

   This will start:

   - PostgreSQL database on port 5432
   - Redis on port 6379
   - Backend API on port 8000
   - Frontend on port 3000

## Database Migration

To create new migrations:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## Key Features Implemented

### ✅ Backend Features

- **FastAPI** with automatic OpenAPI documentation
- **JWT Authentication** with role-based access control
- **SQLAlchemy Models** matching your ER diagram
- **QR Code Generation** for student attendance
- **RESTful APIs** for courses, enrollment, and attendance
- **Database Migrations** with Alembic
- **CORS Configuration** for frontend integration

### ✅ Frontend Features

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for API data fetching
- **Authentication Flow** with JWT tokens
- **Responsive Design** for all devices

### 🚧 Features to Complete

- User dashboards (student, teacher, admin, parent)
- Calendar system with Mongolian timezone
- Payment tracking and revenue analytics
- Real-time chat system
- File upload for materials and assignments
- Email notifications
- Advanced reporting and analytics

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register/student` - Student registration
- `POST /api/v1/auth/register/teacher` - Teacher registration (admin only)
- `GET /api/v1/auth/me` - Get current user info

### Courses

- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course (admin only)
- `GET /api/v1/courses/{id}` - Get course details
- `POST /api/v1/courses/{id}/enroll` - Enroll in course

### Attendance

- `POST /api/v1/attendance/scan-qr` - Scan QR for attendance
- `GET /api/v1/attendance/student/{id}/stats` - Get attendance stats
- `POST /api/v1/attendance/generate-qr/{course_id}` - Generate attendance QR

## User Roles and Permissions

### Student

- View enrolled courses
- Submit assignments
- View grades and attendance
- Access course materials
- Scan QR codes for attendance

### Teacher

- Manage assigned courses
- Grade assignments
- Mark attendance
- Upload course materials
- View student progress

### Admin

- Full system access
- Manage users (students, teachers)
- Create and manage courses
- View revenue and analytics
- Generate reports

### Parent

- View child's progress
- Check attendance records
- Access grade reports
- Receive notifications

## Security Features

- **JWT Token Authentication**
- **Role-based Access Control**
- **Password Hashing** with bcrypt
- **CORS Protection**
- **Input Validation** with Pydantic
- **SQL Injection Protection** with SQLAlchemy

## Production Deployment

1. **Set production environment variables**
2. **Use production database** (PostgreSQL)
3. **Enable HTTPS** with SSL certificates
4. **Set up reverse proxy** (Nginx)
5. **Configure monitoring** and logging
6. **Set up backup strategy** for database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please create an issue in the project repository.
