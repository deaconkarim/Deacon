import React from 'react';
import { BarChart2 } from 'lucide-react';

export function Reports() {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Member Reports</h3>
              <p className="text-sm text-gray-500">View member statistics and growth</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Financial Reports</h3>
              <p className="text-sm text-gray-500">Track donations and expenses</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Attendance Reports</h3>
              <p className="text-sm text-gray-500">Monitor service attendance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 