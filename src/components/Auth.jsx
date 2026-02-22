import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

// Auth handles both login and signup in one screen
// We toggle between the two modes with the isLogin state
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in with existing account
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        // Create a new account
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! You are now logged in.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0c0e13] flex items-center justify-center p-4"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-lg font-bold text-white mb-4">
            JT
          </div>
          <h1 className="text-2xl font-bold text-white">JobTracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track every application in one place
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-8">
          {/* Toggle Login / Signup */}
          <div className="flex border border-white/[0.08] rounded-lg overflow-hidden mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-violet-600 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-violet-600 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
              {/* Only show hint on signup */}
              {!isLogin && (
                <p className="text-xs text-gray-600 mt-1">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Your data is private and only visible to you
        </p>
      </motion.div>
    </div>
  );
}
