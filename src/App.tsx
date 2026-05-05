import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/app-layout";
import { USER_BUNDLES } from "lib/app-data";
import { GenreBreakdownPage } from "pages/genre-breakdown-page";
import { ProfilePage } from "pages/profile-page";
import { TopMoviesPage } from "pages/top-movies-page";

export default function App() {
  const [activeSlug, setActiveSlug] = useState(() => USER_BUNDLES[0]?.slug ?? "");

  return (
    <BrowserRouter>
      <AppLayout activeSlug={activeSlug} onActiveSlugChange={setActiveSlug}>
        <Routes>
          <Route path="/" element={<Navigate to="/top-movies" replace />} />
          <Route path="/top-movies" element={<TopMoviesPage activeSlug={activeSlug} />} />
          <Route path="/genre-breakdown" element={<GenreBreakdownPage activeSlug={activeSlug} />} />
          <Route path="/catalogue" element={<ProfilePage activeSlug={activeSlug} />} />
          <Route path="/profile" element={<Navigate to="/catalogue" replace />} />
          <Route path="*" element={<Navigate to="/top-movies" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
