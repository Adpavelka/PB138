import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../lib/api";
import {
  BarChartIcon,
  FileTextIcon,
  InboxIcon,
  LogOutIcon,
  NewspaperIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "./Icons";

interface UserMe {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
  roles: string[];
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
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const isActive = href
    ? href.includes("?")
      ? currentPath === href
      : location.pathname === href
    : false;

  return (
    <Link
      to={href}
      className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
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
            <NavItem
              icon={<FileTextIcon />}
              label="My Articles"
              href={`/${np}/author-dashboard?section=my-articles`}
            />
            <NavItem
              icon={<PlusIcon />}
              label="New Article"
              href={`/${np}/articles/new`}
            />
          </NavSection>
        )}

        {roles.has("EDITOR") && (
          <NavSection title="Editor">
            <NavItem
              icon={<InboxIcon />}
              label="Review Queue"
              href={`/${np}/author-dashboard?section=review-queue`}
            />
          </NavSection>
        )}

        {roles.has("NEWSPAPER_MANAGER") && (
          <NavSection title="Manager">
            <NavItem
              icon={<InboxIcon />}
              label="Editorial Queue"
              href={`/${np}/author-dashboard?section=editorial-queue`}
            />
            <NavItem
              icon={<TagIcon />}
              label="Categories"
              href={`/${np}/author-dashboard?section=categories`}
            />
            <NavItem
              icon={<BarChartIcon />}
              label="Statistics"
              href={`/${np}/author-dashboard?section=statistics`}
            />
          </NavSection>
        )}

        {roles.has("DIRECTOR") && (
          <NavSection title="Director">
            <NavItem
              icon={<NewspaperIcon />}
              label="All Newspapers"
              href={`/${np}/author-dashboard?section=all-newspapers`}
            />
            <NavItem
              icon={<BarChartIcon />}
              label="Statistics"
              href={`/${np}/author-dashboard?section=statistics`}
            />
            <NavItem
              icon={<InboxIcon />}
              label="Approval Queue"
              href={`/${np}/author-dashboard?section=director-queue`}
            />
          </NavSection>
        )}

        {roles.has("SYSTEM_ADMINISTRATOR") && (
          <NavSection title="Administration">
            <NavItem
              icon={<UsersIcon />}
              label="User Management"
              href={`/${np}/author-dashboard?section=user-management`}
            />
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
