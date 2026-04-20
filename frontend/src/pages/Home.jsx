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
    <div className="relative min-h-screen bg-[#0B0F19] text-white overflow-hidden">

      {/* 🌌 BACKGROUND GLOW */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-indigo-600 opacity-20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10">

        {/* HERO */}
        <section className="px-6 pt-32 pb-32 flex flex-col items-center text-center min-h-[85vh] justify-center">

          <div className="max-w-3xl w-full">

            <h1 className="text-5xl sm:text-7xl font-bold leading-[1.1] tracking-tight">
              Organize your tasks.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                Simplify your workflow.
              </span>
            </h1>

            <p className="mt-8 text-gray-400 text-xl leading-relaxed">
              TaskFlow helps you and your team manage projects effortlessly.
              A clean, modern SaaS dashboard to keep everything exactly where it belongs.
            </p>

            {/* CTA */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">

              <Link to="/register">
                <Button className="px-10 py-4 text-lg font-semibold rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:bg-indigo-600 active:scale-95">
                  Get Started Free →
                </Button>
              </Link>

              <Link to="/login">
                <button className="px-10 py-4 text-lg font-semibold rounded-xl border border-white/10 text-gray-300 transition-all duration-300 hover:scale-105 hover:text-white hover:border-white/40 hover:bg-white/5 active:scale-95">
                  Log In
                </button>
              </Link>

            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 pb-32 flex flex-col items-center">

          <div className="w-full max-w-6xl">

            <h2 className="text-3xl font-semibold text-center mb-16">
              Everything you need to stay productive
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

              {[
                {
                  icon: <CheckCircle2 className="text-indigo-400" />,
                  title: "Secure Authentication",
                  desc: "Enterprise-grade security with role-based access control."
                },
                {
                  icon: <ListTodo className="text-indigo-400" />,
                  title: "Task Management",
                  desc: "Create, assign, and track tasks with ease."
                },
                {
                  icon: <LayoutDashboard className="text-indigo-400" />,
                  title: "Simple Workflow",
                  desc: "Smooth, intuitive workflow for maximum productivity."
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="
                  group relative
                  rounded-2xl p-8 min-h-[240px]
                  flex flex-col justify-between
                  bg-gradient-to-b from-white/[0.06] to-white/[0.02]
                  border border-white/10
                  backdrop-blur-md
                  shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]
                  transition-all duration-300
                  hover:scale-[1.03]
                  hover:shadow-[0_20px_50px_-10px_rgba(99,102,241,0.25)]
                  "
                >

                  {/* HOVER GLOW */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

                  <div>
                    <div className="w-12 h-12 bg-indigo-500/20 group-hover:bg-indigo-500/30 rounded-lg flex items-center justify-center mb-6 transition">
                      {item.icon}
                    </div>

                    <h3 className="text-xl font-semibold mb-3">
                      {item.title}
                    </h3>

                    <p className="text-gray-400 text-base leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-32 flex justify-center">
          <div className="p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 max-w-5xl w-full">
            <div className="bg-[#0B0F19] rounded-2xl p-10 text-center backdrop-blur">

              <h2 className="text-3xl font-semibold mb-4">
                Ready to get organized?
              </h2>

              <p className="text-gray-400 text-lg mb-8">
                Join professionals using TaskFlow to stay focused, collaborate faster,
                and ship work on time.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">

                <Link to="/register">
                  <button className="px-10 py-4 text-lg font-semibold rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:bg-indigo-600 active:scale-95">
                    Create Free Account →
                  </button>
                </Link>

                <Link to="/login">
                  <button className="px-10 py-4 text-lg font-semibold rounded-xl border border-white/10 text-gray-300 transition-all duration-300 hover:scale-105 hover:text-white hover:border-white/40 hover:bg-white/5 active:scale-95">
                    Log In
                  </button>
                </Link>

              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 pt-10 border-t border-white/10 text-center text-gray-500 text-sm pb-10">
          © {new Date().getFullYear()} TaskFlow. Built with React, Node.js & MongoDB.
        </footer>

      </div>
    </div>
  );
}