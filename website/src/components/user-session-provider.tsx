import { type ReactNode } from "react";
import { UserSessionContext, type UserSessionValue } from "contexts/user-session-context";

export function UserSessionProvider({
  value,
  children,
}: {
  value: UserSessionValue;
  children: ReactNode;
}) {
  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}
