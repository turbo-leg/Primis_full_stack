'use client';

import { useTranslations } from 'next-intl';
import { Navigation } from '@/components/navigation';
import PrimisLogo from '@/components/PrimisLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Mail, Clock, Building } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white dark:bg-primis-navy">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-primis-navy dark:bg-primis-navy-dark text-white py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white mb-4 sm:mb-6 px-4">
              Contact Us
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed px-4">
              Get in touch with PRIMIS EDUCARE
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 dark:bg-primis-navy-light py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Information */}
            <div className="space-y-6 sm:space-y-8">
              <Card className="border-0 bg-white dark:bg-primis-navy dark:border dark:border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl font-serif font-light text-primis-navy dark:text-white">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Location */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primis-navy/5 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primis-navy dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-primis-navy dark:text-white mb-2">Location / Байршил</h3>
                      <p className="text-gray-600 dark:text-white/70 font-light leading-relaxed">
                        Sukhbaatar District, 1st Khoroo<br />
                        Soyombo Tower, Room 202<br />
                        Ulaanbaatar, Mongolia
                      </p>
                      <p className="text-gray-600 dark:text-white/70 font-light leading-relaxed mt-2">
                        СБД, 1-р хороо<br />
                        Соёмбо Таур 202 тоот<br />
                        Улаанбаатар, Монгол
                      </p>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primis-navy/5 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-primis-navy dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-primis-navy dark:text-white mb-2">Facilities / Тасалгаа</h3>
                      <p className="text-gray-600 dark:text-white/70 font-light">
                        3 Modern Classrooms<br />
                        Нийт 3 танхим
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primis-navy/5 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-primis-navy dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-primis-navy dark:text-white mb-2">Phone / Утас</h3>
                      <p className="text-gray-600 dark:text-white/70 font-light">
                        Coming soon / Тун удахгүй
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primis-navy/5 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primis-navy dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-primis-navy dark:text-white mb-2">Email / И-мэйл</h3>
                      <p className="text-gray-600 dark:text-white/70 font-light">
                        Coming soon / Тун удахгүй
                      </p>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primis-navy/5 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primis-navy dark:text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-primis-navy dark:text-white mb-2">Office Hours / Ажлын цаг</h3>
                      <p className="text-gray-600 dark:text-white/70 font-light leading-relaxed">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-0 bg-white dark:bg-primis-navy dark:border dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-serif font-light text-primis-navy dark:text-white">
                  Send Us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-light text-gray-700 dark:text-white/70 mb-2">
                      Name / Нэр
                    </label>
                    <Input
                      type="text"
                      id="name"
                      className="dark:bg-primis-navy-light dark:border-white/20 dark:text-white"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-light text-gray-700 dark:text-white/70 mb-2">
                      Email / И-мэйл
                    </label>
                    <Input
                      type="email"
                      id="email"
                      className="dark:bg-primis-navy-light dark:border-white/20 dark:text-white"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-light text-gray-700 dark:text-white/70 mb-2">
                      Phone / Утас
                    </label>
                    <Input
                      type="tel"
                      id="phone"
                      className="dark:bg-primis-navy-light dark:border-white/20 dark:text-white"
                      placeholder="+976 ..."
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-light text-gray-700 dark:text-white/70 mb-2">
                      Subject / Гарчиг
                    </label>
                    <Input
                      type="text"
                      id="subject"
                      className="dark:bg-primis-navy-light dark:border-white/20 dark:text-white"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-light text-gray-700 dark:text-white/70 mb-2">
                      Message / Мессеж
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-md focus:ring-2 focus:ring-primis-navy dark:bg-primis-navy-light dark:text-white"
                      placeholder="Tell us more about your inquiry..."
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primis-navy hover:bg-primis-navy/90 dark:bg-white dark:text-primis-navy dark:hover:bg-white/90 font-light"
                  >
                    Send Message / Илгээх
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white dark:bg-primis-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 bg-gray-50 dark:bg-primis-navy-light dark:border dark:border-white/10 shadow-xl overflow-hidden">
            <div className="aspect-video bg-gray-200 dark:bg-primis-navy/50 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 dark:text-white/40 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-white/50 font-light">
                  Map will be embedded here<br />
                  Газрын зураг энд харагдана
                </p>
              </div>
            </div>
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
