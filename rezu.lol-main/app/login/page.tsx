"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DiscordButton from "@/components/DiscordButton";
import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error") || "");

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard");
    });

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  const submit = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="auth-shell">
      <div className="auth-body">
        <div className="auth-card">
          <Link href="/" className="auth-brand">
            <BrandMark />
          </Link>
          <h1>Welcome back</h1>
          <p className="auth-lead">Log in to edit your page.</p>

          <DiscordButton />
          <div className="auth-divider">or email</div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn-primary" onClick={submit} disabled={loading} style={{ width: "100%", height: 42 }}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="auth-foot">
            No account? <Link href="/signup">Claim your name</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
