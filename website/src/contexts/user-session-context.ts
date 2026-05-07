import { createContext } from "react";

export type UserSessionValue = {
  userId: number | null;
  username: string;
};

export const UserSessionContext = createContext<UserSessionValue | null>(null);
