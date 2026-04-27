import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../lib/api";
import { Navbar } from "../components/Navbar";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_picture: string | null;
  email_verified: boolean;
  roles: string[];
}

function splitFullName(full_name: string | null): [string, string] {
  if (!full_name) return ["", ""];
  const idx = full_name.indexOf(" ");
  if (idx === -1) return [full_name, ""];
  return [full_name.slice(0, idx), full_name.slice(idx + 1)];
}

export function UserProfilePage() {
  const { newspaperName } = useParams<{ newspaperName: string }>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Profile info form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string>
  >({});

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        setProfile(data);
        const [first, last] = splitFullName(data.full_name);
        setFirstName(first);
        setLastName(last);
        setUsername(data.username);
        setBio(data.bio ?? "");
        setAvatarUrl(data.profile_picture);
      })
      .catch(() => setLoadError(true));
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileFieldErrors({});
    setProfileSuccess(false);
    setProfileSaving(true);

    const full_name =
      [firstName, lastName].filter(Boolean).join(" ") || undefined;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          full_name,
          username: username || undefined,
          bio: bio || undefined,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as UserProfile;
        const [first, last] = splitFullName(data.full_name);
        setFirstName(first);
        setLastName(last);
        setUsername(data.username);
        setBio(data.bio ?? "");
        setProfileSuccess(true);
        return;
      }

      const body = await res.json();

      if (res.status === 409 && body.error === "USERNAME_TAKEN") {
        setProfileFieldErrors({ username: "This username is already taken." });
        return;
      }

      if (res.status === 422 && body.fields) {
        setProfileFieldErrors(body.fields);
        return;
      }

      setProfileError("Something went wrong. Please try again.");
    } catch {
      setProfileError(
        "Could not connect to the server. Please try again later."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("profile_picture", file);

    fetch(`${API_BASE_URL}/api/users/me/profile-picture`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw res;
        return res.json() as Promise<{ profile_picture: string }>;
      })
      .then((data) => setAvatarUrl(data.profile_picture))
      .catch(() =>
        setAvatarError("Failed to upload photo. Use JPEG or PNG under 5 MB.")
      )
      .finally(() => {
        setAvatarUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(true);
        return;
      }

      const body = await res.json();

      if (res.status === 422 && body.fields?.password) {
        setPasswordError(body.fields.password);
        return;
      }

      setPasswordError("Something went wrong. Please try again.");
    } catch {
      setPasswordError(
        "Could not connect to the server. Please try again later."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const initials =
    [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar newspaperName={newspaperName ?? ""} />

      <div className="flex flex-col gap-7 px-12 py-8">
        {/* Page Title */}
        <h1
          className="text-foreground text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ fontFamily: "Outfit, Inter, sans-serif" }}
        >
          My Profile
        </h1>

        {loadError ? (
          <p className="text-muted-foreground py-16 text-center">
            Failed to load profile. Please sign in and try again.
          </p>
        ) : !profile ? (
          <p className="text-muted-foreground py-16 text-center">Loading…</p>
        ) : (
          <>
            {/* Profile Information Card */}
            <form
              onSubmit={handleProfileSave}
              className="border-border bg-card flex flex-col gap-6 rounded-xl border p-8"
            >
              <h2
                className="text-foreground text-[18px] font-bold"
                style={{ fontFamily: "Outfit, Inter, sans-serif" }}
              >
                Profile Information
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-[24px] font-bold select-none">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-foreground text-[14px] font-semibold">
                    Profile Picture
                  </span>
                  <span className="text-muted-foreground text-[13px]">
                    JPG, PNG or GIF. Max 2MB.
                  </span>
                  {avatarError && (
                    <span className="text-destructive text-[12px]">
                      {avatarError}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="border-border bg-background text-foreground hover:bg-muted w-fit rounded-md border px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-60"
                  >
                    {avatarUploading ? "Uploading…" : "Change Photo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* First / Last Name row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="firstName"
                    className="text-foreground text-[14px] font-medium"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Sarah"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="lastName"
                    className="text-foreground text-[14px] font-medium"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Mitchell"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                  />
                </div>
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={!!profileFieldErrors.username}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring aria-[invalid=true]:border-destructive h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                />
                {profileFieldErrors.username && (
                  <span className="text-destructive text-[12px]">
                    {profileFieldErrors.username}
                  </span>
                )}
              </div>

              {/* Email (read-only) */}
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
                  value={profile.email}
                  readOnly
                  className="border-input bg-muted text-muted-foreground h-10 w-full cursor-not-allowed rounded-md border px-3 text-[14px]"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="bio"
                  className="text-foreground text-[14px] font-medium"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell readers a little about yourself…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring w-full resize-none rounded-md border px-3 py-2 text-[14px] focus:ring-2 focus:outline-none"
                />
              </div>

              {profileError && (
                <p className="text-destructive text-[13px]">{profileError}</p>
              )}
              {profileSuccess && (
                <p className="text-[13px] text-green-600">
                  Profile updated successfully.
                </p>
              )}

              {/* Save Row */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-foreground text-background rounded-md px-5 py-2 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>

            {/* Change Password Card */}
            <form
              onSubmit={handlePasswordSave}
              className="border-border bg-card flex flex-col gap-6 rounded-xl border p-8"
            >
              <div className="flex flex-col gap-1">
                <h2
                  className="text-foreground text-[18px] font-bold"
                  style={{ fontFamily: "Outfit, Inter, sans-serif" }}
                >
                  Change Password
                </h2>
                <p className="text-muted-foreground text-[14px]">
                  Update your password to keep your account secure.
                </p>
              </div>

              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="currentPassword"
                  className="text-foreground text-[14px] font-medium"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                />
              </div>

              {/* New / Confirm row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="newPassword"
                    className="text-foreground text-[14px] font-medium"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                  />
                </div>
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
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/50 focus:border-ring h-10 w-full rounded-md border px-3 text-[14px] focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-destructive text-[13px]">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-[13px] text-green-600">
                  Password updated successfully.
                </p>
              )}

              {/* Password Save Row */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="bg-foreground text-background rounded-md px-5 py-2 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {passwordSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>

            {/* Danger Zone Card */}
            <div className="border-destructive bg-card flex flex-col gap-4 rounded-xl border p-8">
              <h2
                className="text-destructive text-[18px] font-bold"
                style={{ fontFamily: "Outfit, Inter, sans-serif" }}
              >
                Danger Zone
              </h2>
              <p className="text-muted-foreground text-[14px] leading-relaxed">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <button
                type="button"
                className="border-destructive bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground w-fit rounded-md border px-4 py-2 text-[14px] font-semibold transition-colors"
              >
                Delete Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
