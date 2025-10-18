'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building, Users, FileText, Package, BarChart3, 
  Shield, Zap, Globe, ArrowRight, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: FileText,
      title: 'Quote Management',
      description: 'Create professional quotes with automatic pricing calculations and glass specifications.'
    },
    {
      icon: Package,
      title: 'Order Tracking',
      description: 'Track orders from creation to delivery with real-time status updates.'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain comprehensive customer profiles with transaction history.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get insights into your business performance with detailed analytics.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Control team access with admin, staff, and viewer roles.'
    },
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Streamline your processes with automated calculations and workflows.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Glass ERP</span>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register-owner">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete ERP Solution for
            <span className="text-blue-600 block">Glass Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your glass business operations with our comprehensive ERP system. 
            Manage quotes, orders, customers, and analytics all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register-owner">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Glass Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From quotes to delivery, manage every aspect of your glass business with our powerful ERP system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Glass ERP?
              </h2>
              <div className="space-y-4">
                {[
                  'Industry-specific features for glass businesses',
                  'Automated pricing calculations with wastage factors',
                  'Comprehensive customer and order management',
                  'Real-time analytics and reporting',
                  'Role-based access control for teams',
                  'Mobile-responsive design for on-the-go access'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-600 mb-6">
                  Join hundreds of glass businesses already using Glass ERP to streamline their operations.
                </p>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/register-owner">
                    Create Your Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Glass ERP</span>
              </div>
              <p className="text-gray-400">
                The complete ERP solution designed specifically for glass businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
                <li>Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Training</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Glass ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}