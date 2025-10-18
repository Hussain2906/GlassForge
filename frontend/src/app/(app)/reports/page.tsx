'use client';

import { useState } from 'react';
import Topbar from '@/components/Topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  Eye
} from 'lucide-react';

const reportCategories = [
  {
    id: 'sales',
    title: 'Sales Reports',
    icon: DollarSign,
    reports: [
      { name: 'Sales Summary', description: 'Overall sales performance', status: 'available' },
      { name: 'Monthly Sales', description: 'Month-wise sales breakdown', status: 'available' },
      { name: 'Product Performance', description: 'Best and worst performing products', status: 'available' },
      { name: 'Customer Analysis', description: 'Customer purchase patterns', status: 'coming-soon' },
    ]
  },
  {
    id: 'orders',
    title: 'Order Reports',
    icon: ShoppingCart,
    reports: [
      { name: 'Order Status', description: 'Current order pipeline', status: 'available' },
      { name: 'Delivery Performance', description: 'On-time delivery metrics', status: 'available' },
      { name: 'Order Trends', description: 'Order volume trends', status: 'coming-soon' },
    ]
  },
  {
    id: 'quotes',
    title: 'Quote Reports',
    icon: FileText,
    reports: [
      { name: 'Quote Conversion', description: 'Quote to order conversion rates', status: 'available' },
      { name: 'Quote Analysis', description: 'Quote success patterns', status: 'coming-soon' },
      { name: 'Pricing Trends', description: 'Pricing analysis over time', status: 'coming-soon' },
    ]
  },
  {
    id: 'customers',
    title: 'Customer Reports',
    icon: Users,
    reports: [
      { name: 'Customer List', description: 'Complete customer database', status: 'available' },
      { name: 'Customer Activity', description: 'Customer engagement metrics', status: 'coming-soon' },
      { name: 'Customer Lifetime Value', description: 'CLV analysis', status: 'coming-soon' },
    ]
  },
  {
    id: 'financial',
    title: 'Financial Reports',
    icon: TrendingUp,
    reports: [
      { name: 'Revenue Summary', description: 'Revenue breakdown and trends', status: 'available' },
      { name: 'Profit Analysis', description: 'Profit margins and analysis', status: 'coming-soon' },
      { name: 'Tax Reports', description: 'Tax calculations and summaries', status: 'coming-soon' },
    ]
  },
];

const quickStats = [
  { title: 'Total Reports', value: '15', change: '+2', icon: BarChart3 },
  { title: 'Generated This Month', value: '47', change: '+12%', icon: FileText },
  { title: 'Scheduled Reports', value: '8', change: '+3', icon: Calendar },
  { title: 'Data Sources', value: '5', change: '0', icon: TrendingUp },
];

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('sales');
  const [dateRange, setDateRange] = useState('last-30-days');

  const generateReport = (reportName: string) => {
    // Mock report generation
    console.log(`Generating report: ${reportName}`);
    // In a real app, this would trigger report generation
  };

  const downloadReport = (reportName: string) => {
    // Mock report download
    console.log(`Downloading report: ${reportName}`);
    // In a real app, this would download the report
  };

  return (
    <div>
      <Topbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate insights and reports for your glass business
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="last-90-days">Last 90 days</SelectItem>
                <SelectItem value="last-year">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reports Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {reportCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.reports.map((report) => (
                  <Card key={report.name} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <Badge 
                          variant={report.status === 'available' ? 'default' : 'secondary'}
                        >
                          {report.status === 'available' ? 'Available' : 'Coming Soon'}
                        </Badge>
                      </div>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          disabled={report.status !== 'available'}
                          onClick={() => generateReport(report.name)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={report.status !== 'available'}
                          onClick={() => downloadReport(report.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Your recently generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Sales Summary - December 2024', date: '2 hours ago', size: '2.4 MB' },
                { name: 'Order Status Report', date: '1 day ago', size: '1.8 MB' },
                { name: 'Customer List Export', date: '3 days ago', size: '5.2 MB' },
                { name: 'Monthly Revenue Report', date: '1 week ago', size: '3.1 MB' },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated {report.date} • {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}