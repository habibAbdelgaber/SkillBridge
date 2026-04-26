import { Route, Routes } from "react-router-dom";

import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { MainLayout } from "@/components/layout/MainLayout";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProviderRegistrationPage } from "@/pages/auth/ProviderRegistrationPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordConfirmPage } from "@/pages/auth/ResetPasswordConfirmPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { VerifyEmailSentPage } from "@/pages/auth/VerifyEmailSentPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      {/* All routes share the global navbar + footer via MainLayout. */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />

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
