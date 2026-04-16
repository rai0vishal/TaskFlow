import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, LayoutDashboard, ListTodo } from 'lucide-react';
import Button from '../components/Button';

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-surface-900 tracking-tight mb-8">
            Organize your tasks.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">
              Simplify your workflow.
            </span>
          </h1>
          <p className="text-xl text-surface-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            TaskFlow is carefully designed to help you and your team manage projects effortlessly. A clean, modern SaaS dashboard to keep everything on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 bg-white">
                Log In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-3">Secure Authentication</h3>
            <p className="text-surface-600">Enterprise-grade security keeping your data safe. Role-based access ensures only authorized users see what matters.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
              <ListTodo className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-3">Task Management</h3>
            <p className="text-surface-600">Create, assign, edit, and delete tasks with ease. Stay organized and never miss another crucial deadline.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
              <LayoutDashboard className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 mb-3">Simple Workflow</h3>
            <p className="text-surface-600">A smooth, trackable workflow from start to finish. Our interface is minimal, so you can focus on getting work done.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
