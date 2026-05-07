import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/app-layout";
import { UserAccountDialog } from "components/user-account-dialog";
import { listUsersViaApi } from "lib/user-api";
import { GenreBreakdownPage } from "pages/genre-breakdown-page";
import { ProfilePage } from "pages/profile-page";
import { TopMoviesPage } from "pages/top-movies-page";

const KNOWN_KEY = "movie-charts-known-users";
const ACTIVE_KEY = "movie-charts-active-user";

function readKnownUsers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim() !== "");
  } catch {
    return [];
  }
}

function readActiveUsername(): string {
  if (typeof window === "undefined") return "";
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

export default function App() {
  const [knownUsers, setKnownUsers] = useState<string[]>(readKnownUsers);
  const [activeUsername, setActiveUsername] = useState<string>(readActiveUsername);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogKey, setUserDialogKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void listUsersViaApi().then((users) => {
      if (!cancelled && users.length > 0) setKnownUsers(users);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sorted = [...new Set(knownUsers)].toSorted((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    localStorage.setItem(KNOWN_KEY, JSON.stringify(sorted));
  }, [knownUsers]);

  useEffect(() => {
    if (activeUsername.trim() !== "") localStorage.setItem(ACTIVE_KEY, activeUsername);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeUsername]);

  const onSelectUser = useCallback((username: string) => {
    setActiveUsername(username.trim());
  }, []);

  return (
    <BrowserRouter>
      <AppLayout
        activeUsername={activeUsername}
        onOpenUserDialog={() => {
          setUserDialogKey((k) => k + 1);
          setUserDialogOpen(true);
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/top-movies" replace />} />
          <Route path="/top-movies" element={<TopMoviesPage />} />
          <Route path="/genre-breakdown" element={<GenreBreakdownPage />} />
          <Route path="/catalogue" element={<ProfilePage />} />
          <Route path="/profile" element={<Navigate to="/catalogue" replace />} />
          <Route path="*" element={<Navigate to="/top-movies" replace />} />
        </Routes>
      </AppLayout>
      <UserAccountDialog
        key={userDialogKey}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        knownUsers={knownUsers}
        activeUsername={activeUsername}
        onSelectUser={onSelectUser}
        onKnownUsersChange={(users) => {
          setKnownUsers([...users]);
        }}
      />
    </BrowserRouter>
  );
}
