import React, { useState, useEffect } from 'react';
import type { Artist } from '../../types/admin';
import type { User } from '../../services/api';
import { apiService } from '../../services/api';
import SimpleEmbeddingInput from './SimpleEmbeddingInput';
import { normalizeSocialMedia } from '../../utils/socialMediaUtils';

interface ArtistDraft {
  name: string; bio: string; imageUrl: string; website: string;
  socialMedia: { platform: string; url: string }[];
  genre: string; isBookable: boolean; bookingUserId: string;
  embeddings: { type: string; embedCode: string }[];
}

export const emptyArtistDraft: ArtistDraft = {
  name: '', bio: '', imageUrl: '', website: '', socialMedia: [],
  genre: '', isBookable: false, bookingUserId: '', embeddings: [],
};

interface ArtistFormModalProps {
  artist: Artist | null;
  onClose: () => void;
  onSave: (artist: Artist) => void;
  draft?: ArtistDraft;
  onDraftChange?: (draft: ArtistDraft) => void;
}

function colorFromName(name: string): string {
  if (!name) return 'oklch(0.55 0.05 250)';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return `oklch(0.55 0.14 ${((h % 360) + 360) % 360})`;
}

function monogram(name: string): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'instagram', baseUrl: 'instagram.com/' },
  { key: 'spotify',   label: 'Spotify',   icon: 'music',     baseUrl: 'open.spotify.com/artist/' },
  { key: 'youtube',   label: 'YouTube',   icon: 'youtube',   baseUrl: 'youtube.com/' },
  { key: 'facebook',  label: 'Facebook',  icon: 'facebook',  baseUrl: 'facebook.com/' },
  { key: 'tiktok',    label: 'TikTok',    icon: 'tiktok',    baseUrl: 'tiktok.com/@' },
  { key: 'website',   label: 'Website',   icon: 'link',      baseUrl: '' },
];

const ArtistFormModal: React.FC<ArtistFormModalProps> = ({ artist, onSave, onClose, draft, onDraftChange }) => {
  const isEditing = !!artist;

  // Edit mode: internal state initialized from artist record.
  // Create mode: controlled draft from parent persists across closes.
  const [internalForm, setInternalForm] = useState<ArtistDraft>(emptyArtistDraft);
  const form = isEditing ? internalForm : (draft ?? emptyArtistDraft);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await apiService.getUsers();
      if (res.data) setUsers(res.data);
    };
    void load();
  }, []);

  useEffect(() => {
    if (artist) {
      setInternalForm({
        name: artist.name,
        bio: artist.bio || '',
        imageUrl: artist.imageUrl || '',
        website: artist.website || '',
        socialMedia: normalizeSocialMedia(artist.socialMedia),
        genre: artist.genre || '',
        isBookable: artist.isBookable || false,
        bookingUserId: artist.bookingUserId || '',
        embeddings: artist.embeddings ?? [],
      });
    }
    setError(null);
  }, [artist]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set<K extends keyof ArtistDraft>(field: K, val: ArtistDraft[K]) {
    if (isEditing) {
      setInternalForm(f => ({ ...f, [field]: val }));
    } else {
      onDraftChange?.({ ...form, [field]: val });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      bookingUserId: form.isBookable && form.bookingUserId ? form.bookingUserId : null,
      updatedAt: new Date().toISOString(),
    };
    if (!form.isBookable) delete (payload as Record<string, unknown>).bookingUserId;

    try {
      if (artist) {
        const res = await apiService.updateArtist(artist.id, payload);
        if (res.error) { setError(res.error); return; }
        if (res.data) { onSave(res.data); onClose(); }
      } else {
        const res = await apiService.createArtist(payload);
        if (res.error) { setError(res.error); return; }
        if (res.data) { onSave(res.data); onClose(); }
      }
    } catch {
      setError('Failed to save artist.');
    } finally {
      setSaving(false);
    }
  };

  const previewColor = colorFromName(form.name);
  const isValid = form.name.trim().length > 0;

  return (
    <>
      <div className="a-scrim" onClick={onClose} />
      <div className="a-drawer-shell">
        <div className="a-drawer-card">
          {/* Header */}
          <div className="a-form-head">
            <div className="a-form-head-l">
              <button className="a-btn a-btn-ghost a-btn-icon" type="button" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <div>
                <div className="crumb">Artists / {isEditing ? 'Edit' : 'New'}</div>
                <h3>{isEditing ? (artist.name || 'Edit artist') : 'New artist'}</h3>
              </div>
            </div>
            <div className="a-form-head-r">
              <span className="a-kbd">Esc</span>
            </div>
          </div>

          {/* Body */}
          <form className="a-form-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'oklch(0.96 0.04 28)', border: '1px solid oklch(0.85 0.08 28)', borderRadius: 6, fontSize: 13, color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div className="a-form-grid">
              {/* Name */}
              <div className="a-field full a-field-title">
                <label>Artist name <span className="req">*</span></label>
                <input
                  className="a-input"
                  placeholder="e.g. Junior Brown"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                />
              </div>

              {/* Photo */}
              <div className="a-field full">
                <label>Profile photo</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                    background: form.imageUrl ? 'transparent' : previewColor,
                    display: 'grid', placeItems: 'center',
                    color: 'white', fontFamily: 'var(--font-display)', fontSize: 26,
                    overflow: 'hidden',
                  }}>
                    {form.imageUrl
                      ? <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      : monogram(form.name) || '·'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      className="a-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                      placeholder="https://… (paste image URL)"
                      value={form.imageUrl}
                      onChange={e => set('imageUrl', e.target.value)}
                    />
                    <span className="a-hint" style={{ display: 'block', marginTop: 5 }}>1:1 ratio recommended. JPG / PNG / WebP.</span>
                  </div>
                </div>
              </div>

              {/* Genre */}
              <div className="a-field full">
                <label>Genre</label>
                <input
                  className="a-input"
                  placeholder="Indie, Hip-hop, Electronic…"
                  list="a-genre-list"
                  value={form.genre}
                  onChange={e => set('genre', e.target.value)}
                />
                <datalist id="a-genre-list">
                  {['Indie', 'Pop', 'Hip-hop', 'Electronic', 'R&B', 'Folk', 'Alt-rock', 'Punk', 'Jazz', 'Singer-songwriter'].map(g => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              {/* Bio */}
              <div className="a-field full">
                <label>Bio</label>
                <textarea
                  className="a-textarea"
                  rows={4}
                  placeholder="Short bio for press kits and the public site. 2–4 sentences."
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                />
              </div>

              {/* Website */}
              <div className="a-field full">
                <label>Website</label>
                <input
                  className="a-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
                  placeholder="https://…"
                  value={form.website}
                  onChange={e => set('website', e.target.value)}
                />
              </div>

              {/* Social media */}
              <div className="a-field full">
                <label>Social media</label>
                <div className="a-social-rows">
                  {SOCIAL_PLATFORMS.map(p => (
                    <div className="a-social-row" key={p.key}>
                      <span className="lbl">
                        <SocialIcon name={p.icon} />
                        {p.label}
                      </span>
                      <input
                        className="a-input"
                        placeholder={p.baseUrl ? `${p.baseUrl}handle` : 'URL or handle'}
                        value={form.socialMedia.find(s => s.platform === p.key)?.url || ''}
                        onChange={e => {
                          const next = form.socialMedia.filter(s => s.platform !== p.key);
                          if (e.target.value) next.push({ platform: p.key, url: e.target.value });
                          set('socialMedia', next);
                        }}
                      />
                    </div>
                  ))}
                  {/* Extra custom social entries not in SOCIAL_PLATFORMS */}
                  {form.socialMedia
                    .filter(s => !SOCIAL_PLATFORMS.some(p => p.key === s.platform))
                    .map((s, i) => (
                      <div className="a-social-row" key={`custom-${i}`}>
                        <input
                          className="a-input"
                          placeholder="Platform"
                          value={s.platform}
                          onChange={e => {
                            const next = [...form.socialMedia];
                            const idx = next.findIndex(x => x === s);
                            next[idx] = { ...s, platform: e.target.value };
                            set('socialMedia', next);
                          }}
                        />
                        <input
                          className="a-input"
                          placeholder="URL or handle"
                          value={s.url}
                          onChange={e => {
                            const next = [...form.socialMedia];
                            const idx = next.findIndex(x => x === s);
                            next[idx] = { ...s, url: e.target.value };
                            set('socialMedia', next);
                          }}
                        />
                      </div>
                    ))}
                </div>
                <span className="hint" style={{ marginTop: 6 }}>Stored as a JSON object on the artist record.</span>
              </div>

              {/* Bookable toggle */}
              <div className="a-field full">
                <label>Booking</label>
                <div
                  className="a-bookable-toggle"
                  style={{ cursor: 'pointer' }}
                  onClick={() => set('isBookable', !form.isBookable)}
                >
                  <div className="tx">
                    <strong>Available for booking through L8</strong>
                    <span>
                      {form.isBookable
                        ? 'Visible to clients in the booking marketplace.'
                        : 'Internal only — hidden from booking surfaces.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`a-switch${form.isBookable ? ' is-on' : ''}`}
                    onClick={e => { e.stopPropagation(); set('isBookable', !form.isBookable); }}
                  />
                </div>
              </div>

              {/* Booking manager */}
              {form.isBookable && (
                <div className="a-field full">
                  <label>Booking manager</label>
                  <select
                    className="a-select"
                    value={form.bookingUserId}
                    onChange={e => set('bookingUserId', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email} — {u.email}
                      </option>
                    ))}
                  </select>
                  <span className="hint">This user handles inbound booking requests for the artist.</span>
                </div>
              )}

              {/* Embeddings */}
              <div className="a-field full" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 4 }}>
                <label>Music &amp; media embeds</label>
                <span className="hint" style={{ marginBottom: 8 }}>Add Spotify, YouTube, or SoundCloud embeds.</span>
                <SimpleEmbeddingInput
                  embeddings={form.embeddings}
                  onEmbeddingsChange={embeddings => set('embeddings', embeddings)}
                  artistId={artist?.id}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="a-form-foot">
            <span className="hint">
              {isEditing
                ? `Last updated ${artist?.updatedAt ? new Date(artist.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'}.`
                : 'Only a name is required to create.'}
            </span>
            <div className="a-form-foot-r">
              <button type="button" className="a-btn a-btn-ghost" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="a-btn a-btn-primary"
                disabled={!isValid || saving}
                onClick={handleSubmit as unknown as React.MouseEventHandler}
              >
                {saving
                  ? <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'a-spin 0.7s linear infinite', marginRight: 6 }} /></>
                  : null}
                {isEditing ? 'Save changes' : 'Create artist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtistFormModal;

// Minimal inline social icons
function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={2} width={20} height={20} rx={5}/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1={17.5} y1={6.5} x2="17.51" y2={6.5}/></svg>,
    music:     <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx={6} cy={18} r={3}/><circle cx={18} cy={16} r={3}/></svg>,
    youtube:   <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>,
    facebook:  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
    tiktok:    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>,
    link:      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  };
  return <>{icons[name] ?? icons.link}</>;
}
