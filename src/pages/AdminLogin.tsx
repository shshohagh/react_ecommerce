import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100-64px)] flex items-center justify-center px-4 py-20 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-indigo-500/5 border border-gray-100 p-8 md:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Demo Credentials: admin@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
