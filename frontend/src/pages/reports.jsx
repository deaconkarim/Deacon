import React, { useState } from 'react';
import { BarChart2, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceReports } from '@/components/reports/AttendanceReports';

export function Reports() {
  const [activeReport, setActiveReport] = useState('attendance');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and generate reports for your church.
          </p>
        </div>
      </div>

      {activeReport === null && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setActiveReport('attendance')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Attendance Reports</h3>
                  <p className="text-sm text-gray-500">Monitor service attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setActiveReport('members')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Member Reports</h3>
                  <p className="text-sm text-gray-500">View member statistics and growth</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setActiveReport('financial')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Financial Reports</h3>
                  <p className="text-sm text-gray-500">Track donations and expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeReport === 'attendance' && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setActiveReport(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Reports
            </button>
          </div>
          <AttendanceReports />
        </div>
      )}

      {activeReport === 'members' && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setActiveReport(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Reports
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Member Reports</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {activeReport === 'financial' && (
        <div>
          <div className="mb-6">
            <button
              onClick={() => setActiveReport(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Reports
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
} 