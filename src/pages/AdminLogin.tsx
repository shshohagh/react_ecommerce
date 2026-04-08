import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you haven\'t created an account yet, please use Google Login or create one in the Firebase Console.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 uppercase tracking-wider font-medium">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
            Sign in with Google
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-gray-400">
            Note: For first-time setup, please use Google Login with your admin email.
          </p>
          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
