import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const EMPTY = { templateName: '', subject: '', body: '', isFollowUp: false };

const PLACEHOLDERS = ['{Brand Name}', '{Contact Name}', '{Product Type}'];

function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState(template || EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const insert = (placeholder) =>
    setForm((f) => ({ ...f, body: f.body + placeholder }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (template?._id) {
        await api.put(`/templates/${template._id}`, form);
      } else {
        await api.post('/templates', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{template?._id ? 'Edit Template' : 'New Template'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input value={form.templateName} onChange={(e) => setForm({ ...form, templateName: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Message Body *</label>
              <div className="flex gap-1">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insert(p)}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={10}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="input resize-none font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Click placeholder buttons above to insert them at the end.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFollowUp}
              onChange={(e) => setForm({ ...form, isFollowUp: e.target.checked })}
              className="rounded"
            />
            Mark as Follow-Up template
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Template'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [preview, setPreview] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/templates');
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/templates/${id}`);
    fetchTemplates();
  };

  return (
    <div className="flex-1">
      <Navbar title="Email Templates" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
          <button onClick={() => { setEditTpl(null); setModal(true); }} className="btn-primary">+ New Template</button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : templates.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📝</p>
            <p>No templates yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl._id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{tpl.templateName}</h4>
                    {tpl.isFollowUp && (
                      <span className="badge bg-orange-100 text-orange-600 mt-1">Follow-Up</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(tpl)} className="text-gray-400 hover:text-gray-600 text-sm">👁</button>
                    <button onClick={() => { setEditTpl(tpl); setModal(true); }} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                    <button onClick={() => handleDelete(tpl._id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                  <p className="text-sm text-gray-700 font-medium">{tpl.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Body preview</p>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{tpl.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <TemplateModal
          template={editTpl}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); fetchTemplates(); }}
        />
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{preview.templateName}</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="font-medium text-gray-800 mb-4">{preview.subject}</p>
            <p className="text-xs text-gray-500 mb-1">Body</p>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-lg">{preview.body}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
