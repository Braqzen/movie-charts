import { type FormEvent, useCallback, useEffect, useState } from "react";
import { mergeTailwindClasses } from "lib/utils";
import { createUserViaApi, type UserResponse } from "lib/user-api";

const overlayButton = "absolute inset-0 bg-background/55 backdrop-blur-md dark:bg-background/65";

type UserAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knownUsers: readonly UserResponse[];
  onKnownUsersChange: (users: readonly UserResponse[]) => void;
  onSessionCommit: (user: UserResponse, rememberMe: boolean) => void;
};

export function UserAccountDialog({
  open,
  onOpenChange,
  knownUsers,
  onKnownUsersChange,
  onSessionCommit,
}: UserAccountDialogProps) {
  const [pendingUsername, setPendingUsername] = useState(() => knownUsers[0]?.username ?? "");
  const [newUsername, setNewUsername] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const closeModal = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const applyPendingUser = useCallback(() => {
    const u = knownUsers.find((x) => x.username === pendingUsername.trim());
    if (u == null) return;
    onSessionCommit(u, rememberMe);
  }, [knownUsers, onSessionCommit, pendingUsername, rememberMe]);

  const onCreateSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setCreateError(null);
      setCreateBusy(true);
      try {
        const created = await createUserViaApi(newUsername);
        const next = [...knownUsers.filter((x) => x.id !== created.id), created].toSorted((a, b) =>
          a.username.localeCompare(b.username, undefined, { sensitivity: "base" }),
        );
        onKnownUsersChange(next);
        onSessionCommit(created, rememberMe);
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : "Create failed.");
      } finally {
        setCreateBusy(false);
      }
    },
    [newUsername, knownUsers, onKnownUsersChange, onSessionCommit, rememberMe],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className={overlayButton}
        aria-label="Close user dialog"
        onClick={closeModal}
      />
      <div
        className="table-elevated-surface relative z-10 flex max-h-[min(92dvh,calc(100vh-1.5rem))] w-full max-w-md flex-col overflow-hidden rounded-xl shadow-lg sm:max-h-[min(92dvh,calc(100vh-3rem))]"
        role="dialog"
        aria-modal="true"
        aria-label="User account"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">User</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>
        <div className="hide-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me in this browser
          </label>

          {knownUsers.length === 1 ? (
            <section className="space-y-3" aria-label="Continue as user">
              <button
                type="button"
                onClick={() => {
                  onSessionCommit(knownUsers[0], rememberMe);
                }}
                className={mergeTailwindClasses(
                  "table-elevated-surface h-10 w-full rounded-md text-sm font-medium text-foreground",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                Continue as {knownUsers[0].username}
              </button>
            </section>
          ) : null}

          {knownUsers.length > 1 ? (
            <section className="space-y-3" aria-label="Known users">
              <h3 className="text-sm font-semibold text-foreground">Select user</h3>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {knownUsers.map((u) => {
                  const selected = pendingUsername === u.username;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingUsername(u.username);
                        }}
                        className={mergeTailwindClasses(
                          "w-full rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "bg-muted-foreground/28 text-foreground dark:bg-muted-foreground/36"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        {u.username}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={applyPendingUser}
                disabled={!knownUsers.some((u) => u.username === pendingUsername.trim())}
                className={mergeTailwindClasses(
                  "table-elevated-surface h-10 w-full rounded-md text-sm font-medium text-foreground",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                Use selected user
              </button>
            </section>
          ) : null}

          <section
            className={mergeTailwindClasses(
              "space-y-3",
              knownUsers.length >= 1 ? "border-t border-border pt-4" : "",
            )}
            aria-label="Create user"
          >
            <h3 className="text-sm font-semibold text-foreground">Create user</h3>
            <form onSubmit={onCreateSubmit} className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">
                Username
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value);
                  }}
                  className={mergeTailwindClasses(
                    "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  disabled={createBusy}
                />
              </label>
              {createError != null ? (
                <p className="text-sm text-destructive" role="alert">
                  {createError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={createBusy || newUsername.trim() === ""}
                className={mergeTailwindClasses(
                  "table-elevated-surface h-10 w-full rounded-md text-sm font-medium text-foreground",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {createBusy ? "Sending..." : "Create user"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
