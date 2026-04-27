import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useNewspaper } from "../hooks/useNewspaper";
import { API_BASE_URL, authHeaders } from "../lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UserInfo {
  full_name: string | null;
  username: string;
}

interface NavbarProps {
  newspaperName: string;
  displayName?: string;
}

function getInitials(user: UserInfo): string {
  if (user.full_name) {
    const parts = user.full_name.trim().split(/\s+/);
    return parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return user.username.slice(0, 2).toUpperCase();
}

export function Navbar({ newspaperName, displayName }: NavbarProps) {
  const { newspaper } = useNewspaper();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  displayName ??=
    newspaper?.name ??
    newspaperName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  useEffect(() => {
    if (!newspaper) return;
    fetch(`${API_BASE_URL}/api/newspapers/${newspaper.id}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json() as Promise<{ data: Category[] }>;
      })
      .then((data) => setCategories(data.data))
      .catch(() => {});
  }, [newspaper]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<UserInfo>;
      })
      .then((data) => setUser(data))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
    localStorage.removeItem("token");
    setUser(null);
    setMenuOpen(false);
    navigate(`/${newspaperName}/login`);
  }

  return (
    <header className="border-border bg-background relative z-10 flex items-center justify-between border-b px-12 py-4">
      <div className="flex items-center gap-10">
        <Link
          to={`/${newspaperName}`}
          className="text-foreground text-[22px] font-extrabold tracking-tight"
        >
          {displayName}
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link
            to={`/${newspaperName}`}
            className="text-muted-foreground hover:text-foreground text-[14px] font-medium transition-colors"
          >
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/${newspaperName}/category/${cat.slug}`}
              className="text-muted-foreground hover:text-foreground text-[14px] font-medium transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary-foreground text-[12px] font-semibold">
                  {getInitials(user)}
                </span>
              </div>
              <span className="text-foreground text-[14px] font-medium">
                {user.full_name ?? user.username}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="border-border bg-background absolute right-0 mt-1 w-44 rounded-lg border shadow-md">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/${newspaperName}/profile`);
                  }}
                  className="text-foreground hover:bg-muted w-full rounded-t-lg px-4 py-2.5 text-left text-[14px] font-medium"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="text-destructive hover:bg-muted w-full rounded-b-lg px-4 py-2.5 text-left text-[14px] font-medium"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to={`/${newspaperName}/login`}
              className="text-foreground hover:bg-muted rounded-lg px-4 py-2 text-[14px] font-medium"
            >
              Log in
            </Link>
            <Link
              to={`/${newspaperName}/register`}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-[14px] font-semibold hover:opacity-90"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
