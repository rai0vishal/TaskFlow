import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.data.user, data.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4 relative overflow-hidden font-sans">
      {/* Subtle background glow - animated */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/40 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Simple Brand/Icon Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-900 border border-surface-800 shadow-lg mb-5 relative group cursor-pointer hover:border-primary-500/50 transition-colors">
            <LogIn className="w-7 h-7 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-surface-400 mt-2 font-medium">Please enter your details to sign in</p>
        </div>

        {/* Minimalist Card */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/60 rounded-[1.5rem] p-8 md:p-10 shadow-2xl shadow-black/40 animate-slide-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Email Address"
              id="email"
              name="email"
              type="email"
              theme="dark"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              theme="dark"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-6 shadow-primary-900/50"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-surface-400 font-medium animate-slide-up delay-200">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold hover:underline underline-offset-4 transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
