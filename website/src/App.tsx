import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/app-layout";
import { UserAccountDialog } from "components/user-account-dialog";
import { UserSessionProvider } from "components/user-session-provider";
import { listUsersViaApi, type UserResponse } from "lib/user-api";
import { DatabasePage } from "pages/database-page";
import { ProfilePage } from "pages/profile-page";
import { RecommendationsPage } from "pages/recommendations-page";

const KNOWN_KEY = "movie-charts-known-users";
const REMEMBER_KEY = "movie-charts-remembered-session";

type RememberedSession = {
  userId: number;
  username: string;
};

function readRememberedSession(): RememberedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    const userId = o.userId;
    const username = o.username;
    if (typeof userId !== "number" || userId <= 0) return null;
    if (typeof username !== "string" || username.trim() === "") return null;
    return { userId, username: username.trim() };
  } catch {
    return null;
  }
}

export default function App() {
  const rememberedOnBoot = typeof window !== "undefined" ? readRememberedSession() : null;
  const [knownUsers, setKnownUsers] = useState<UserResponse[]>([]);
  const [userId, setUserId] = useState<number | null>(() => rememberedOnBoot?.userId ?? null);
  const [username, setUsername] = useState(() => rememberedOnBoot?.username ?? "");
  const [userDialogOpen, setUserDialogOpen] = useState(() => rememberedOnBoot == null);
  const [userDialogKey, setUserDialogKey] = useState(0);

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    let cancelled = false;
    void listUsersViaApi().then((users) => {
      if (cancelled) return;
      if (users === null) return;
      setKnownUsers(users);
      const id = userIdRef.current;
      if (id != null && !users.some((u) => u.id === id)) {
        localStorage.removeItem(REMEMBER_KEY);
        setUserId(null);
        setUsername("");
        setUserDialogOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(KNOWN_KEY, JSON.stringify(knownUsers));
  }, [knownUsers]);

  const onSessionCommit = useCallback((user: UserResponse, rememberMe: boolean) => {
    setUserId(user.id);
    setUsername(user.username);
    setUserDialogOpen(false);
    if (rememberMe) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ userId: user.id, username: user.username } satisfies RememberedSession),
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }, []);

  return (
    <BrowserRouter>
      <UserSessionProvider value={{ userId, username }}>
        <AppLayout
          activeUsername={username}
          onOpenUserDialog={() => {
            setUserDialogKey((k) => k + 1);
            setUserDialogOpen(true);
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/catalogue" replace />} />
            <Route path="/catalogue" element={<ProfilePage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/genre-breakdown" element={<Navigate to="/database" replace />} />
            <Route path="/top-movies" element={<Navigate to="/recommendations" replace />} />
            <Route path="/profile" element={<Navigate to="/catalogue" replace />} />
            <Route path="*" element={<Navigate to="/catalogue" replace />} />
          </Routes>
        </AppLayout>
      </UserSessionProvider>
      <UserAccountDialog
        key={`${userDialogKey}-${knownUsers.map((u) => u.id).join(",")}`}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        knownUsers={knownUsers}
        onKnownUsersChange={(users) => {
          setKnownUsers([...users]);
        }}
        onSessionCommit={onSessionCommit}
      />
    </BrowserRouter>
  );
}
