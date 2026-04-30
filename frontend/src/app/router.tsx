import { Route, Routes } from "react-router-dom";

import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProviderRegistrationPage } from "@/pages/auth/ProviderRegistrationPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordConfirmPage } from "@/pages/auth/ResetPasswordConfirmPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { VerifyEmailSentPage } from "@/pages/auth/VerifyEmailSentPage";
import { LandingPage } from "@/pages/LandingPage";
import { MarketplacePage } from "@/pages/marketplace/MarketplacePage";
import { ProviderProfilePage } from "@/pages/marketplace/ProviderProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      {/* Public marketing surface uses its own navbar/footer IA. The
          marketplace + provider profile share that shell so users can
          jump from the landing page into discovery without a layout
          flicker. */}
      <Route element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/providers/:providerId" element={<ProviderProfilePage />} />
      </Route>

      {/* Everything else still rides on the in-app shell. */}
      <Route element={<MainLayout />}>
        {/* Auth flows. RedirectIfAuthed bounces signed-in users out of the
            signup funnel so they can't re-enter it. */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <RegisterPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register/provider"
          element={
            <RedirectIfAuthed>
              <ProviderRegistrationPage />
            </RedirectIfAuthed>
          }
        />
        <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
        <Route path="/verify-email/:key" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPasswordConfirmPage />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
