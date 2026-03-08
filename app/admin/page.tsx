"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  const inputCls =
    "w-full px-3 py-2.5 text-sm rounded-lg border bg-transparent outline-none transition-all focus:ring-2 focus:ring-stone-300";
  const inputStyle = {
    borderColor: "var(--border)",
    color: "var(--fg)",
    background: "var(--bg)",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <nav
        className="flex items-center justify-between px-4 md:px-8 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href="/"
          className="font-serif italic text-xl tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          texty
        </Link>
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{ background: "var(--surface)", color: "var(--muted)" }}
        >
          admin
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--fg)" }}
          >
            Admin
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Sign in to view your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted)" }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className={inputCls}
                style={inputStyle}
                autoComplete="username"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                style={inputStyle}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!username || !password || loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
