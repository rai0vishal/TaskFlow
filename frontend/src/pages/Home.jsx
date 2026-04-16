import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  Zap,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Shield,
  Clock,
  Users,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import Button from '../components/Button';

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-surface-950 font-sans overflow-x-hidden relative">
      {/* ═══════════════════════════════════════════
          ANIMATED BACKGROUND LAYER
      ═══════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        {/* Primary glow - top */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary-500/10 rounded-full blur-[160px] animate-pulse-slow" />
        {/* Secondary glow - bottom right */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
        {/* Accent glow - left */}
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-primary-400/6 rounded-full blur-[100px]" />
      </div>

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative z-10 pt-32 sm:pt-40 pb-24 sm:pb-32">
        <main className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col items-center">
          {/* Title */}
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center justify-center animate-fade-in">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-8 drop-shadow-lg">
              Organize your tasks.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400 drop-shadow-none">
                Simplify your workflow.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-surface-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              TaskFlow is carefully designed to help you and your team manage projects effortlessly. A clean, modern, and powerful dashboard to keep everything exactly where it belongs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 shadow-primary-900/50 shadow-xl">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-surface-900/50 text-white border-surface-700 hover:bg-surface-800 hover:text-white backdrop-blur-md">
                  Log In
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="mt-20 w-full max-w-3xl mx-auto animate-slide-up delay-200">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { value: '10K+', label: 'Tasks Managed' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '<50ms', label: 'Real-time Sync' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                  <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs sm:text-sm font-semibold text-surface-500 mt-1 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-primary-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">Features</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Everything you need to ship faster
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
            {[
              {
                icon: ListTodo,
                title: 'Task Boards',
                desc: 'Drag-and-drop tasks across columns with silky smooth animations powered by @dnd-kit.',
                gradient: 'from-primary-500/20 to-primary-600/10',
                iconColor: 'text-primary-400',
              },
              {
                icon: Zap,
                title: 'Smart Priority Engine',
                desc: 'AI-powered scoring that factors in deadlines, complexity, and workload to auto-prioritize.',
                gradient: 'from-amber-500/20 to-amber-600/10',
                iconColor: 'text-amber-400',
              },
              {
                icon: MessageSquare,
                title: 'Real-Time Chat',
                desc: 'Instant 1-to-1 messaging with Socket.IO. Get notified the moment someone reaches out.',
                gradient: 'from-blue-500/20 to-blue-600/10',
                iconColor: 'text-blue-400',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                desc: 'Beautiful Recharts graphs tracking your weekly velocity, completions, and team activity.',
                gradient: 'from-emerald-500/20 to-emerald-600/10',
                iconColor: 'text-emerald-400',
              },
              {
                icon: Shield,
                title: 'Role-Based Access',
                desc: 'Enterprise-grade JWT authentication with Admin and Member roles for secure workflows.',
                gradient: 'from-purple-500/20 to-purple-600/10',
                iconColor: 'text-purple-400',
              },
              {
                icon: Clock,
                title: 'Auto-Escalation',
                desc: 'Nightly cron jobs recalculate priority as deadlines approach. Nothing slips through.',
                gradient: 'from-rose-500/20 to-rose-600/10',
                iconColor: 'text-rose-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-500 hover:-translate-y-1"
              >
                {/* Gradient highlight on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-surface-800/80 border border-surface-700/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-surface-400 font-medium leading-relaxed text-[15px]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="relative z-10 py-24 sm:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-primary-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">How it works</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Three steps to clarity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Create a Workspace',
                desc: 'Set up your team environment in seconds. Invite collaborators and organize boards.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Add & Prioritize Tasks',
                desc: 'Create tasks, set deadlines, and let the Smart Priority Engine rank what matters most.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Track & Collaborate',
                desc: 'Drag tasks across your task board, chat in real-time, and watch analytics move.',
                icon: BarChart3,
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center group">
                {/* Connection line */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-surface-700/80 to-transparent" />
                )}

                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-surface-900 border border-surface-800 mb-6 group-hover:border-primary-500/30 transition-colors duration-500 relative">
                  <item.icon className="w-10 h-10 text-primary-400" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-primary-600/30">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{item.title}</h3>
                <p className="text-surface-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-primary-900/40 via-surface-900/60 to-surface-950 border border-primary-500/10 p-12 sm:p-16 overflow-hidden">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary-500/15 rounded-full blur-[100px]" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/20 mb-8">
                <FolderKanban className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
                Ready to get organized?
              </h2>
              <p className="text-surface-400 text-lg font-medium max-w-xl mx-auto mb-10 leading-relaxed">
                Join thousands of professionals who use TaskFlow to stay focused, collaborate faster, and ship quality work on time.
              </p>
              <Link to="/register">
                <Button
                  size="lg"
                  className="text-base font-bold px-10 py-4 shadow-xl shadow-primary-700/30"
                >
                  Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-surface-500">TaskFlow</span>
          </div>
          <p className="text-xs text-surface-600 font-medium">
            &copy; {new Date().getFullYear()} TaskFlow. Built with React, Node.js, MongoDB & Socket.IO.
          </p>
        </div>
      </footer>
    </div>
  );
}
