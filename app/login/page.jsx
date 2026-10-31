'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Lock } from 'lucide-react';
import { setToken } from '@/lib/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Login failed');
      setToken(body.token);
      router.replace('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-logo"><Landmark size={22} /></span>
          <span>PayrollDesk</span>
        </div>
        <div className="login-title">Admin login</div>
        <form onSubmit={submit} className="login-form">
          <label>
            <span>Username</span>
            <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn primary login-btn" disabled={busy}>
            <Lock size={15} />{busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
