"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { login, isAuthenticated } from "@/lib/auth-store";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      window.location.href = "/admin";
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Isi username dan password.");
      return;
    }
    if (login(username, password)) {
      window.location.href = "/admin";
    } else {
      setError("Username atau password salah.");
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-sm"
      >
        <h1 className="text-3xl font-bold text-primary-text text-center mb-2 font-display uppercase tracking-tight">
          Admin Login
        </h1>
        <p className="text-secondary-text text-center text-sm mb-8">
          Masuk ke panel admin Clash.Soccer
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Masuk
          </button>
        </form>
      </motion.div>
    </div>
  );
}
