'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ChildrenManagement } from '@/components/children/ChildrenManagement';
import { ChildDetailModal } from '@/components/children/ChildDetailModal';
import { AddChildModal } from '@/components/children/AddChildModal';
import { AttendanceRoster } from '@/components/attendance/AttendanceRoster';
import { BillingManagement } from '@/components/billing/BillingManagement';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
import { NewPaymentModal } from '@/components/billing/NewPaymentModal';
import { JournalFeed } from '@/components/journal/JournalFeed';
import { AddLogModal } from '@/components/journal/AddLogModal';
import { ParentPortal } from '@/components/parent/ParentPortal';
import { Announcements } from '@/components/announcements/Announcements';
import { AddNoticeModal } from '@/components/announcements/AddNoticeModal';
import { StaffDirectory } from '@/components/staff/StaffDirectory';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { UserProfileModal } from '@/components/auth/UserProfileModal';

// Admin Management Modals & Views
import { ParentsManagement } from '@/components/admin/ParentsManagement';
import { DaycareSettingsModal } from '@/components/admin/DaycareSettingsModal';
import { AddSectionModal } from '@/components/admin/AddSectionModal';
import { AddParentModal } from '@/components/admin/AddParentModal';
import { AddStaffModal } from '@/components/admin/AddStaffModal';

export default function Home() {
  const { activeTab, direction, role, isAuthenticated, fetchSupabaseData } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nursery-cream text-nursery-orange">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-nursery-orange to-nursery-coral flex items-center justify-center font-bold text-3xl mx-auto shadow-xl animate-bounce">
            🎈
          </div>
          <h2 className="font-bold text-xl text-slate-800">Chargement de la Garderie...</h2>
        </div>
      </div>
    );
  }

  // If not authenticated, force render Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Route Protection & Role Redirection Matrix
  const isEducator = role === 'educator' || role === 'staff';

  const ALLOWED_TABS_PER_ROLE: Record<string, string[]> = {
    admin: ['dashboard', 'children', 'parents', 'attendance', 'billing', 'journal', 'announcements', 'staff', 'parentPortal'],
    educator: ['attendance', 'children', 'journal', 'announcements', 'staff'],
    staff: ['attendance', 'children', 'journal', 'announcements', 'staff'],
    parent: ['parentPortal', 'announcements'],
  };

  const DEFAULT_TAB_PER_ROLE: Record<string, string> = {
    admin: 'dashboard',
    educator: 'attendance',
    staff: 'attendance',
    parent: 'parentPortal',
  };

  const effectiveRole = isEducator ? 'educator' : role;
  const allowedTabs = ALLOWED_TABS_PER_ROLE[effectiveRole] || ALLOWED_TABS_PER_ROLE.admin;
  const currentTab = allowedTabs.includes(activeTab) ? activeTab : DEFAULT_TAB_PER_ROLE[effectiveRole];

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return role === 'admin' ? <AdminDashboard /> : <AttendanceRoster />;
      case 'children':
        return <ChildrenManagement />;
      case 'parents':
        return role === 'admin' ? <ParentsManagement /> : <AttendanceRoster />;
      case 'attendance':
        return <AttendanceRoster />;
      case 'billing':
        return role === 'admin' ? <BillingManagement /> : <AttendanceRoster />;
      case 'journal':
        return <JournalFeed />;
      case 'announcements':
        return <Announcements />;
      case 'staff':
        return <StaffDirectory />;
      case 'parentPortal':
        return <ParentPortal />;
      default:
        return role === 'parent' ? <ParentPortal /> : isEducator ? <AttendanceRoster /> : <AdminDashboard />;
    }
  };

  return (
    <div dir={direction} className="min-h-screen flex flex-col bg-nursery-cream">
      {/* Header Bar */}
      <Header />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {renderTabContent()}
        </main>
      </div>

      {/* Global Modals Layer */}
      <UserProfileModal />
      <AddChildModal />
      <ChildDetailModal />
      <ReceiptModal />
      <NewPaymentModal />
      <AddLogModal />
      <AddNoticeModal />

      {/* Admin Management Modals */}
      <DaycareSettingsModal />
      <AddSectionModal />
      <AddParentModal />
      <AddStaffModal />
    </div>
  );
}
