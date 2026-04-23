import { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUSES = ['Ready', 'Email Sent', 'Replied', 'Interested', 'Client'];

const STATUS_COLORS = {
  Ready:       'bg-blue-100 text-blue-700',
  'Email Sent': 'bg-purple-100 text-purple-700',
  Replied:     'bg-yellow-100 text-yellow-700',
  Interested:  'bg-green-100 text-green-700',
  Client:      'bg-red-100 text-red-700',
};

const EMPTY_LEAD = { brandName: '', contactName: '', email: '', website: '', productType: '', status: 'Ready', notes: '' };

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || EMPTY_LEAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (lead?._id) {
        await api.put(`/leads/${lead._id}`, form);
      } else {
        await api.post('/leads', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="input"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{lead?._id ? 'Edit Lead' : 'Add Lead'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field('brandName', 'Brand Name *')}
          {field('contactName', 'Contact Name')}
          {field('email', 'Email *', 'email')}
          {field('website', 'Website')}
          {field('productType', 'Product Type')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Lead'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkSendModal({ onClose, onDone }) {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [readyCount, setReadyCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([api.get('/templates'), api.get('/leads?status=Ready')])
      .then(([t, l]) => {
        setTemplates(t.data);
        setReadyCount(l.data.length);
      });
  }, []);

  const handleSend = async () => {
    if (!templateId) return setMsg('Please select a template.');
    setSending(true);
    try {
      const res = await api.post('/emails/send-bulk', { templateId });
      setMsg(`✅ ${res.data.message} — sending up to ${Math.min(readyCount, 50)} emails in background.`);
      setTimeout(() => { onDone(); onClose(); }, 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error starting bulk send');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Send Bulk Emails</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{Math.min(readyCount, 50)}</strong> Ready leads will receive this email (max 50 per batch, 60–120s delay between each).
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input">
            <option value="">-- choose template --</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.templateName}</option>)}
          </select>
        </div>
        {msg && <p className="text-sm mb-3 text-blue-600">{msg}</p>}
        <div className="flex gap-3">
          <button onClick={handleSend} disabled={sending || readyCount === 0} className="btn-primary flex-1">
            {sending ? 'Starting…' : 'Send Bulk Emails 🚀'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function FollowUpModal({ onClose, onDone }) {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [candidates, setCandidates] = useState(0);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([api.get('/templates'), api.get('/emails/followup-candidates')])
      .then(([t, c]) => {
        setTemplates(t.data);
        setCandidates(c.data.count);
      });
  }, []);

  const handleSend = async () => {
    if (!templateId) return setMsg('Please select a template.');
    setSending(true);
    try {
      const res = await api.post('/emails/send-followup', { templateId });
      setMsg(`✅ ${res.data.message} — sending to ${Math.min(candidates, 50)} leads.`);
      setTimeout(() => { onDone(); onClose(); }, 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Send Follow-Up Emails</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{Math.min(candidates, 50)}</strong> leads contacted 3+ days ago and not replied (status: Email Sent).
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Template</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="input">
            <option value="">-- choose template --</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.templateName}</option>)}
          </select>
        </div>
        {msg && <p className="text-sm mb-3 text-blue-600">{msg}</p>}
        <div className="flex gap-3">
          <button onClick={handleSend} disabled={sending || candidates === 0} className="btn-primary flex-1">
            {sending ? 'Starting…' : 'Send Follow-Ups 📩'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'bulk' | 'followup'
  const [editLead, setEditLead] = useState(null);
  const [csvMsg, setCsvMsg] = useState('');
  const csvRef = useRef();

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/leads', { params });
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.delete(`/leads/${id}`);
    fetchLeads();
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/leads/upload/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvMsg(`✅ Imported: ${data.imported}, Skipped: ${data.skipped}${data.errors.length ? ` | Errors: ${data.errors.slice(0, 3).join(', ')}` : ''}`);
      fetchLeads();
    } catch (err) {
      setCsvMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`);
    }
    e.target.value = '';
  };

  // Funnel counts
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length;
    return acc;
  }, {});

  return (
    <div className="flex-1">
      <Navbar title="Leads" />
      <div className="p-6 space-y-6">

        {/* Funnel Stage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`card text-center cursor-pointer transition-all hover:shadow-md ${statusFilter === s ? 'ring-2 ring-blue-500' : ''}`}
            >
              <p className={`badge mx-auto mb-1 ${STATUS_COLORS[s]}`}>{s}</p>
              <p className="text-2xl font-bold text-gray-800">{counts[s] || 0}</p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search brand, email, contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input max-w-xs"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input max-w-[160px]">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex-1" />
          <button onClick={() => { setEditLead(null); setModal('add'); }} className="btn-primary">+ Add Lead</button>
          <button onClick={() => csvRef.current.click()} className="btn-secondary">📁 Upload CSV</button>
          <button onClick={() => setModal('bulk')} className="btn-primary bg-purple-600 hover:bg-purple-700">🚀 Bulk Email</button>
          <button onClick={() => setModal('followup')} className="btn-secondary">📩 Follow-Up</button>
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
        </div>

        {csvMsg && (
          <div className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-lg flex items-center justify-between">
            {csvMsg}
            <button onClick={() => setCsvMsg('')} className="ml-4 text-blue-400 hover:text-blue-600">✕</button>
          </div>
        )}

        {/* Lead Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Brand Name', 'Contact', 'Email', 'Product Type', 'Status', 'Last Contacted', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leads found.</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{lead.brandName}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.contactName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.productType || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => { setEditLead(lead); setModal('edit'); }}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(lead._id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <LeadModal
          lead={modal === 'edit' ? editLead : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchLeads(); }}
        />
      )}
      {modal === 'bulk' && <BulkSendModal onClose={() => setModal(null)} onDone={fetchLeads} />}
      {modal === 'followup' && <FollowUpModal onClose={() => setModal(null)} onDone={fetchLeads} />}
    </div>
  );
}
