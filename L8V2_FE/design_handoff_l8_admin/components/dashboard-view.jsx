// Dashboard — overview pulling signal from every section.
// Read-only entry point; clicking through navigates to the relevant section.

const { I, monogram, colorFromName } = window;

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  const d = new Date('2026-05-19T14:00:00');
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function DashboardPage({ user, onNavigate }) {
  const events = window.EVENTS;
  const artists = window.ARTISTS;
  const venues = window.VENUES;
  const gallery = window.GALLERY;
  const messages = window.MESSAGES;
  const users = window.USERS;

  // ── derived metrics ──
  const upcoming = events.filter(e => e.status === 'upcoming');
  const nextUp = [...upcoming].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const unreadMessages = messages
    .filter(m => !m.isRead && m.status !== 'spam' && m.status !== 'archived')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentMessages = [...messages]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const eventStatusCounts = {
    upcoming:  events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed').length,
    draft:     events.filter(e => e.status === 'draft').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  };
  const totalEvents = events.length;
  const bookableArtists = artists.filter(a => a.isBookable).length;
  const publishedPhotos = gallery.filter(g => g.isPublished).length;

  // Tickets sold across upcoming events
  const ticketsSoldUpcoming = upcoming.reduce((s, e) => s + (e.sold || 0), 0);
  const ticketsCapUpcoming  = upcoming.reduce((s, e) => s + (e.capacity || 0), 0);

  // Recent uploads (most recent 8 photos)
  const recentUploads = [...gallery]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  // ── render ──
  return (
    <>
      <div className="topbar">
        <div className="dash-greeting">
          <div>
            <div className="date-line">{todayLabel()}</div>
            <h2>{timeOfDayGreeting()}, {user?.firstName || 'there'}.</h2>
            <div className="sub" style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 4 }}>
              {upcoming.length} upcoming event{upcoming.length === 1 ? '' : 's'}
              {unreadMessages.length > 0 && (
                <>, <strong style={{ color: 'var(--accent)' }}>{unreadMessages.length} unread message{unreadMessages.length === 1 ? '' : 's'}</strong></>
              )}.
            </div>
          </div>
          <div className="quick-actions">
            <button className="btn" onClick={() => onNavigate('messages')}>
              <I name="message" /> Inbox
            </button>
            <button className="btn" onClick={() => onNavigate('artists')}>
              <I name="users" /> Roster
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('events')}>
              <I name="plus" /> New event
            </button>
          </div>
        </div>
      </div>

      <div className="body">
        <div className="dash">
          {/* ── KPI row ──────────────────────────── */}
          <div className="dash-stats">
            <div className="stat-card" onClick={() => onNavigate('events')}>
              <div className="label"><I name="calendar" /> Upcoming</div>
              <div className="num">{eventStatusCounts.upcoming}</div>
              <div className="sub">
                <span className="strong">{totalEvents}</span> total this year
              </div>
            </div>
            <div className="stat-card" onClick={() => onNavigate('messages')}>
              <div className="label"><I name="message" /> Unread inbox</div>
              <div className="num">
                <span className={unreadMessages.length > 0 ? 'accent' : ''}>{unreadMessages.length}</span>
              </div>
              <div className="sub">
                {messages.filter(m => m.status === 'new').length} new ·{' '}
                {messages.filter(m => m.status === 'open').length} open
              </div>
            </div>
            <div className="stat-card" onClick={() => onNavigate('artists')}>
              <div className="label"><I name="users" /> Roster</div>
              <div className="num">{artists.length}</div>
              <div className="sub">
                <span className="strong">{bookableArtists}</span> bookable · {artists.length - bookableArtists} off-roster
              </div>
            </div>
            <div className="stat-card" onClick={() => onNavigate('events')}>
              <div className="label"><I name="ticket" /> Tickets sold</div>
              <div className="num">{ticketsSoldUpcoming.toLocaleString()}</div>
              <div className="sub">
                of <span className="strong">{ticketsCapUpcoming.toLocaleString()}</span> upcoming capacity
              </div>
            </div>
          </div>

          {/* ── Main 2-col grid ────────────────── */}
          <div className="dash-grid">
            {/* LEFT: Upcoming events */}
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div>
                  <h3>Next up</h3>
                  <div className="sub">The closest events on the calendar.</div>
                </div>
                <button className="more" onClick={() => onNavigate('events')}>
                  All events <I name="arrow-right" size={12} />
                </button>
              </div>
              <div className="dash-panel-body">
                {nextUp.length === 0
                  ? <div className="empty" style={{ padding: 40 }}>
                      <h3 className="ttl">Nothing on the calendar.</h3>
                      <p>Create your next event to get started.</p>
                    </div>
                  : nextUp.map(ev => {
                    const venue = window.venueById(ev.venueId);
                    const d = window.fmtDateParts(ev.date);
                    const pct = ev.capacity ? Math.min(100, (ev.sold / ev.capacity) * 100) : 0;
                    return (
                      <div key={ev.id} className="up-event" onClick={() => onNavigate('events')}>
                        <div className="date-box">
                          <span className="day">{d.day}</span>
                          <span className="mo">{d.month}</span>
                        </div>
                        <div className="info">
                          <h4 className="t">{ev.title}</h4>
                          <div className="meta">
                            <span className="mi"><I name="clock" /> {ev.time}{ev.endTime ? `–${ev.endTime}` : ''}</span>
                            {venue && <span className="mi"><I name="pin" /> {venue.name}</span>}
                            <span className="mi"><I name="users" /> {ev.artistIds.length} artist{ev.artistIds.length === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                        <div className="side">
                          <span className="ratio">{ev.sold.toLocaleString()} / {ev.capacity.toLocaleString()}</span>
                          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* RIGHT: Inbox preview */}
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div>
                  <h3>Inbox</h3>
                  <div className="sub">
                    {unreadMessages.length > 0
                      ? <><strong style={{ color: 'var(--accent)' }}>{unreadMessages.length} unread</strong></>
                      : 'All caught up.'}
                  </div>
                </div>
                <button className="more" onClick={() => onNavigate('messages')}>
                  Open inbox <I name="arrow-right" size={12} />
                </button>
              </div>
              <div className="dash-panel-body">
                {recentMessages.map(m => (
                  <div key={m.id} className="inbox-prev-row" onClick={() => onNavigate('messages')}>
                    {!m.isRead && <span className="ip-dot" />}
                    {m.isRead && <span style={{ width: 6, marginTop: 8, flexShrink: 0 }} />}
                    <div className="ip-main">
                      <div className="ip-top">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        <span className="time">{window.fmtRelative(m.createdAt)}</span>
                      </div>
                      <div className={`ip-subj ${!m.subject ? 'empty' : ''}`}>
                        {m.subject || '(no subject)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Bottom row ──────────────────────── */}
          <div className="dash-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            {/* LEFT: Recent uploads + Event status spread */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <h3>Recent uploads</h3>
                    <div className="sub">{publishedPhotos} of {gallery.length} photos published.</div>
                  </div>
                  <button className="more" onClick={() => onNavigate('gallery')}>
                    Gallery <I name="arrow-right" size={12} />
                  </button>
                </div>
                <div className="recent-up">
                  {recentUploads.map(g => (
                    <div
                      key={g.id}
                      className="ru-tile"
                      style={{ '--img-bg': colorFromName(g.filename) }}
                      title={g.filename}
                      onClick={() => onNavigate('gallery')}
                    >
                      {!g.isPublished && <div className="ru-draft">Draft</div>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <h3>Event status</h3>
                    <div className="sub">All-time spread.</div>
                  </div>
                </div>
                <div className="status-spread">
                  <div className="spread-bar">
                    {['upcoming','completed','draft','cancelled'].map(k => {
                      const c = eventStatusCounts[k];
                      if (!c) return null;
                      const pct = (c / totalEvents) * 100;
                      return <i key={k} className={k} style={{ width: `${pct}%` }} />;
                    })}
                  </div>
                  <div className="legend">
                    {['upcoming','completed','draft','cancelled'].map(k => (
                      <span key={k} className={k}>
                        <span style={{ textTransform: 'capitalize' }}>{k}</span>
                        <span className="ct">{eventStatusCounts[k]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT: Team mini */}
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div>
                  <h3>Team</h3>
                  <div className="sub">{users.length} member{users.length === 1 ? '' : 's'} · {venues.length} venues</div>
                </div>
                <button className="more" onClick={() => onNavigate('users')}>
                  Users <I name="arrow-right" size={12} />
                </button>
              </div>
              <div className="dash-panel-body">
                {users.slice(0, 4).map(u => {
                  const name = `${u.firstName} ${u.lastName}`;
                  return (
                    <div key={u.id} className="team-mini" onClick={() => onNavigate('users')}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: colorFromName(name),
                        color: 'white',
                        display: 'grid', placeItems: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: 13, letterSpacing: '-0.02em', lineHeight: 1,
                        flexShrink: 0, overflow: 'hidden',
                      }}>
                        {u.imageUrl
                          ? <img src={u.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : monogram(name)}
                      </div>
                      <div className="nm-block">
                        <div className="nm">
                          {name}
                          {u.id === user?.id && <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9.5,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            padding: '1px 5px', borderRadius: 3,
                            background: 'var(--accent-soft)', color: 'var(--accent)',
                            marginLeft: 6,
                          }}>You</span>}
                        </div>
                        <div className="em">{u.email}</div>
                      </div>
                      <span className="role-pill role-pill-sm">{u.role}</span>
                    </div>
                  );
                })}
              </div>
              {users.length > 4 && (
                <div className="dash-panel-foot">+{users.length - 4} more</div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { DashboardPage });
