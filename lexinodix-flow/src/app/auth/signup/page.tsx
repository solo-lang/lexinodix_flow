'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-dark-navy mx-auto flex items-center justify-center text-white mb-6">
          <span className="text-2xl">✦</span>
        </div>
        <h2 className="font-sora text-xl font-bold text-dark-navy mb-3">Check your inbox</h2>
        <p className="text-sm text-neutral-gray leading-relaxed mb-6">
          We sent a confirmation link to <strong className="text-dark-navy">{email}</strong>.
          Click it to activate your workspace.
        </p>
        <Link href="/auth/login" className="btn-secondary inline-block">
          Back to login
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-dark-navy mx-auto flex items-center justify-center text-white mb-5 shadow-luxury relative overflow-hidden">
          <span className="font-sora text-2xl font-bold relative z-10">L</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-deep-blue to-transparent opacity-50" />
        </div>
        <h1 className="font-sora text-2xl font-bold text-dark-navy tracking-tight">Begin your Flow</h1>
        <p className="text-sm text-neutral-gray mt-1.5">Create your premium workspace in seconds</p>
      </div>

      <div className="bg-white rounded-3xl border border-warm-border p-8 shadow-luxury">
        {/* OAuth */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 py-3 px-4 bg-warm-surface border border-warm-border rounded-xl hover:bg-warm-hover transition-all text-sm font-medium text-dark-navy disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.65 0 3.12.57 4.29 1.69l3.19-3.19C17.53 1.64 14.99 1 12 1 7.35 1 3.39 3.67 1.46 7.57l3.78 2.93C6.12 7.15 8.84 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.21-2.35H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.55z"/>
              <path fill="#FBBC05" d="M5.24 14.5a7.1 7.1 0 010-4.39L1.46 7.18A11.94 11.94 0 000 12c0 1.76.38 3.44 1.46 4.96l3.78-2.46z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-3.16 0-5.88-2.11-6.76-4.96L1.46 15.8C3.39 19.7 7.35 23 12 23z"/>
            </svg>
            <span className="font-sora">Google</span>
          </button>
          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 py-3 px-4 bg-warm-surface border border-warm-border rounded-xl hover:bg-warm-hover transition-all text-sm font-medium text-dark-navy disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="font-sora">GitHub</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-warm-border" />
          <span className="text-[11px] text-neutral-gray uppercase tracking-widest font-semibold">or email</span>
          <div className="flex-1 border-t border-warm-border" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@workspace.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating workspace…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>

      <p className="text-center mt-5 text-sm text-neutral-gray">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-dark-navy font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
