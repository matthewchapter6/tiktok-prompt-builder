import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center">
        <p className="text-4xl mb-3">🎬</p>
        <h1 className="text-xl font-bold text-gray-900 mb-1">HookGen</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to start building video prompts</p>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 text-sm disabled:opacity-50">
          {loading ? (
            <span className="text-gray-400">Signing in...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        <p className="text-xs text-gray-400 mt-6">By signing in, you agree to use this tool responsibly.</p>
      </div>
      <p className="text-xs text-gray-400 mt-6">© 2025 CATFAM. All rights reserved.</p>
    </div>
  );
};

export default LoginScreen;
