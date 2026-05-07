import { useContext } from "react";
import { UserSessionContext } from "contexts/user-session-context";

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (ctx == null) throw new Error("UserSessionProvider missing");
  return ctx;
}
