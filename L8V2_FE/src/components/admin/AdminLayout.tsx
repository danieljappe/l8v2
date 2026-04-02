import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { AdminSection } from '../../types/admin';
import { AuthUser } from '../../hooks/useAuth';

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
  user = null
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full w-full bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        unreadMessages={unreadMessages}
        onLogout={onLogout}
        user={user}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 