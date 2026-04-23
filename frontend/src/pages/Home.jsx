import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus, Columns3, BarChart3, Shield, MessageSquare,
  Moon, Users, GripVertical, LayoutDashboard, Github,
  ArrowUpRight, Sparkles,
} from 'lucide-react';
import Button from '../components/Button';

/* ── Scroll-triggered fade-in hook (#6) ── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('fade-in-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className={`fade-in-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Tech stack data (#1) ── */
const TECH_STACK = [
  { name: 'React', color: '#61DAFB' },
  { name: 'Node.js', color: '#68A063' },
  { name: 'MongoDB', color: '#4DB33D' },
  { name: 'Express', color: '#FFFFFF' },
  { name: 'Socket.io', color: '#25C2A0' },
  { name: 'JWT', color: '#FB015B' },
  { name: 'Recharts', color: '#8884D8' },
  { name: 'Tailwind CSS', color: '#38BDF8' },
];

/* ── Expanded features data (#2) ── */
const FEATURES = [
  {
    icon: Columns3,
    color: '#6C63FF',
    title: 'Kanban Board',
    desc: 'Drag-and-drop tasks across columns. Visual workflow management that feels natural.',
  },
  {
    icon: MessageSquare,
    color: '#4ADE80',
    title: 'Real-Time Chat',
    desc: 'Workspace-scoped team messaging with typing indicators and online presence.',
  },
  {
    icon: Users,
    color: '#60A5FA',
    title: 'Team Collaboration',
    desc: 'Invite members, assign tasks, and manage roles with admin controls.',
  },
  {
    icon: BarChart3,
    color: '#FBB024',
    title: 'Analytics Dashboard',
    desc: 'Track productivity trends, workload distribution, and completion rates.',
  },
  {
    icon: Shield,
    color: '#F472B6',
    title: 'Role-Based Access',
    desc: 'Admin and member roles with granular permissions per workspace.',
  },
  {
    icon: Moon,
    color: '#A78BFA',
    title: 'Dark Mode',
    desc: 'Beautiful light and dark themes that respect your system preferences.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div
      className="relative min-h-screen text-white overflow-hidden landing-dark"
      style={{ background: 'linear-gradient(to bottom, #0D0B17, #1A1635)' }}
    >
      {/* 🌌 BACKGROUND GLOW */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-primary opacity-20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-primary opacity-10 blur-[100px] rounded-full" />
        {/* #5 — Subtle dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10">

        {/* ═══ HERO ═══ */}
        <section className="px-6 pt-28 pb-24 flex flex-col items-center text-center justify-center">
          <div className="max-w-4xl w-full flex flex-col items-center">

            {/* #3 — Hero badge */}
            <FadeIn>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                style={{
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.2)',
                }}
              >
                <Sparkles style={{ width: '14px', height: '14px', color: '#6C63FF' }} />
                <span className="text-[12px] font-[600] tracking-wide" style={{ color: '#A89EF5' }}>
                  Open Source · Built with MERN Stack
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <h1 className="text-[44px] sm:text-[64px] font-[900] leading-[1.08] tracking-[-0.04em]">
                Organize your tasks.
                <br />
                <span className="bg-gradient-to-r from-primary to-primary-tint bg-clip-text text-transparent">
                  Simplify your workflow.
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p className="mt-6 text-[#A1A1AA] text-[18px] sm:text-[20px] max-w-[600px] leading-relaxed mx-auto">
                TaskFlow helps you and your team manage projects effortlessly.
                A clean, modern SaaS dashboard to keep everything exactly where it belongs.
              </p>
            </FadeIn>

            {/* CTA */}
            <FadeIn delay={240}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
                {user ? (
                  <Link to="/dashboard">
                    <Button
                      className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-primary text-white border-none transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{ boxShadow: '0 0 24px rgba(108,99,255,0.4)' }}
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button
                        className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-primary text-white border-none transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{ boxShadow: '0 0 24px rgba(108,99,255,0.4)' }}
                      >
                        Get Started Free
                      </Button>
                    </Link>
                    <Link to="/login">
                      <button
                        className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-transparent text-white transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{ border: '1px solid rgba(108,99,255,0.4)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(108,99,255,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        View Demo
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="px-6 pb-24 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <p className="text-center text-[13px] font-[600] uppercase tracking-[0.2em] text-primary mb-12">
                How it works
              </p>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line (desktop) */}
              <div
                className="hidden md:block absolute top-[52px] left-[16.6%] right-[16.6%] h-[1px]"
                style={{ background: 'linear-gradient(to right, transparent, rgba(108,99,255,0.3), rgba(108,99,255,0.3), transparent)' }}
              />
              {[
                { step: '01', icon: UserPlus, color: '#6C63FF', title: 'Create a Workspace', desc: 'Sign up and set up your workspace in seconds. Invite your team members to collaborate.' },
                { step: '02', icon: Columns3, color: '#4ADE80', title: 'Manage Your Tasks', desc: 'Create tasks, assign them to teammates, and drag-and-drop through your Kanban board.' },
                { step: '03', icon: BarChart3, color: '#60A5FA', title: 'Track Progress', desc: 'Monitor productivity with real-time analytics, charts, and team activity insights.' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 120}>
                  <div className="group relative text-center flex flex-col items-center">
                    <div
                      className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                      style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}
                    >
                      <item.icon style={{ width: '28px', height: '28px', color: item.color }} />
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[800] text-white"
                        style={{ background: item.color }}
                      >
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-[18px] font-[700] text-white mb-2">{item.title}</h3>
                    <p className="text-[14px] text-[#8B8B9E] leading-relaxed max-w-[260px]">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES — 6 cards (#2) ═══ */}
        <section className="px-6 py-24 flex flex-col items-center">
          <div className="w-full max-w-6xl">
            <FadeIn>
              <p className="text-center text-[13px] font-[600] uppercase tracking-[0.2em] text-primary mb-4">
                Features
              </p>
              <h2 className="text-[32px] font-[700] text-center mb-16">
                Everything you need to stay productive
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((item, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div
                    className="group relative rounded-[var(--radius-lg)] p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(108,99,255,0.2)]"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(circle at top left, ${item.color}08, transparent 60%)` }}
                    />

                    <div className="relative z-10">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}
                      >
                        <item.icon style={{ width: '20px', height: '20px', color: item.color }} />
                      </div>
                      <h3 className="text-[17px] font-[700] text-white mb-2">{item.title}</h3>
                      <p className="text-[14px] text-[#8B8B9E] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TECH STACK STRIP (#1) ═══ */}
        <section className="px-6 py-16 border-t border-white/5">
          <FadeIn>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-[13px] font-[600] uppercase tracking-[0.2em] text-primary mb-8">
                Built With
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                {TECH_STACK.map((tech) => (
                  <div key={tech.name} className="flex items-center gap-2 group">
                    <div
                      className="w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-150"
                      style={{ background: tech.color }}
                    />
                    <span className="text-[14px] font-[500] text-[#6B6890] group-hover:text-white transition-colors duration-300">
                      {tech.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ═══ BOTTOM CTA ═══ */}
        <section className="px-6 pb-32 flex justify-center mt-10">
          <FadeIn className="w-full max-w-5xl">
            <div
              className="p-[1px] rounded-[var(--radius-lg)] w-full"
              style={{ background: 'linear-gradient(to right, #6C63FF, #4F46E5, #6C63FF)' }}
            >
              <div className="bg-[#0D0B17] rounded-[calc(var(--radius-lg)-1px)] p-10 sm:p-12 text-center backdrop-blur">
                <h2 className="text-[28px] sm:text-[32px] font-[700] mb-4">
                  Ready to get organized?
                </h2>
                <p className="text-[#A1A1AA] text-[16px] sm:text-[18px] mb-10 max-w-2xl mx-auto">
                  Join professionals using TaskFlow to stay focused, collaborate faster,
                  and ship work on time.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                  {user ? (
                    <Link to="/dashboard">
                      <Button
                        className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-primary text-white border-none transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{ boxShadow: '0 0 24px rgba(108,99,255,0.4)' }}
                      >
                        Return to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/register">
                        <Button
                          className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-primary text-white border-none transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{ boxShadow: '0 0 24px rgba(108,99,255,0.4)' }}
                        >
                          Create Free Account
                        </Button>
                      </Link>
                      <Link to="/login">
                        <button
                          className="px-8 py-4 text-[16px] font-[600] rounded-[var(--radius-md)] bg-transparent text-white transition-all duration-300 hover:scale-105 active:scale-95"
                          style={{ border: '1px solid rgba(108,99,255,0.4)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(108,99,255,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          Log In
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ═══ FOOTER (#4) ═══ */}
        <footer className="border-t border-white/5 px-6 pt-12 pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-[6px] bg-primary flex items-center justify-center">
                    <LayoutDashboard style={{ width: '14px', height: '14px', color: '#fff' }} />
                  </div>
                  <span className="text-[16px] font-[800] text-white tracking-tight">TaskFlow</span>
                </div>
                <p className="text-[13px] text-[#6B6890] leading-relaxed max-w-[240px]">
                  A modern project management app built with the MERN stack as a full-stack portfolio project.
                </p>
              </div>

              {/* Product links */}
              <div>
                <h4 className="text-[12px] font-[700] uppercase tracking-widest text-[#6B6890] mb-4">Product</h4>
                <div className="flex flex-col gap-2.5">
                  <Link to="/dashboard" className="text-[13px] text-[#8B8B9E] hover:text-white transition-colors">Dashboard</Link>
                  <Link to="/tasks" className="text-[13px] text-[#8B8B9E] hover:text-white transition-colors">Task Board</Link>
                  <Link to="/analytics" className="text-[13px] text-[#8B8B9E] hover:text-white transition-colors">Analytics</Link>
                </div>
              </div>

              {/* Project links */}
              <div>
                <h4 className="text-[12px] font-[700] uppercase tracking-widest text-[#6B6890] mb-4">Project</h4>
                <div className="flex flex-col gap-2.5">
                  <a
                    href="https://github.com/rai0vishal/TaskFlow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[#8B8B9E] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Github style={{ width: '13px', height: '13px' }} />
                    Source Code
                    <ArrowUpRight style={{ width: '11px', height: '11px', opacity: 0.5 }} />
                  </a>
                  <span className="text-[13px] text-[#8B8B9E]">MERN · Socket.io · JWT</span>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[12px] text-[#4B4870]">
                © {new Date().getFullYear()} TaskFlow. Built with React, Node.js & MongoDB.
              </p>
              <p className="text-[12px] text-[#4B4870]">
                Designed & developed by <span className="text-[#8B8B9E] font-[600]">Vishal Rai</span>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}