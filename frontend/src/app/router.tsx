import { Route, Routes } from "react-router-dom";

import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ProviderRegistrationPage } from "@/pages/auth/ProviderRegistrationPage";
import { ResetPasswordConfirmPage } from "@/pages/auth/ResetPasswordConfirmPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { VerifyEmailSentPage } from "@/pages/auth/VerifyEmailSentPage";
import { BookingConfirmationPage } from "@/pages/booking/BookingConfirmationPage";
import { BookingFailurePage } from "@/pages/booking/BookingFailurePage";
import { BookingPage } from "@/pages/booking/BookingPage";
import { BookingSuccessPage } from "@/pages/booking/BookingSuccessPage";
import { CustomerDashboardPage } from "@/pages/dashboard/CustomerDashboardPage";
import { ProviderDashboardPage } from "@/pages/dashboard/ProviderDashboardPage";
import { HomePage } from "@/pages/HomePage";
import { LandingPage } from "@/pages/LandingPage";
import { MarketplacePage } from "@/pages/marketplace/MarketplacePage";
import { ProviderProfilePage } from "@/pages/marketplace/ProviderProfilePage";
import { ServiceMapPage } from "@/pages/marketplace/ServiceMapPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      {/* Dashboards own their full-page sidebar layout. */}
      <Route
        path="/dashboard/provider"
        element={
          <RequireAuth>
            <ProviderDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/provider/*"
        element={
          <RequireAuth>
            <ProviderDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/customer"
        element={
          <RequireAuth>
            <CustomerDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/customer/*"
        element={
          <RequireAuth>
            <CustomerDashboardPage />
          </RequireAuth>
        }
      />
      {/* Marketing and marketplace pages share one public shell. */}
      <Route element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/providers/:providerId" element={<ProviderProfilePage />} />
        <Route path="/services/:serviceId/map" element={<ServiceMapPage />} />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        {/* RequireAuth reopens the login modal and returns guests here. */}
        <Route
          path="/book/:serviceId"
          element={
            <RequireAuth>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <RequireAuth>
              <BookingConfirmationPage />
            </RequireAuth>
          }
        />
        {/* Payment result screens read their details from location state. */}
        <Route
          path="/booking/success"
          element={
            <RequireAuth>
              <BookingSuccessPage />
            </RequireAuth>
          }
        />
        <Route
          path="/booking/failure"
          element={
            <RequireAuth>
              <BookingFailurePage />
            </RequireAuth>
          }
        />
      </Route>

      <Route element={<MainLayout />}>
        {/* Provider onboarding stays route-based; login/signup are modal-only. */}
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
