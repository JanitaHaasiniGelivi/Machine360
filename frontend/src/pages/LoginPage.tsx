import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (register) await api.register({ email, password, full_name: name });
      await login(email, password);
      navigate('/');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  };
  return <section className="max-w-md mx-auto p-6 rounded-xl border border-slate-700 bg-slate-900 text-slate-100">
    <h1 className="text-2xl font-bold mb-6">{register ? 'Create account' : 'Sign in'}</h1>
    <form onSubmit={submit} className="space-y-4">
      {register && <label className="block">Full name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="block w-full p-2 bg-slate-800 rounded" /></label>}
      <label className="block">Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" className="block w-full p-2 bg-slate-800 rounded" /></label>
      <label className="block">Password<input type="password" required minLength={register ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} className="block w-full p-2 bg-slate-800 rounded" /></label>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button disabled={busy} type="submit" className="w-full p-3 rounded bg-teal-500 text-slate-950 font-semibold">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
    </form>
    <button className="mt-4 underline" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Already have an account? Sign in' : 'Create a viewer account'}</button>
    {register && <p className="text-sm text-slate-400 mt-3">New accounts have viewer access. Ask your administrator for permission to modify machine and maintenance records.</p>}
  </section>;
};
