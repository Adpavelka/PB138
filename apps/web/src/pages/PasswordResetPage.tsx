import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import { Navbar } from "../components/Navbar";

// TODO: replace with a real newspaper_id once a public lookup-by-name endpoint exists
const NEWSPAPER_ID = "550e8400-e29b-41d4-a716-446655440000";

export function PasswordResetPage() {
  const { newspaperName } = useParams<{ newspaperName: string }>();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayName = (newspaperName ?? "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newspaper_id: NEWSPAPER_ID, email }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      }

      const body = await res.json();

      if (res.status === 422) {
        const fieldError = body.fields?.email;
        setError(fieldError ?? "Please enter a valid email address.");
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch {
      setError("Could not connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar newspaperName={newspaperName ?? ""} />

      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-12">
        <div className="border-border bg-card flex w-full max-w-[420px] flex-col gap-8 rounded-xl border p-10 shadow-sm">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-foreground text-[26px] font-black tracking-[-1px]"
              style={{ fontFamily: "Outfit, Inter, sans-serif" }}
            >
              {displayName}
            </span>
            <span className="text-muted-foreground text-[15px]">
              Reset your password
            </span>
            <p className="text-muted-foreground text-center text-[13px] leading-relaxed">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>
          </div>

          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-muted-foreground text-center text-[14px]">
                If that address is registered, a reset link has been sent. Check
                your inbox.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-foreground text-[14px] font-medium"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-destructive text-center text-[13px]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-foreground text-background h-10 w-full rounded-md text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}

          {/* Back link */}
          <p className="text-muted-foreground text-center text-[14px]">
            Remember your password?{" "}
            <Link
              to={`/${newspaperName}/login`}
              className="text-foreground font-semibold underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
