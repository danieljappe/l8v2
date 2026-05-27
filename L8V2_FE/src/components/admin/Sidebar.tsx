import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminSection } from '../../types/admin';
import type { AuthUser } from '../../hooks/useAuth';
import type { User as ApiUser } from '../../services/api';
import { apiService } from '../../services/api';

interface SidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  unreadMessages: number;
  onLogout: () => void;
  user?: AuthUser | null;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>
      </svg>
    ),
  },
  {
    id: 'events',
    label: 'Events',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
      </svg>
    ),
  },
  {
    id: 'artists',
    label: 'Artists',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'venues',
    label: 'Venues',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13Z"/><circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
      </svg>
    ),
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-1L3 21l2-5.5a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/>
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
      </svg>
    ),
  },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  unreadMessages,
  onLogout,
  user = null,
}: SidebarProps) {
  const [profile, setProfile] = useState<ApiUser | null>(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    apiService.getUser(user.id).then((res) => {
      if (active && res.data) setProfile(res.data);
    }).catch(() => { /* noop */ });
    return () => { active = false; };
  }, [user?.id]);

  const displayName = useMemo(() => {
    if (profile) {
      const parts = [(profile as ApiUser & { firstName?: string; lastName?: string }).firstName, (profile as ApiUser & { firstName?: string; lastName?: string }).lastName].filter(Boolean).join(' ').trim();
      return parts || profile.name || profile.email || 'Admin';
    }
    return user?.name || user?.email || 'Admin';
  }, [profile, user]);

  const displayEmail = useMemo(() => profile?.email || user?.email || '', [profile, user]);

  const avatarLetter = displayName.charAt(0).toUpperCase() || 'A';
  const avatarUrl = (profile as (ApiUser & { imageUrl?: string }) | null)?.imageUrl;

  return (
    <aside className="a-sb">
      {/* Brand */}
      <div className="a-sb-brand">
        <div className="a-sb-mark">L8</div>
        <div className="a-sb-name">
          <h1>L8 Events</h1>
          <small>Admin</small>
        </div>
      </div>

      {/* Nav */}
      <nav className="a-sb-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`a-sb-link${activeSection === item.id ? ' is-active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.icon}
            {item.label}
            {item.id === 'messages' && unreadMessages > 0 && (
              <span className="a-sb-badge">{unreadMessages}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="a-sb-footer">
        <div className="a-sb-footer-user">
          <div className="a-sb-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              avatarLetter
            )}
          </div>
          <div className="a-sb-who">
            <div className="nm">{displayName}</div>
            {displayEmail && <div className="em">{displayEmail}</div>}
          </div>
        </div>
        <div className="a-sb-footer-actions">
          <Link to="/" className="a-sb-footer-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Site
          </Link>
          <button className="a-sb-footer-btn danger" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
