'use client';

import { useTranslations } from 'next-intl';
import { Navigation } from '@/components/navigation';
import PrimisLogo from '@/components/PrimisLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Award, Globe, GraduationCap, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white dark:bg-primis-navy">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-primis-navy dark:bg-primis-navy-dark text-white py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <PrimisLogo variant="light" size="lg" showTagline={false} />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white mb-4 sm:mb-6 px-4">
              About PRIMIS EDUCARE
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto font-light leading-relaxed px-4">
              Excellence in College Preparation Since 2021
            </p>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="bg-gray-50 dark:bg-primis-navy-light py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 bg-white dark:bg-primis-navy dark:border dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl font-serif font-light text-primis-navy dark:text-white text-center mb-4">
                  Our Mission / Танилцуулга
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg text-gray-600 dark:text-white/70 leading-relaxed font-light">
                  Since 2021, our organization has been supporting students who aspire to study at the world's top universities with scholarships. 
                  We provide comprehensive preparation to help students achieve their dreams of studying abroad.
                </p>
                <p className="text-base sm:text-lg text-gray-600 dark:text-white/70 leading-relaxed font-light">
                  Манай байгууллага 2021 оноос эхлэн гадаадын шилдэг их, дээд сургуулиудад элсэн орж, тэтгэлэгтэйгээр суралцах хүсэлтэй оюутнуудад дэмжлэг үзүүлж, 
                  тэднийг бүрэн бэлтгэдэг. Бид оюутнуудын сонгосон салбарт тохирсон сургалт, зөвлөмжүүдийг цогц байдлаар санал болгох бөгөөд гадаадад 
                  суралцах хүсэлтэй залууст хамгийн тохиромжтой шийдлүүдийг гаргаж өгдөг.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white dark:bg-primis-navy py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-primis-navy dark:text-white mb-3 sm:mb-4 px-4">
              Our Services / Үйлчилгээ
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-white/70 font-light px-4">
              Comprehensive programs designed for your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center border-0 bg-gray-50 dark:bg-primis-navy-light dark:border dark:border-white/10 hover:shadow-xl transition-all">
              <CardHeader className="pb-6">
                <div className="bg-primis-navy/5 dark:bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-primis-navy dark:text-white" />
                </div>
                <CardTitle className="text-xl font-serif text-primis-navy dark:text-white">
                  College Prep & Counseling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-white/60 font-light leading-relaxed">
                  Comprehensive support for studying at world-class universities with scholarships. We guide students through the entire application process, from school selection to securing admission.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-gray-50 dark:bg-primis-navy-light dark:border dark:border-white/10 hover:shadow-xl transition-all">
              <CardHeader className="pb-6">
                <div className="bg-primis-navy/5 dark:bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-primis-navy dark:text-white" />
                </div>
                <CardTitle className="text-xl font-serif text-primis-navy dark:text-white">
                  Test Preparation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-white/60 font-light leading-relaxed">
                  Expert preparation for IELTS, SAT, and HSK exams. Our experienced instructors provide comprehensive training in reading, writing, listening, and speaking skills.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-gray-50 dark:bg-primis-navy-light dark:border dark:border-white/10 hover:shadow-xl transition-all">
              <CardHeader className="pb-6">
                <div className="bg-primis-navy/5 dark:bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primis-navy dark:text-white" />
                </div>
                <CardTitle className="text-xl font-serif text-primis-navy dark:text-white">
                  Business Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-600 dark:text-white/60 font-light leading-relaxed">
                  Professional English and Chinese courses for business environments, including official correspondence, presentations, research analysis, and communication skills.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-primis-navy/5 dark:bg-primis-navy-dark py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-light text-primis-navy dark:text-white mb-4">
              Our Achievements / Амжилт
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/70 font-light">
              Proven track record of success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-primis-navy/5 dark:bg-white/10 p-4 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primis-navy dark:text-white" />
                </div>
              </div>
              <div className="text-5xl font-serif text-primis-navy dark:text-white mb-3">2,300+</div>
              <div className="text-gray-600 dark:text-white/60 font-light">Students Prepared</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-primis-navy/5 dark:bg-white/10 p-4 rounded-full">
                  <Award className="h-8 w-8 text-primis-navy dark:text-white" />
                </div>
              </div>
              <div className="text-5xl font-serif text-primis-navy dark:text-white mb-3">$150K-$460K</div>
              <div className="text-gray-600 dark:text-white/60 font-light">Scholarships per Student</div>
            </div>
          </div>
        </div>
      </div>

      {/* Universities Section */}
      <div className="bg-white dark:bg-primis-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-light text-primis-navy dark:text-white mb-4">
              Universities Our Students Attend
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/70 font-light">
              Top institutions worldwide
            </p>
          </div>

          <Card className="max-w-4xl mx-auto border-0 bg-gray-50 dark:bg-primis-navy-light dark:border dark:border-white/10 shadow-xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'University of Toronto',
                  'The University of British Columbia',
                  'New York University (NYU)',
                  'Tsinghua University',
                  'Waseda University',
                  'Stanford University',
                  'NYU Shanghai',
                  'McGill University',
                  'Duke Kunshan University'
                ].map((university) => (
                  <div key={university} className="flex items-center space-x-3 p-3 bg-white dark:bg-primis-navy/50 rounded-lg">
                    <div className="w-2 h-2 bg-primis-navy dark:bg-white rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-white/70 font-light">{university}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primis-navy dark:bg-primis-navy-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <PrimisLogo variant="light" size="sm" showTagline={true} />
            </div>
            <p className="text-white/70 mb-4 font-light">
              Excellence in College Preparation
            </p>
            <p className="text-sm text-white/50 font-light">
              © 2025 PRIMIS EDUCARE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
