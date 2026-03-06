import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data.data.user, data.data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-surface-200 text-surface-900 text-sm placeholder-surface-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Simple Brand/Icon Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-surface-200 shadow-sm mb-5 relative group cursor-pointer">
            <UserPlus className="w-7 h-7 text-primary-600 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">Create an account</h1>
          <p className="text-sm text-surface-500 mt-2 font-medium">Join us to manage your tasks efficiently</p>
        </div>

        {/* Minimalist Card */}
        <div className="bg-white border border-surface-100 rounded-[1.5rem] p-8 md:p-10 shadow-xl shadow-surface-200/50 ring-1 ring-black/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-surface-700 mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-surface-700 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-surface-700 mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 8 chars, upper+lower+number"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-surface-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold hover:underline underline-offset-4 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
