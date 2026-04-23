import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [leadFilter, setLeadFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (leadFilter) params.leadId = leadFilter;
      const { data } = await api.get('/logs', { params });
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, search, dateFrom, dateTo, leadFilter]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="flex-1">
      <Navbar title="Email Logs" />
      <div className="p-6 space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Subject or email…"
              value={search}
              onChange={handleSearch}
              className="input w-56"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input" />
          </div>
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setLeadFilter(''); setPage(1); }}
            className="btn-secondary"
          >
            Clear
          </button>
          <div className="flex-1" />
          <p className="text-sm text-gray-500">{total} log{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Recipient', 'Subject', 'Type', 'Status', 'Opened', 'Sent At'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No logs found.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{log.recipientName || log.leadId?.brandName || '—'}</p>
                      <p className="text-xs text-gray-400">{log.recipientEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{log.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${log.isFollowUp ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {log.isFollowUp ? 'Follow-Up' : 'Initial'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${log.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'sent' ? (
                        <span className={`badge ${log.opened ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {log.opened ? `✅ Opened` : '👁 Not yet'}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center gap-2 justify-center">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">← Prev</button>
            <span className="text-sm text-gray-600">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
