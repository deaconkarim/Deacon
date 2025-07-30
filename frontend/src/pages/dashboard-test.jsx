import React from 'react';

export function Dashboard() {
  console.log('🚀 Simple Test Dashboard: Component loaded');
  
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-4">
        🚀 Optimized Dashboard Test
      </h1>
      <p className="text-lg text-gray-600 mb-4">
        This is a simple test to verify the route is working.
      </p>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ✅ If you can see this, the routing is working!
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Check the browser console for logs.
      </div>
    </div>
  );
}