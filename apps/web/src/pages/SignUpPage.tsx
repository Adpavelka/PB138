import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";

export function SignUpPage() {
  const { newspaperName, newspaper } = useNewspaper();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    if (!newspaper) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newspaper_id: newspaper.id,
          email,
          username,
          full_name: fullName || undefined,
          password,
        }),
      });

      if (res.status === 201) {
        setSuccess(true);
        return;
      }

      const body = await res.json();

      if (res.status === 409) {
        if (body.error === "EMAIL_TAKEN") {
          setFieldErrors({ email: "This email is already registered" });
        } else if (body.error === "USERNAME_TAKEN") {
          setFieldErrors({ username: "This username is already taken" });
        } else {
          setError("An account with these details already exists.");
        }
        return;
      }

      if (res.status === 422 && body.fields) {
        setFieldErrors(body.fields);
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch {
      setError("Could not connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-background text-foreground min-h-screen w-full">
        <Navbar newspaperName={newspaperName ?? ""} />
        <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-12">
          <div className="border-border bg-card flex w-full max-w-[420px] flex-col gap-4 rounded-xl border p-10 text-center shadow-sm">
            <h2 className="text-foreground text-[22px] font-extrabold tracking-tight">
              Check your email
            </h2>
            <p className="text-muted-foreground text-[14px] leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="text-foreground font-semibold">{email}</span>.
              Please verify your address to activate your account.
            </p>
            <Link
              to={`/${newspaperName}/login`}
              className="text-foreground mt-2 text-[14px] font-semibold underline-offset-4 hover:underline"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
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
              {(newspaperName ?? "")
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </span>
            <span className="text-muted-foreground text-[15px]">
              Create your account
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-foreground text-[14px] font-medium"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-foreground text-[14px] font-medium"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="jannovak"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring aria-[invalid=true]:border-destructive h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                aria-invalid={!!fieldErrors.username}
              />
              {fieldErrors.username && (
                <span className="text-destructive text-[12px]">
                  {fieldErrors.username}
                </span>
              )}
            </div>

            {/* Email */}
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
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring aria-[invalid=true]:border-destructive h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <span className="text-destructive text-[12px]">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-foreground text-[14px] font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring aria-[invalid=true]:border-destructive h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <span className="text-destructive text-[12px]">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-foreground text-[14px] font-medium"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring aria-[invalid=true]:border-destructive h-10 w-full rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <span className="text-destructive text-[12px]">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms */}
            <p className="text-muted-foreground text-center text-[13px]">
              By signing up, you agree to our{" "}
              <span className="text-foreground font-semibold">
                Terms &amp; Privacy Policy
              </span>
            </p>

            {/* Generic error */}
            {error && (
              <p className="text-destructive text-center text-[13px]">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !newspaper}
              className="bg-foreground text-background h-10 w-full rounded-md text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="bg-border h-px flex-1" />
              <span className="text-muted-foreground text-[13px]">or</span>
              <div className="bg-border h-px flex-1" />
            </div>

            {/* Google (placeholder) */}
            <button
              type="button"
              className="border-border bg-background text-foreground hover:bg-muted h-10 w-full rounded-md border text-[14px] font-medium transition-colors"
            >
              Sign up with Google
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-muted-foreground text-center text-[14px]">
            Already have an account?{" "}
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
