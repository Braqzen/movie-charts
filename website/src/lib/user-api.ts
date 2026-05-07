export type CreateUserResponse = {
  id?: number;
  username?: string;
};

export type UserResponse = {
  id: number;
  username: string;
};

export async function listUsersViaApi(): Promise<string[]> {
  const res = await fetch("/api/users");
  if (!res.ok) return [];

  const data = (await res.json()) as UserResponse[];
  return data
    .map((u) => u.username.trim())
    .filter((u) => u !== "")
    .toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export async function createUserViaApi(username: string): Promise<string> {
  const trimmed = username.trim();
  if (!trimmed) throw new Error("Username is required.");

  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: trimmed }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }

  try {
    const data = (await res.json()) as CreateUserResponse;
    if (typeof data.username === "string" && data.username.trim() !== "") {
      return data.username.trim();
    }
  } catch {
    /* non-JSON OK */
  }

  return trimmed;
}
