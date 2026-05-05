import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/app-layout";
import { USER_BUNDLES } from "lib/app-data";
import { HomePage } from "pages/home-page";
import { ProfilePage } from "pages/profile-page";

export default function App() {
  const [activeSlug, setActiveSlug] = useState(() => USER_BUNDLES[0]?.slug ?? "");

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage activeSlug={activeSlug} />} />
          <Route
            path="/profile"
            element={
              <ProfilePage activeSlug={activeSlug} onActiveSlugChange={setActiveSlug} />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
