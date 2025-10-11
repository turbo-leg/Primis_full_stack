import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import AuthRedirect from '@/components/AuthRedirect'
import { BookOpen, Users, Calendar, BarChart, GraduationCap, Clock, Award, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Auth Redirect */}
      <AuthRedirect />
      
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Prepare for Your
            <span className="text-blue-600"> College Journey</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for students, teachers, and parents to manage 
            courses, track attendance, monitor progress, and achieve academic success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="min-w-[200px]">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Success
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools designed for modern education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Course Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Organize courses, materials, and assignments in one place
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Student Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track progress, view grades, and access course materials
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Smart Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Schedule classes and events with Mongolian timezone support
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Monitor attendance, revenue, and performance metrics
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <section className="py-16 bg-white rounded-3xl my-16 shadow-lg">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Education Leaders</h3>
            <p className="text-lg text-gray-600">Join thousands of students and educators worldwide</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Expert Teachers</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">200+</div>
              <div className="text-gray-600">Available Courses</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get started with our platform in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                1
              </div>
              <h4 className="text-xl font-semibold mb-4">Create Your Account</h4>
              <p className="text-gray-600 leading-relaxed">
                Sign up as a student, teacher, or admin and complete your profile to get started on your learning journey.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                2
              </div>
              <h4 className="text-xl font-semibold mb-4">Explore Courses</h4>
              <p className="text-gray-600 leading-relaxed">
                Browse our comprehensive course catalog and enroll in subjects that match your academic goals and interests.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h4 className="text-xl font-semibold mb-4">Track Progress</h4>
              <p className="text-gray-600 leading-relaxed">
                Monitor your attendance, complete assignments, and track your academic progress with our advanced analytics.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* User Roles Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Multi-Role Access System</h3>
            <p className="text-lg text-gray-600">Tailored experiences for every user type</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-white h-6 w-6" />
                </div>
                <CardTitle className="text-blue-900">Students</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-blue-700">
                  Course access • Assignments • Attendance • Progress tracking
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="text-white h-6 w-6" />
                </div>
                <CardTitle className="text-green-900">Teachers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-green-700">
                  Course management • Grading • Attendance marking • Analytics
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="text-white h-6 w-6" />
                </div>
                <CardTitle className="text-purple-900">Admins</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-purple-700">
                  System management • Analytics • Revenue tracking • Reports
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-white h-6 w-6" />
                </div>
                <CardTitle className="text-orange-900">Parents</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-orange-700">
                  Progress monitoring • Attendance reports • Communication
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">
                College Prep Platform
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering students to achieve their academic goals
            </p>
            <p className="text-sm text-gray-500">
              © 2024 College Prep Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}