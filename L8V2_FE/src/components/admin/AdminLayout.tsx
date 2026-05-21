import React from 'react';
import Sidebar from './Sidebar';
import type { AdminSection } from '../../types/admin';
import type { AuthUser } from '../../hooks/useAuth';

interface AdminLayoutProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  children: React.ReactNode;
  unreadMessages: number;
  onLogout: () => void;
  user?: AuthUser | null;
}

export default function AdminLayout({
  activeSection,
  onSectionChange,
  children,
  unreadMessages,
  onLogout,
  user = null,
}: AdminLayoutProps) {
  return (
    <div className="admin-root" style={{ minHeight: '100vh' }}>
      <div className="a-shell">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          unreadMessages={unreadMessages}
          onLogout={onLogout}
          user={user}
        />
        <main className="a-main">
          {children}
        </main>
      </div>
    </div>
  );
}
