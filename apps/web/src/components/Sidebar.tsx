import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../lib/api";

interface UserMe {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
  roles: string[];
}

// ── Icons ────────────────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function NewspaperIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  /** Page-specific nav content rendered between the role sections and the bottom actions. */
  children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { newspaperName } = useParams<{ newspaperName: string }>();
  const np = newspaperName ?? "";

  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) =>
        res.ok ? (res.json() as Promise<UserMe>) : Promise.reject()
      )
      .then(setUser)
      .catch(() => {});
  }, []);

  const roles = new Set(user?.roles ?? []);

  const displayName = user?.full_name ?? user?.username ?? "…";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogOut() {
    localStorage.removeItem("token");
    window.location.href = `/${np}/login`;
  }

  return (
    <aside className="border-border bg-background flex w-[225px] shrink-0 flex-col border-r">
      {/* User info */}
      <div className="border-border flex items-center gap-3 border-b px-4 py-4">
        <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-[13px] font-bold select-none">
              {initials}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-[13px] font-semibold">
            {displayName}
          </span>
          {user?.username && (
            <span className="text-muted-foreground truncate text-[11px]">
              @{user.username}
            </span>
          )}
        </div>
      </div>

      {/* Role-based nav sections */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        {roles.has("AUTHOR") && (
          <NavSection title="Author">
            <NavItem icon={<FileTextIcon />} label="My Articles" href="" />
            <NavItem icon={<PlusIcon />} label="New Article" href="" />
          </NavSection>
        )}

        {roles.has("EDITOR") && (
          <NavSection title="Editor">
            <NavItem icon={<InboxIcon />} label="Review Queue" href="" />
          </NavSection>
        )}

        {roles.has("NEWSPAPER_MANAGER") && (
          <NavSection title="Manager">
            <NavItem icon={<InboxIcon />} label="Editorial Queue" href="" />
            <NavItem icon={<TagIcon />} label="Categories" href="" />
            <NavItem icon={<BarChartIcon />} label="Statistics" href="" />
          </NavSection>
        )}

        {roles.has("DIRECTOR") && (
          <NavSection title="Director">
            <NavItem icon={<NewspaperIcon />} label="All Newspapers" href="" />
            <NavItem icon={<BarChartIcon />} label="Statistics" href="" />
          </NavSection>
        )}

        {roles.has("SYSTEM_ADMINISTRATOR") && (
          <NavSection title="Administration">
            <NavItem icon={<UsersIcon />} label="User Management" href="" />
            <NavItem icon={<SettingsIcon />} label="System Config" href="" />
          </NavSection>
        )}

        {/* Page-specific content (e.g. status filters on the Author Dashboard) */}
        {children && (
          <>
            <div className="bg-border my-1 h-px" />
            {children}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="border-border flex flex-col gap-0.5 border-t px-3 py-3">
        <NavItem
          icon={<UserIcon />}
          label="My Profile"
          href={`/${np}/profile`}
        />
        <button
          onClick={handleLogOut}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors"
        >
          <LogOutIcon />
          Log Out
        </button>
      </div>
    </aside>
  );
}
