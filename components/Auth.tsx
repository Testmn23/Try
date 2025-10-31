/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Spinner from './Spinner';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
        <h1 className="text-5xl font-playfair font-bold text-stone-900 dark:text-stone-100 leading-tight">
          Welcome Back
        </h1>
        <p className="mt-4 text-lg font-sora text-stone-600 dark:text-stone-400">
          Sign in via magic link with your email below.
        </p>

        <form onSubmit={handleLogin} className="w-full mt-8 space-y-4 font-sora">
          <div>
            <input
              className="w-full p-3 rounded-md bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-shadow text-stone-800 dark:text-stone-200"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <button
              className="w-full relative flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-fuchsia-500 rounded-md transition-all duration-200 ease-in-out hover:bg-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <Spinner /> : 'Send Magic Link'}
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-green-600 dark:text-green-500">{message}</p>}
        {error && <p className="mt-4 text-red-600 dark:text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
