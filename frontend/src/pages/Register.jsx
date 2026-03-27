import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4 relative overflow-hidden font-sans">
      {/* Subtle background glow - animated */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/40 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Simple Brand/Icon Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-900 border border-surface-800 shadow-lg mb-5 relative group cursor-pointer hover:border-primary-500/50 transition-colors">
            <UserPlus className="w-7 h-7 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create an account</h1>
          <p className="text-sm text-surface-400 mt-2 font-medium">Join us to manage your tasks efficiently</p>
        </div>

        {/* Minimalist Card */}
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800/60 rounded-[1.5rem] p-8 md:p-10 shadow-2xl shadow-black/40 animate-slide-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Full Name"
              id="name"
              name="name"
              type="text"
              theme="dark"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
            />

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
              placeholder="Min 8 chars, upper+lower+number"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-6 shadow-primary-900/50"
              size="lg"
            >
              Create Account
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-surface-400 font-medium animate-slide-up delay-200">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold hover:underline underline-offset-4 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
