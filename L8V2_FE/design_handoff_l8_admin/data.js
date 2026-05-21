// L8 Events — mock data
// Drawn from the existing admin panel screenshots.

// Users / team — full schema match.
// Daniel (u-001) is the logged-in user.
const USERS = [
  { id: 1, uuid: 'u-001',
    firstName: 'Daniel', lastName: 'Petersen',
    email: 'daniel@l8events.dk',
    role: 'admin',
    phoneNumber: '+45 28 71 11 04',
    imageUrl: null,
    address: 'Sankt Hans Gade 12, 2200 København N', // not in schema
    createdAt: '2022-04-01', updatedAt: '2025-11-12' },
  { id: 2, uuid: 'u-002',
    firstName: 'Mette', lastName: 'Lindahl',
    email: 'mette@l8events.dk',
    role: 'manager',
    phoneNumber: '+45 22 18 73 09',
    imageUrl: null,
    address: null,
    createdAt: '2022-09-15', updatedAt: '2025-09-30' },
  { id: 3, uuid: 'u-003',
    firstName: 'Jonas', lastName: 'Riise',
    email: 'jonas@l8events.dk',
    role: 'manager',
    phoneNumber: '+45 60 14 02 88',
    imageUrl: null,
    address: null,
    createdAt: '2023-02-20', updatedAt: '2025-10-04' },
  { id: 4, uuid: 'u-004',
    firstName: 'Alma', lastName: 'Bergmann',
    email: 'alma@l8events.dk',
    role: 'editor',
    phoneNumber: null,
    imageUrl: null,
    address: null,
    createdAt: '2024-06-01', updatedAt: '2025-08-12' },
  { id: 5, uuid: 'u-005',
    firstName: 'Theo', lastName: 'Krogh',
    email: 'theo@l8events.dk',
    role: 'viewer',
    phoneNumber: '+45 51 92 14 07',
    imageUrl: null,
    address: null,
    createdAt: '2025-03-18', updatedAt: '2025-11-01' },
];

const USER_ROLES = ['admin', 'manager', 'editor', 'viewer'];

// Derived from USERS — kept for compatibility with existing references
// (artist.bookingUserId dropdown, etc.).
const BOOKING_USERS = USERS.map(u => ({
  id: u.uuid,
  name: `${u.firstName} ${u.lastName}`,
  email: u.email,
}));

// Artists — matches DB schema:
// id (uuid), name, bio, imageUrl, socialMedia (json string),
// genre, createdAt, updatedAt, embeddings (json), isBookable, bookingUserId
const ARTISTS = [
  { id: 1,  uuid: 'a-001', name: 'Junior Brown',     genre: 'Indie',
    bio: 'Copenhagen-based five-piece. Sun-warmed indie pop with a krautrock pulse. Debut LP "Hverdag" out now on Heller Records.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-001',
    socialMedia: { instagram: 'juniorbrown.band', spotify: 'JuniorBrownDK', website: 'juniorbrown.dk' },
    createdAt: '2023-04-12', updatedAt: '2025-09-30' },
  { id: 2,  uuid: 'a-002', name: 'BASIS',            genre: 'Hip-hop',
    bio: 'Producer/MC duo from Nørrebro. Genre-fluid, hook-driven, frequent collaborators with the Distortion crew.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-002',
    socialMedia: { instagram: 'basis.cph', spotify: 'BASIS' },
    createdAt: '2022-11-04', updatedAt: '2025-10-12' },
  { id: 3,  uuid: 'a-003', name: 'Skomager',         genre: 'Alt-rock',
    bio: 'Trio formed at Rytmisk in 2024. Loud, melodic, smart. Heavy rotation on P6 Beat.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-001',
    socialMedia: { instagram: 'skomager.dk' },
    createdAt: '2024-02-20', updatedAt: '2025-08-04' },
  { id: 4,  uuid: 'a-004', name: 'Chrome!',          genre: 'Punk',
    bio: 'Two guitars, no compromise. Aarhus by way of Berlin. Forthcoming album recorded live to tape.',
    imageUrl: null, isBookable: false, bookingUserId: null,
    socialMedia: { instagram: 'chromepunk', bandcamp: 'chrome-punk' },
    createdAt: '2023-08-18', updatedAt: '2025-07-22' },
  { id: 5,  uuid: 'a-005', name: 'Olivver',          genre: 'Pop',
    bio: 'Songwriter, producer, voice. Recent collaborations include Hjalmer and Smerz. New album in spring.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-002',
    socialMedia: { instagram: 'olivvermusic', spotify: 'Olivver', website: 'olivver.dk' },
    createdAt: '2022-06-09', updatedAt: '2025-11-02' },
  { id: 6,  uuid: 'a-006', name: 'Verge',            genre: 'Electronic',
    bio: 'Modular ambient and broken techno. DJ residency at Ved Siden Af.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-003',
    socialMedia: { soundcloud: 'verge-cph' },
    createdAt: '2024-01-15', updatedAt: '2025-06-18' },
  { id: 7,  uuid: 'a-007', name: 'Michael Williams', genre: 'Folk',
    bio: 'Welsh expat, Copenhagen by way of Cardiff. Solo guitar, plain-spoken songs.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-001',
    socialMedia: { instagram: 'michaelw.folk', spotify: 'MichaelWilliams' },
    createdAt: '2023-03-30', updatedAt: '2025-05-14' },
  { id: 8,  uuid: 'a-008', name: 'Valde på Mars',    genre: 'Indie',
    bio: 'Danish-language indie. Festival mainstay. Working on second EP for 2026.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-002',
    socialMedia: { instagram: 'valdepamars', spotify: 'ValdePaaMars' },
    createdAt: '2022-09-11', updatedAt: '2025-10-01' },
  { id: 9,  uuid: 'a-009', name: 'Filuka',           genre: 'R&B',
    bio: 'Soulful, low-end heavy R&B. Production hand-in-hand with BASIS.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-003',
    socialMedia: { instagram: 'filuka.official', spotify: 'Filuka' },
    createdAt: '2023-12-05', updatedAt: '2025-09-22' },
  { id: 10, uuid: 'a-010', name: 'Viktor Borges',    genre: 'Singer-songwriter',
    bio: 'Acoustic singer-songwriter from Aalborg. Frequent collaborator with Michael Williams.',
    imageUrl: null, isBookable: false, bookingUserId: null,
    socialMedia: { instagram: 'viktor.borges' },
    createdAt: '2024-05-22', updatedAt: '2025-04-30' },
  { id: 11, uuid: 'a-011', name: 'Carl Knast',       genre: 'Pop',
    bio: 'Festival-headliner. Latest single went platinum in DK. Booking handled directly.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-001',
    socialMedia: { instagram: 'carlknast', spotify: 'CarlKnast', website: 'carlknast.com' },
    createdAt: '2021-08-04', updatedAt: '2025-11-10' },
  { id: 12, uuid: 'a-012', name: 'Chanel Bigs',      genre: 'Hip-hop',
    bio: 'High-energy, sharp lyricism. Recent EP "Bevæg Dig" produced entirely by BASIS.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-002',
    socialMedia: { instagram: 'chanelbigs', spotify: 'ChanelBigs' },
    createdAt: '2023-06-14', updatedAt: '2025-08-30' },
  { id: 13, uuid: 'a-013', name: 'BobbyFRL',         genre: 'Electronic',
    bio: 'Producer, DJ, label boss. Runs the Frilager monthly at Rust.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-003',
    socialMedia: { soundcloud: 'bobbyfrl', instagram: 'bobbyfrl' },
    createdAt: '2022-04-19', updatedAt: '2025-07-08' },
  { id: 14, uuid: 'a-014', name: 'Hjalmer',          genre: 'Pop',
    bio: 'Synth-led pop. Collaborates often with Olivver. New album coming Q1.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-001',
    socialMedia: { instagram: 'hjalmermusic', spotify: 'Hjalmer' },
    createdAt: '2022-02-28', updatedAt: '2025-10-25' },
  { id: 15, uuid: 'a-015', name: 'Goss',             genre: 'Indie',
    bio: 'New on the L8 roster. First album due summer 2026.',
    imageUrl: null, isBookable: true, bookingUserId: 'u-002',
    socialMedia: { instagram: 'goss.band' },
    createdAt: '2025-01-12', updatedAt: '2025-09-15' },
];

// Venues — matches DB schema:
// id (uuid), name, description, address, city, createdAt, updatedAt, mapEmbedHtml
const VENUES = [
  { id: 1, uuid: 'v-001', name: 'SIGURD', city: 'Copenhagen',
    address: 'Sankt Hans Torv 30, 2200 København N',
    description: 'Intimate basement venue in the heart of Nørrebro. Great low-end, brick walls, no pillars — perfect for releases and album-style shows.',
    mapEmbedHtml: '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=12.555%2C55.690%2C12.565%2C55.696&layer=mapnik" width="100%" height="100%" style="border:0"></iframe>',
    createdAt: '2022-04-01', updatedAt: '2025-08-15' },
  { id: 2, uuid: 'v-002', name: 'Rust', city: 'Copenhagen',
    address: 'Guldbergsgade 8, 2200 København N',
    description: 'Two floors, three rooms. The mainstay of the Copenhagen indie circuit. House sound is solid, light rig has been refreshed in 2024.',
    mapEmbedHtml: '<iframe src="https://www.openstreetmap.org/export/embed.html" width="100%" height="100%" style="border:0"></iframe>',
    createdAt: '2022-04-01', updatedAt: '2025-10-22' },
  { id: 3, uuid: 'v-003', name: 'Roskilde Festival', city: 'Roskilde',
    address: 'Darupvej 19, 4000 Roskilde',
    description: 'Northern Europe\'s largest music festival. Eight days, eight stages, 130k attendees. Annual L8 booking on Apollo.',
    mapEmbedHtml: '',
    createdAt: '2023-01-12', updatedAt: '2025-06-30' },
  { id: 4, uuid: 'v-004', name: 'Distortion', city: 'Copenhagen',
    address: 'Various — Nørrebro, Vesterbro, Refshaleøen',
    description: 'Street parties across Copenhagen and a final island weekend. Stages are negotiated annually with the festival.',
    mapEmbedHtml: '',
    createdAt: '2023-01-12', updatedAt: '2025-06-10' },
  { id: 5, uuid: 'v-005', name: 'VEGA', city: 'Copenhagen',
    address: 'Enghavevej 40, 1674 København V',
    description: 'Lille VEGA and Store VEGA. Functionalist building, two halls, the best mid-cap room in Copenhagen.',
    mapEmbedHtml: '<iframe src="https://www.openstreetmap.org/export/embed.html" width="100%" height="100%" style="border:0"></iframe>',
    createdAt: '2022-09-01', updatedAt: '2025-11-04' },
  { id: 6, uuid: 'v-006', name: 'Pumpehuset', city: 'Copenhagen',
    address: 'Studiestræde 52, 1554 København V',
    description: 'Iconic mid-90s venue in the city centre. Good for double-bills and crossover lineups.',
    mapEmbedHtml: '<iframe src="https://www.openstreetmap.org/export/embed.html" width="100%" height="100%" style="border:0"></iframe>',
    createdAt: '2022-09-01', updatedAt: '2025-09-14' },
  { id: 7, uuid: 'v-007', name: 'Train', city: 'Aarhus',
    address: 'Toldbodgade 6, 8000 Aarhus C',
    description: 'Aarhus\' premier mid-cap. Strong relationships with both promoters and locals.',
    mapEmbedHtml: '',
    createdAt: '2023-05-20', updatedAt: '2025-07-19' },
];

const EVENTS = [
  {
    id: 1,
    title: 'Dansker Nok Releaseparty',
    artistIds: [1, 2],
    date: '2025-11-06',
    time: '19:00',
    endTime: '23:00',
    venueId: 1,
    status: 'upcoming',
    capacity: 320,
    sold: 187,
    price: 180,
    description: 'Release party for the new Dansker Nok EP. Doors at 19:00, support sets through the night, headliner at 22:00.',
    posterPalette: ['#E0623C', '#1c1b18'],
  },
  {
    id: 2,
    title: 'CHROME! & SKOMAGER',
    artistIds: [3, 4],
    date: '2025-08-16',
    time: '19:30',
    endTime: '23:30',
    venueId: 2,
    status: 'completed',
    capacity: 600,
    sold: 600,
    price: 220,
    description: 'Co-headline night. Skomager opens, Chrome! brings the new live show.',
    posterPalette: ['#2E5BFF', '#0c0d12'],
  },
  {
    id: 3,
    title: 'L8 på Roskilde Festival',
    artistIds: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    date: '2025-06-26',
    time: '15:00',
    endTime: '23:00',
    venueId: 3,
    status: 'completed',
    capacity: 4000,
    sold: 4000,
    price: 0,
    description: 'L8 takeover at Apollo. Nine artists across eight hours.',
    posterPalette: ['#F5B82E', '#1c1b18'],
  },
  {
    id: 4,
    title: 'Distortion',
    artistIds: [2, 5, 11],
    date: '2025-06-04',
    time: '14:00',
    endTime: '22:00',
    venueId: 4,
    status: 'completed',
    capacity: 2500,
    sold: 2500,
    price: 0,
    description: 'Street stage on Nørrebro. Three acts, six hours.',
    posterPalette: ['#9B5BFF', '#0c0d12'],
  },
  {
    id: 5,
    title: 'Olivver — Album Release',
    artistIds: [5],
    date: '2026-02-12',
    time: '20:00',
    endTime: '23:30',
    venueId: 5,
    status: 'upcoming',
    capacity: 1550,
    sold: 920,
    price: 260,
    description: 'Olivver headlines VEGA in support of the new album.',
    posterPalette: ['#E0623C', '#0c0d12'],
  },
  {
    id: 6,
    title: 'Hjalmer + Goss',
    artistIds: [14, 15],
    date: '2026-03-04',
    time: '20:00',
    endTime: null,
    venueId: 6,
    status: 'upcoming',
    capacity: 600,
    sold: 412,
    price: 180,
    description: 'Double bill at Pumpehuset.',
    posterPalette: ['#1F8A5B', '#0c0d12'],
  },
  {
    id: 7,
    title: 'BASIS — Tour Kickoff',
    artistIds: [2],
    date: '2026-01-22',
    time: '21:00',
    endTime: null,
    venueId: 2,
    status: 'upcoming',
    capacity: 600,
    sold: 174,
    price: 220,
    description: 'First night of the 12-date European tour.',
    posterPalette: ['#2E5BFF', '#0c0d12'],
  },
  {
    id: 8,
    title: 'Carl Knast at Train',
    artistIds: [11],
    date: '2025-10-18',
    time: '20:00',
    endTime: '23:00',
    venueId: 7,
    status: 'draft',
    capacity: 1200,
    sold: 0,
    price: 240,
    description: 'Aarhus date — on hold, awaiting venue confirmation.',
    posterPalette: ['#444', '#1c1b18'],
  },
];

// Helpers
function artistsById(ids) {
  return ids.map(id => ARTISTS.find(a => a.id === id)).filter(Boolean);
}
function venueById(id) {
  return VENUES.find(v => v.id === id) || null;
}
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}
function fmtDateParts(iso) {
  const [y, m, d] = iso.split('-');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return { day: String(parseInt(d)).padStart(2,'0'), month: months[parseInt(m)-1], year: y };
}
function fmtMonthGroup(iso) {
  const [y, m] = iso.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m)-1]} ${y}`;
}

function eventCountForArtist(artistId) {
  return window.EVENTS.filter(ev => ev.artistIds.includes(artistId)).length;
}
function eventCountForVenue(venueId) {
  return window.EVENTS.filter(ev => ev.venueId === venueId).length;
}
function upcomingCountForVenue(venueId) {
  return window.EVENTS.filter(ev => ev.venueId === venueId && ev.status === 'upcoming').length;
}
function userById(uid) {
  return window.BOOKING_USERS.find(u => u.id === uid) || null;
}

// Gallery — matches DB schema:
// id (uuid), filename, url, caption, photographer, isPublished,
// createdAt, updatedAt, eventId (uuid?), category (enum)
const GALLERY_CATEGORIES = ['live', 'backstage', 'promo', 'portrait', 'crowd', 'soundcheck'];

const GALLERY = [
  { id: 1,  uuid: 'g-001', filename: 'dansker_nok_01.jpg',   url: 'https://cdn.l8events.dk/g/dansker_nok_01.jpg',
    caption: 'Junior Brown opening the release party.', photographer: 'Lærke Hjorth',
    isPublished: true, eventId: 1, category: 'live',
    createdAt: '2025-11-07', updatedAt: '2025-11-07' },
  { id: 2,  uuid: 'g-002', filename: 'dansker_nok_02.jpg',   url: 'https://cdn.l8events.dk/g/dansker_nok_02.jpg',
    caption: 'BASIS — sound check.', photographer: 'Lærke Hjorth',
    isPublished: true, eventId: 1, category: 'soundcheck',
    createdAt: '2025-11-07', updatedAt: '2025-11-07' },
  { id: 3,  uuid: 'g-003', filename: 'dansker_nok_crowd.jpg', url: 'https://cdn.l8events.dk/g/dansker_nok_crowd.jpg',
    caption: 'Sold out at SIGURD.', photographer: 'Lærke Hjorth',
    isPublished: false, eventId: 1, category: 'crowd',
    createdAt: '2025-11-07', updatedAt: '2025-11-08' },
  { id: 4,  uuid: 'g-004', filename: 'chrome_skomager_01.jpg', url: 'https://cdn.l8events.dk/g/chrome_skomager_01.jpg',
    caption: 'Chrome! at Rust.', photographer: 'Mikkel Riis',
    isPublished: true, eventId: 2, category: 'live',
    createdAt: '2025-08-17', updatedAt: '2025-08-17' },
  { id: 5,  uuid: 'g-005', filename: 'chrome_skomager_02.jpg', url: 'https://cdn.l8events.dk/g/chrome_skomager_02.jpg',
    caption: 'Skomager — opening set.', photographer: 'Mikkel Riis',
    isPublished: true, eventId: 2, category: 'live',
    createdAt: '2025-08-17', updatedAt: '2025-08-17' },
  { id: 6,  uuid: 'g-006', filename: 'chrome_backstage.jpg', url: 'https://cdn.l8events.dk/g/chrome_backstage.jpg',
    caption: 'Chrome! pre-show.', photographer: 'Mikkel Riis',
    isPublished: true, eventId: 2, category: 'backstage',
    createdAt: '2025-08-17', updatedAt: '2025-08-17' },
  { id: 7,  uuid: 'g-007', filename: 'roskilde_apollo_01.jpg', url: 'https://cdn.l8events.dk/g/roskilde_apollo_01.jpg',
    caption: 'Olivver on Apollo.', photographer: 'Sofia Lund',
    isPublished: true, eventId: 3, category: 'live',
    createdAt: '2025-06-27', updatedAt: '2025-06-27' },
  { id: 8,  uuid: 'g-008', filename: 'roskilde_apollo_02.jpg', url: 'https://cdn.l8events.dk/g/roskilde_apollo_02.jpg',
    caption: 'Carl Knast closing the L8 takeover.', photographer: 'Sofia Lund',
    isPublished: true, eventId: 3, category: 'live',
    createdAt: '2025-06-27', updatedAt: '2025-06-28' },
  { id: 9,  uuid: 'g-009', filename: 'roskilde_crowd.jpg', url: 'https://cdn.l8events.dk/g/roskilde_crowd.jpg',
    caption: '4,000 capacity.', photographer: 'Sofia Lund',
    isPublished: true, eventId: 3, category: 'crowd',
    createdAt: '2025-06-27', updatedAt: '2025-06-27' },
  { id: 10, uuid: 'g-010', filename: 'roskilde_backstage.jpg', url: 'https://cdn.l8events.dk/g/roskilde_backstage.jpg',
    caption: null, photographer: 'Sofia Lund',
    isPublished: false, eventId: 3, category: 'backstage',
    createdAt: '2025-06-27', updatedAt: '2025-06-27' },
  { id: 11, uuid: 'g-011', filename: 'olivver_portrait.jpg', url: 'https://cdn.l8events.dk/g/olivver_portrait.jpg',
    caption: 'Press portrait for the new album.', photographer: 'Anna Bach',
    isPublished: true, eventId: null, category: 'portrait',
    createdAt: '2025-10-12', updatedAt: '2025-10-12' },
  { id: 12, uuid: 'g-012', filename: 'olivver_promo_01.jpg', url: 'https://cdn.l8events.dk/g/olivver_promo_01.jpg',
    caption: null, photographer: 'Anna Bach',
    isPublished: true, eventId: null, category: 'promo',
    createdAt: '2025-10-12', updatedAt: '2025-10-12' },
  { id: 13, uuid: 'g-013', filename: 'basis_promo.jpg', url: 'https://cdn.l8events.dk/g/basis_promo.jpg',
    caption: 'BASIS — tour press shot.', photographer: 'Kasper Mortensen',
    isPublished: true, eventId: 7, category: 'promo',
    createdAt: '2025-11-01', updatedAt: '2025-11-04' },
  { id: 14, uuid: 'g-014', filename: 'distortion_street_01.jpg', url: 'https://cdn.l8events.dk/g/distortion_street_01.jpg',
    caption: 'Distortion on Jægersborggade.', photographer: 'Kasper Mortensen',
    isPublished: true, eventId: 4, category: 'crowd',
    createdAt: '2025-06-05', updatedAt: '2025-06-05' },
  { id: 15, uuid: 'g-015', filename: 'distortion_dj.jpg', url: 'https://cdn.l8events.dk/g/distortion_dj.jpg',
    caption: 'BobbyFRL on the deck.', photographer: 'Kasper Mortensen',
    isPublished: false, eventId: 4, category: 'live',
    createdAt: '2025-06-05', updatedAt: '2025-06-06' },
  { id: 16, uuid: 'g-016', filename: 'hjalmer_soundcheck.jpg', url: 'https://cdn.l8events.dk/g/hjalmer_soundcheck.jpg',
    caption: null, photographer: 'Lærke Hjorth',
    isPublished: true, eventId: 6, category: 'soundcheck',
    createdAt: '2025-09-22', updatedAt: '2025-09-22' },
  { id: 17, uuid: 'g-017', filename: 'filuka_portrait.jpg', url: 'https://cdn.l8events.dk/g/filuka_portrait.jpg',
    caption: 'Filuka — EP cover session.', photographer: 'Anna Bach',
    isPublished: true, eventId: null, category: 'portrait',
    createdAt: '2025-09-30', updatedAt: '2025-09-30' },
  { id: 18, uuid: 'g-018', filename: 'carl_knast_backstage.jpg', url: 'https://cdn.l8events.dk/g/carl_knast_backstage.jpg',
    caption: null, photographer: 'Sofia Lund',
    isPublished: false, eventId: null, category: 'backstage',
    createdAt: '2025-11-15', updatedAt: '2025-11-15' },
];

function eventById(id) {
  return window.EVENTS.find(e => e.id === id) || null;
}
function photographerList() {
  const s = new Set();
  GALLERY.forEach(g => g.photographer && s.add(g.photographer));
  return [...s].sort();
}

// Messages — contact-form inbound. Matches DB schema:
// id (uuid), name, email, message, isRead, status (enum), phone,
// subject, artistType, createdAt, updatedAt
const MESSAGE_STATUSES = ['new', 'open', 'replied', 'archived', 'spam'];
const ARTIST_TYPES = ['Artist (representation)', 'Venue / Promoter', 'Press / media', 'Fan', 'Other'];

const MESSAGES = [
  { id: 1, uuid: 'm-001',
    name: 'Sara Lindberg', email: 'sara@signalkollektivet.dk', phone: '+45 28 14 67 03',
    subject: 'Booking inquiry — fall tour 2026',
    artistType: 'Venue / Promoter',
    message: "Hi L8,\n\nWe're putting together a fall tour for Signal Kollektivet across Scandinavia (Sept–Nov 2026) and we'd love to add some of your artists to a couple of nights in Copenhagen and Aarhus. Particularly interested in Olivver, Hjalmer and BASIS.\n\nAvailable dates on our end: Sept 18–21, Oct 9–12, Oct 30–Nov 2.\n\nBudget is in the mid-range, can share details once we know there's interest. Happy to jump on a call.\n\nBest,\nSara",
    isRead: false, status: 'new',
    createdAt: '2026-05-18T09:14:00', updatedAt: '2026-05-18T09:14:00' },
  { id: 2, uuid: 'm-002',
    name: 'Mikkel Holst', email: 'mikkel.holst@gmail.com', phone: null,
    subject: null,
    artistType: 'Fan',
    message: "Are there going to be more Hjalmer tickets released for the VEGA show? It says sold out but my friend said you sometimes drop more closer to the date. Tak!",
    isRead: false, status: 'new',
    createdAt: '2026-05-17T22:41:00', updatedAt: '2026-05-17T22:41:00' },
  { id: 3, uuid: 'm-003',
    name: 'Astrid Bertelsen', email: 'astrid@gaffa.dk', phone: '+45 51 02 88 19',
    subject: 'Interview request — Olivver',
    artistType: 'Press / media',
    message: "Hi,\n\nI'm writing the long-form artist feature for the June issue of GAFFA and would love to set up an in-person interview with Olivver around the album release.\n\nI can come to Copenhagen any day between May 25–June 5. Roughly 90 minutes, ideally somewhere quiet, photographer would join for the last 20 min.\n\nLet me know if/when works.\n\nAstrid",
    isRead: true, status: 'open',
    createdAt: '2026-05-16T11:22:00', updatedAt: '2026-05-17T08:10:00' },
  { id: 4, uuid: 'm-004',
    name: 'Jon Skovsgaard', email: 'jon@nightowls.dk', phone: '+45 60 71 22 04',
    subject: 'Verge — DJ booking for July',
    artistType: 'Venue / Promoter',
    message: "Hey,\n\nWe're hosting a late-night series at Ved Siden Af through July. Looking at booking Verge for the closing night, July 26. 02:00–04:00 slot. Fee?\n\nJon / Night Owls",
    isRead: true, status: 'replied',
    createdAt: '2026-05-14T16:05:00', updatedAt: '2026-05-15T10:30:00' },
  { id: 5, uuid: 'm-005',
    name: 'Anonymous', email: 'no-reply@buy-followers-now.biz', phone: null,
    subject: 'INCREASE YOUR INSTAGRAM FOLLOWERS 10X',
    artistType: 'Other',
    message: "Hello l8events.dk admin we noticed your artists could use more engagement! Our service provides REAL followers GUARANTEED to grow your reach! Click here for 50% off first month!!!",
    isRead: true, status: 'spam',
    createdAt: '2026-05-13T03:47:00', updatedAt: '2026-05-13T08:15:00' },
  { id: 6, uuid: 'm-006',
    name: 'Camilla Birk', email: 'camilla.birk@outlook.com', phone: null,
    subject: 'Demo submission — looking for representation',
    artistType: 'Artist (representation)',
    message: "Hi L8,\n\nI'm a singer-songwriter from Aalborg. I've been releasing music independently for two years and have built a small following (~3k monthly on Spotify). I'd love L8 to consider me for the roster — three demos attached as Soundcloud links below.\n\nThanks for listening.\n\nCamilla\nsoundcloud.com/camilla-birk/demos",
    isRead: false, status: 'new',
    createdAt: '2026-05-12T19:28:00', updatedAt: '2026-05-12T19:28:00' },
  { id: 7, uuid: 'm-007',
    name: 'Lars Egede', email: 'lars@vega.dk', phone: '+45 33 25 70 11',
    subject: 'VEGA Q4 calendar — holds',
    artistType: 'Venue / Promoter',
    message: "Hi,\n\nWe're starting to lock Q4 calendar at VEGA. Could you let me know which dates you want to hold for L8 acts? Following from our last conversation, I have soft holds on:\n\n- Oct 14 (Lille)\n- Oct 28 (Store)\n- Nov 8 (Store)\n- Nov 22 (Lille)\n\nLet me know within ~2 weeks please.\n\nLars",
    isRead: true, status: 'open',
    createdAt: '2026-05-11T09:00:00', updatedAt: '2026-05-12T14:20:00' },
  { id: 8, uuid: 'm-008',
    name: 'Frederik Holm', email: 'frederik@dr.dk', phone: null,
    subject: 'P6 Beat — session recording',
    artistType: 'Press / media',
    message: "Would love to record a P6 Beat session with BASIS in our Aarhus studio sometime in June or early July. Standard 4-song format. Let me know who to coordinate with.\n\nFrederik",
    isRead: true, status: 'replied',
    createdAt: '2026-05-09T13:33:00', updatedAt: '2026-05-10T11:15:00' },
  { id: 9, uuid: 'm-009',
    name: 'Maria Toft', email: 'maria.toft@gmail.com', phone: '+45 22 91 04 56',
    subject: 'Filuka — wedding gig?',
    artistType: 'Other',
    message: "Hi! My partner and I are massive Filuka fans and we're getting married in September 2026 in Skagen. We were wondering if there's any chance Filuka would do a 30-minute private set at the reception? We know it's a long shot but we figured it doesn't hurt to ask. Happy to discuss budget privately.\n\nMaria & Andreas",
    isRead: false, status: 'new',
    createdAt: '2026-05-08T20:11:00', updatedAt: '2026-05-08T20:11:00' },
  { id: 10, uuid: 'm-010',
    name: 'Tobias Werner', email: 'tobias@klubpolitiken.dk', phone: '+45 35 12 89 22',
    subject: 'Klub Politiken — November residency',
    artistType: 'Venue / Promoter',
    message: "We have a four-week residency slot opening up in November at Klub Politiken. Would love to discuss programming with L8.\n\nFlexible on format — could be a curated series, a residency for one artist, or a takeover concept. Open to ideas.\n\nTobias",
    isRead: true, status: 'open',
    createdAt: '2026-05-06T10:48:00', updatedAt: '2026-05-08T16:00:00' },
  { id: 11, uuid: 'm-011',
    name: 'Niels Bach', email: 'niels@bach-foto.dk', phone: null,
    subject: 'Photography services',
    artistType: 'Other',
    message: "Concert and editorial photographer in Copenhagen. Long-time admirer of L8's roster. Would love to chat about possibly contributing to upcoming events. Portfolio: bach-foto.dk\n\nNiels",
    isRead: true, status: 'archived',
    createdAt: '2026-05-02T15:20:00', updatedAt: '2026-05-04T09:10:00' },
  { id: 12, uuid: 'm-012',
    name: 'David Kjær', email: 'd.kjaer@stoiklange.dk', phone: '+45 44 18 02 99',
    subject: 'Sponsor inquiry — Distortion 2026',
    artistType: 'Other',
    message: "Hi L8,\n\nI'm reaching out on behalf of Stoik Lange (craft beer). We're putting together our 2026 brand activation calendar and we'd like to discuss a potential partnership around your Distortion programming.\n\nWe'd be looking at brand presence, artist collabs, and possibly co-branded events. Mid five-figure budget range.\n\nWho's the right person to talk to?\n\nDavid",
    isRead: false, status: 'new',
    createdAt: '2026-05-01T11:35:00', updatedAt: '2026-05-01T11:35:00' },
  { id: 13, uuid: 'm-013',
    name: 'Jeppe Sand', email: 'jeppe.sand@hotmail.com', phone: null,
    subject: null,
    artistType: 'Artist (representation)',
    message: "im a rapper from amager and i think im better than most of the rappers on your label give me a chance",
    isRead: true, status: 'archived',
    createdAt: '2026-04-28T01:14:00', updatedAt: '2026-04-29T09:00:00' },
  { id: 14, uuid: 'm-014',
    name: 'Helene Riise', email: 'helene@radarliveaarhus.dk', phone: '+45 86 21 33 04',
    subject: 'Skomager — Aarhus date',
    artistType: 'Venue / Promoter',
    message: "Hi,\n\nWe'd love to host Skomager at Radar in October. Looking at Oct 17 or 24. Standard split deal. Let me know which dates work and I'll send a contract draft.\n\nHelene",
    isRead: true, status: 'replied',
    createdAt: '2026-04-26T14:48:00', updatedAt: '2026-04-28T10:30:00' },
];

function unreadMessageCount() {
  return MESSAGES.filter(m => !m.isRead && m.status !== 'spam' && m.status !== 'archived').length;
}

// Current logged-in user — reference to USERS[0].
// NOTE: `address` is rendered in the UI but is NOT in the schema yet —
// adding it requires a migration.
const CURRENT_USER = USERS[0];
function fmtRelative(iso) {
  const now = new Date('2026-05-19T14:00:00');
  const then = new Date(iso);
  const diffMs = now - then;
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  return `${Math.floor(d / 30)}mo`;
}
function fmtMessageDate(iso) {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const time = d.toTimeString().slice(0, 5);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${time}`;
}

Object.assign(window, {
  ARTISTS, VENUES, EVENTS, BOOKING_USERS, GALLERY, GALLERY_CATEGORIES,
  MESSAGES, MESSAGE_STATUSES, ARTIST_TYPES,
  USERS, CURRENT_USER, USER_ROLES,
  artistsById, venueById, fmtDate, fmtDateParts, fmtMonthGroup,
  eventCountForArtist, eventCountForVenue, upcomingCountForVenue, userById,
  eventById, photographerList,
  unreadMessageCount, fmtRelative, fmtMessageDate,
});
