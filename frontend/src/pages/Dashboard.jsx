import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import Navbar from '../components/Navbar';
import api from '../services/api';

const StatCard = ({ label, value, color, icon, sub }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, emailSent: 0, replied: 0, interested: 0, clients: 0 });
  const [emailStats, setEmailStats] = useState({ totalSent: 0, totalOpened: 0, openRate: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/leads/stats'),
      api.get('/logs/chart/per-day'),
      api.get('/logs/stats'),
    ])
      .then(([statsRes, chartRes, emailStatsRes]) => {
        setStats(statsRes.data);
        setChartData(chartRes.data.map((d) => ({ date: d._id, sent: d.count, opened: d.opened || 0 })));
        setEmailStats(emailStatsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const funnelData = [
    { name: 'Total Leads', value: stats.total, fill: '#3b82f6' },
    { name: 'Email Sent', value: stats.emailSent, fill: '#8b5cf6' },
    { name: 'Replied', value: stats.replied, fill: '#f59e0b' },
    { name: 'Interested', value: stats.interested, fill: '#10b981' },
    { name: 'Clients', value: stats.clients, fill: '#ef4444' },
  ];

  return (
    <div className="flex-1">
      <Navbar title="Dashboard" />
      <div className="p-6 space-y-6">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <>
            {/* Row 1 — Lead Pipeline Stats */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Lead Pipeline</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Total Leads" value={stats.total} icon="👥" color="bg-blue-50" />
                <StatCard label="In Email Sent" value={stats.emailSent} icon="📤" color="bg-purple-50" sub="current stage" />
                <StatCard label="Replied" value={stats.replied} icon="💬" color="bg-yellow-50" />
                <StatCard label="Interested" value={stats.interested} icon="⭐" color="bg-green-50" />
                <StatCard label="Clients" value={stats.clients} icon="🏆" color="bg-red-50" />
              </div>
            </div>

            {/* Row 2 — Email Performance Stats (from logs, never decreases) */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Email Performance</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Emails Sent"
                  value={emailStats.totalSent}
                  icon="📨"
                  color="bg-indigo-50"
                  sub="all time, never decreases"
                />
                <StatCard
                  label="Emails Opened"
                  value={emailStats.totalOpened}
                  icon="👁"
                  color="bg-emerald-50"
                  sub={`out of ${emailStats.totalSent} sent`}
                />
                <div className="card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-orange-50">
                    📈
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{emailStats.openRate}%</p>
                    <div className="mt-1.5 w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-orange-400 transition-all"
                        style={{ width: `${emailStats.openRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-4">Emails Sent & Opened Per Day (Last 14 Days)</h3>
                {chartData.length === 0 ? (
                  <p className="text-gray-400 text-sm">No email data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sent" />
                      <Bar dataKey="opened" fill="#10b981" radius={[4, 4, 0, 0]} name="Opened" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-4">Lead Funnel Conversion</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pipeline Breakdown */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4">Pipeline Breakdown</h3>
              <div className="space-y-3">
                {funnelData.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28">{stage.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: stats.total ? `${Math.min(100, (stage.value / stats.total) * 100)}%` : '0%',
                          backgroundColor: stage.fill,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{stage.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
