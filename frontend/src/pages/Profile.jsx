import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardData } from '../api/analytics';
import { User, Mail, Shield, TrendingUp, CalendarDays, Key } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* ─── Modular Components ─── */
const ProfileHeader = ({ user }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
      <span className="text-2xl font-bold text-white">
        {user?.name?.charAt(0).toUpperCase()}
      </span>
    </div>
    <div>
      <h1 className="text-xl font-semibold text-white leading-tight">{user?.name}</h1>
      <p className="text-sm text-gray-400 capitalize">{user?.role} • MERN Developer</p>
    </div>
  </div>
);

const StatsCard = ({ label, value, loading }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
    <p className="text-xs text-gray-400 tracking-wide mb-1">{label}</p>
    <p className="text-xl font-bold text-white leading-relaxed">{loading ? '-' : value}</p>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div>
    <p className="text-xs text-gray-400 tracking-wide">{label}</p>
    <p className="text-sm text-white font-medium mt-0.5 flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="truncate">{value}</span>
    </p>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getDashboardData();
      const payload = data.data;
      setStats(payload.stats);
      setWeeklyData(payload.weeklyProductivity);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const productivityPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-[#0f0f11] to-[#121217] py-8 transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-6">

        {/* 1. PROFILE HEADER */}
        <ProfileHeader user={user} />

        {/* 2. STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatsCard label="Total Tasks" value={stats.total} loading={loading} />
          <StatsCard label="In Progress" value={stats.inProgress} loading={loading} />
          <StatsCard label="Completed" value={stats.done} loading={loading} />
          <StatsCard label="Productivity" value={`${productivityPct}%`} loading={loading} />
        </div>

        {/* 3. MAIN SECTION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: PROFILE DETAILS CARD */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5 shadow-md">
              <h2 className="text-sm font-semibold text-white">Profile Details</h2>

              <div className="space-y-4">
                <DetailRow icon={User} label="Username" value={user?.name} />
                <DetailRow icon={Mail} label="Email" value={user?.email} />
                <DetailRow icon={Shield} label="Role" value={<span className="capitalize">{user?.role}</span>} />
                <DetailRow
                  icon={CalendarDays}
                  label="Joined Date"
                  value={new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                />
              </div>

              <div className="pt-2">
                <button className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-lg py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
                  <Key className="w-4 h-4" /> Change Password
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCTIVITY SECTION */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-md h-full flex flex-col">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Productivity Overview
              </h2>

              <div className="flex-1 min-h-[250px] relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                  </div>
                ) : weeklyData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-400 mb-2">No recent activity yet 🚀</p>
                    <p className="text-xs text-gray-500">Complete tasks to see your velocity.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{ backgroundColor: '#121217', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
