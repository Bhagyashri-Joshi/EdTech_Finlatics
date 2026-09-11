import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
export default function Login() {
  const [email, setEmail] = useState('teacher@engageai.demo');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const submit = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { await login(email,password); navigate(location.state?.from || '/dashboard', {replace:true}); } catch (err) { setError(err.response?.data?.message || 'Login failed'); } finally { setLoading(false); } };
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-blue-950/5">
      <div className="mb-6 flex items-center gap-3"><img className="size-12 rounded-2xl object-cover" src="/assets/logo.png" alt="EngageAI logo"/><div><h1 className="text-xl font-bold">EngageAI</h1><p className="text-sm text-slate-500">Teacher/Admin login</p></div></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">Email<input className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label className="block text-sm font-medium">Password<input className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading?'Signing in…':'Sign in'}</button>
      </form>
      <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><b>Demo:</b> teacher@engageai.demo / Demo@123</div>
    </div>
  </div>;
}
