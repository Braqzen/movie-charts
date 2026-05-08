export type UserResponse = {
  id: number;
  username: string;
};

export type CreateUserResponse = {
  id: number;
  username: string;
};

export type RatingApiRow = {
  movie_id: number;
  title: string;
  genres: string[];
  rating: string;
  like: boolean;
};

export type SearchMovieRow = {
  id: number;
  title: string;
  genres: string[];
};

export type RecommendationApiRow = {
  id: number;
  title: string;
  genres: string[];
  match_count: number;
};

function sortUsers(users: readonly UserResponse[]): UserResponse[] {
  return [...users].toSorted((a, b) =>
    a.username.localeCompare(b.username, undefined, { sensitivity: "base" }),
  );
}

export async function listUsersViaApi(): Promise<UserResponse[] | null> {
  const res = await fetch("/api/users");
  if (!res.ok) return null;

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return null;

  return sortUsers(
    data
      .map((item) => {
        const u = item as UserResponse;
        return { id: u.id, username: String(u.username ?? "").trim() };
      })
      .filter((u) => typeof u.id === "number" && u.username !== ""),
  );
}

export async function createUserViaApi(username: string): Promise<UserResponse> {
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

  const data = (await res.json()) as CreateUserResponse;
  if (typeof data.username !== "string" || data.username.trim() === "") {
    return { id: data.id, username: trimmed };
  }
  return { id: data.id, username: data.username.trim() };
}

export async function fetchUserRatings(userId: number): Promise<RatingApiRow[]> {
  const res = await fetch(`/api/ratings?user_id=${encodeURIComponent(String(userId))}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
  return (await res.json()) as RatingApiRow[];
}

export async function searchMoviesViaApi(query: string): Promise<SearchMovieRow[]> {
  const q = query.trim();
  if (q === "") return [];
  const res = await fetch(`/api/movies/search?query=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
  return (await res.json()) as SearchMovieRow[];
}

export async function fetchRecommendationsViaApi(userId: number): Promise<RecommendationApiRow[]> {
  const res = await fetch(
    `/api/recommendations?user_id=${encodeURIComponent(String(userId))}`,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
  return (await res.json()) as RecommendationApiRow[];
}

export async function fetchCatalogGenreCounts(): Promise<Record<string, number>> {
  const res = await fetch("/api/catalog/genre-counts");
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
  return (await res.json()) as Record<string, number>;
}

export async function deleteRatingViaApi(input: {
  userId: number;
  movieId: number;
}): Promise<void> {
  const params = new URLSearchParams({
    user_id: String(input.userId),
    movie_id: String(input.movieId),
  });
  const res = await fetch(`/api/ratings?${params.toString()}`, { method: "DELETE" });
  if (res.status === 404) {
    throw new Error("Rating not found.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
}

export async function postRatingViaApi(input: {
  userId: number;
  movieId: number;
  rating: number;
  like: boolean;
}): Promise<void> {
  const res = await fetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: input.userId,
      movie_id: input.movieId,
      rating: input.rating,
      like: input.like,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text.includes("<html>") ? `Request failed (${res.status})` : text);
  }
}
