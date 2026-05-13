import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { communityService } from './modules/community/api/communityService';
import { reportingService } from './modules/reporting/api/reportingService';
import { DashboardLayout } from './shared/components/layout/DashboardLayout';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { BeneficiariesPage } from './modules/beneficiaries/pages/BeneficiariesPage';
import { AuditLogsPage } from './modules/monitoring/pages/AuditLogsPage';
import { UsersPage } from './modules/users/pages/UsersPage';
import { BeneficiaryDetailPage } from './modules/beneficiaries/pages/BeneficiaryDetailPage';
import { RegisterBeneficiaryPage } from './modules/beneficiaries/pages/RegisterBeneficiaryPage';
import { BursariesPage } from './modules/bursaries/pages/BursariesPage';
import { BursaryApplicationPage } from './modules/bursaries/pages/BursaryApplicationPage';
import { BursaryDetailPage } from './modules/bursaries/pages/BursaryDetailPage';
import { BursaryReportsPage } from './modules/bursaries/pages/BursaryReportsPage';
import { LoansPage } from './modules/loans/pages/LoansPage';
import { BusinessMonitoringPage } from './modules/monitoring/pages/BusinessMonitoringPage';
import { EfficiencyDashboardPage } from './modules/monitoring/pages/EfficiencyDashboardPage';
import { MonitoringHubPage } from './modules/monitoring/pages/MonitoringHubPage';
import { CommunityEngagementPage } from './modules/monitoring/pages/CommunityEngagementPage';
import { MeDashboardPage } from './modules/monitoring/pages/MeDashboardPage';
import { UnifiedReportingPage } from './modules/reporting/pages/UnifiedReportingPage';
import { NotificationsPage } from './modules/notifications/pages/NotificationsPage';
import { NotificationSettingsPage } from './modules/notifications/pages/NotificationSettingsPage';
import { ScorecardPortalPage } from './modules/community/pages/ScorecardPortalPage';
import { PublicDisclosurePage } from './modules/community/pages/PublicDisclosurePage';
import { ConstituenciesPage } from './modules/system/pages/ConstituenciesPage';
import { SdgTargetsPage } from './modules/sdg/pages/SdgTargetsPage';
import { CommunityProjectsPage } from './modules/community/pages/CommunityProjectsPage';
import { QuarterlyReportsPage } from './modules/community/pages/QuarterlyReportsPage';
import { useAuth } from './modules/auth/AuthContext';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { UserRole } from './shared/types/auth';

const ProtectedRoute = ({ children, requiredRoles }: { children: React.ReactNode, requiredRoles?: UserRole[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-none animate-spin"></div>
          <p className="text-white/40 font-bold text-[10px] animate-pulse tracking-[0.3em] uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  // FR-CE-006 + FR-RPT-006: run scheduled jobs on boot (in production a cron worker would do this).
  useEffect(() => {
    communityService.dispatchUpcomingDeadlineReminders();
    reportingService.runDueSchedules();
    const interval = setInterval(() => {
      communityService.dispatchUpcomingDeadlineReminders();
      reportingService.runDueSchedules();
    }, 60 * 60 * 1000); // hourly
    return () => clearInterval(interval);
  }, []);

  return (
    <Routes>
      {/* Public, no-auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/public/scorecard" element={<ScorecardPortalPage />} />
      <Route path="/public/disclosure" element={<PublicDisclosurePage />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      } />

      <Route path="/notification-settings" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <NotificationSettingsPage />
        </ProtectedRoute>
      } />

      <Route path="/beneficiaries" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FIELD_OFFICER, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <BeneficiariesPage />
        </ProtectedRoute>
      } />

      <Route path="/beneficiaries/register" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FIELD_OFFICER]}>
          <RegisterBeneficiaryPage />
        </ProtectedRoute>
      } />

      <Route path="/beneficiaries/:id" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FIELD_OFFICER, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <BeneficiaryDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/bursaries" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FINANCE_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR, UserRole.BENEFICIARY]}>
          <BursariesPage />
        </ProtectedRoute>
      } />

      <Route path="/bursaries/apply" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.BENEFICIARY]}>
          <BursaryApplicationPage />
        </ProtectedRoute>
      } />

      <Route path="/bursaries/reports" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <BursaryReportsPage />
        </ProtectedRoute>
      } />

      <Route path="/bursaries/:id" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FINANCE_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR]}>
          <BursaryDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/loans" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.FINANCE_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER, UserRole.AUDITOR]}>
          <LoansPage />
        </ProtectedRoute>
      } />

      <Route path="/monitoring" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER]}>
          <BusinessMonitoringPage />
        </ProtectedRoute>
      } />

      <Route path="/efficiency" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <EfficiencyDashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/field-monitoring" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER]}>
          <MonitoringHubPage />
        </ProtectedRoute>
      } />

      <Route path="/engagement" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER]}>
          <CommunityEngagementPage />
        </ProtectedRoute>
      } />

      <Route path="/me-analytics" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER]}>
          <MeDashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.COUNCIL_OFFICER, UserRole.AUDITOR]}>
          <UnifiedReportingPage />
        </ProtectedRoute>
      } />

      <Route path="/audit-logs" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <AuditLogsPage />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <UsersPage />
        </ProtectedRoute>
      } />

      <Route path="/constituencies" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
          <ConstituenciesPage />
        </ProtectedRoute>
      } />

      <Route path="/sdg-targets" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <SdgTargetsPage />
        </ProtectedRoute>
      } />

      <Route path="/community-projects" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.FIELD_OFFICER]}>
          <CommunityProjectsPage />
        </ProtectedRoute>
      } />

      <Route path="/quarterly-reports" element={
        <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.COUNCIL_OFFICER, UserRole.ME_OFFICER, UserRole.AUDITOR]}>
          <QuarterlyReportsPage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
