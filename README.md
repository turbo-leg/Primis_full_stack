# College Prep Platform

A comprehensive college preparation platform with student management, course delivery, and administrative tools.

## Features

- **Multi-role dashboards**: Student, Teacher, Admin, and Parent dashboards
- **Course Management**: Online courses with materials, assignments, and announcements
- **QR Code Attendance**: Students scan QR codes for attendance tracking
- **Payment System**: Course enrollment with payment tracking and revenue analytics
- **Calendar Integration**: Mongolian timezone support for scheduling
- **Real-time Communication**: Class chat and announcements

## Tech Stack

### Backend

- **Python 3.11+** with FastAPI
- **PostgreSQL** database
- **SQLAlchemy** ORM with Alembic migrations
- **JWT Authentication** with role-based access control
- **Redis** for caching and sessions
- **Celery** for background tasks

### Frontend

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for API data fetching
- **Socket.io** for real-time features

## Project Structure

```
college-prep-platform/
├── backend/                # Python FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core configurations
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── alembic/           # Database migrations
│   └── tests/             # Backend tests
├── frontend/              # Next.js TypeScript frontend
└── docker-compose.yml     # Development environment
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Development Workflow

1. Database changes: Create Alembic migrations
2. API changes: Update OpenAPI documentation
3. Frontend changes: Ensure TypeScript types are updated
4. Testing: Run both backend and frontend tests before deployment

## Deployment

Production deployment uses Docker containers with proper environment configurations for scalability and maintainability.
