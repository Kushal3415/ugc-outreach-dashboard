import { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function Settings() {
  const [gmailUser, setGmailUser] = useState('');
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setStatus('');
    try {
      await api.get('/health');
      setStatus('✅ Backend is reachable.');
    } catch {
      setStatus('❌ Could not reach backend.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1">
      <Navbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* Gmail Config Info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800">Gmail SMTP Configuration</h3>
          <p className="text-sm text-gray-500">
            Gmail credentials are configured via environment variables on the backend server.
            Update your <code className="bg-gray-100 px-1 rounded">.env</code> file and restart the server.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 space-y-1">
            <p>GMAIL_USER=your_email@gmail.com</p>
            <p>GMAIL_PASS=your_app_password</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Use a Gmail App Password</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to Google Account → Security → 2-Step Verification (must be ON)</li>
              <li>Go to App Passwords → Generate a new app password</li>
              <li>Use that 16-character password as <code>GMAIL_PASS</code></li>
            </ol>
          </div>
        </div>

        {/* MongoDB Info */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800">MongoDB Atlas</h3>
          <p className="text-sm text-gray-500">Set your MongoDB Atlas connection string in the backend <code className="bg-gray-100 px-1 rounded">.env</code>:</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700">
            <p>MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ugc-outreach</p>
          </div>
        </div>

        {/* Email Sending Rules */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800">Email Sending Rules</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span>Max emails per batch</span>
              <span className="font-semibold">50</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span>Delay between emails</span>
              <span className="font-semibold">60–120 seconds (random)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span>Follow-up eligibility</span>
              <span className="font-semibold">Last contacted &gt; 3 days ago</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Follow-up target status</span>
              <span className="font-semibold">Email Sent (no reply)</span>
            </div>
          </div>
        </div>

        {/* Connection Test */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800">Backend Health Check</h3>
          <button onClick={testConnection} disabled={testing} className="btn-secondary">
            {testing ? 'Checking…' : '🔗 Test Backend Connection'}
          </button>
          {status && <p className="text-sm">{status}</p>}
        </div>

        {/* CSV Format */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800">CSV Upload Format</h3>
          <p className="text-sm text-gray-500">Your CSV file must include these column headers:</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700">
            Brand Name, Contact Name, Email, Website, Product Type
          </div>
          <p className="text-xs text-gray-400">Duplicate emails will be updated (upsert). Invalid emails are skipped.</p>
        </div>
      </div>
    </div>
  );
}
