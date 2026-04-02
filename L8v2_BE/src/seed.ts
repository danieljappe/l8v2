import { AppDataSource } from './config/database';
import { User } from './models/User';
import { Artist } from './models/Artist';
import { Venue } from './models/Venue';
import { Event } from './models/Event';
import { Ticket } from './models/Ticket';
import { GalleryImage, GalleryCategory } from './models/GalleryImage';
import { ContactMessage, MessageType, MessageStatus } from './models/ContactMessage';
import { EventArtist } from './models/EventArtist';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // USERS
    console.log('👥 Seeding users...');
    const userRepo = AppDataSource.getRepository(User);
    const users = await Promise.all([
      // Admin user
      userRepo.create({ 
        firstName: 'Admin', 
        lastName: 'User', 
        email: 'admin@l8.dk', 
        password: await bcrypt.hash('admin123', 10), 
      }),
      // Regular user
      userRepo.create({ 
        firstName: 'Mikkel', 
        lastName: 'Danø Mourier', 
        email: 'mike@l8.dk', 
        password: await bcrypt.hash('kodeord1', 10), 
      }),
      // Test user
      userRepo.create({ 
        firstName: 'Test', 
        lastName: 'User', 
        email: 'test@l8.dk', 
        password: await bcrypt.hash('test123', 10), 
      }),
    ].map(async u => {
      let existing = await userRepo.findOneBy({ email: u.email });
      if (!existing) {
        const saved = await userRepo.save(u);
        console.log(`✅ Created user: ${saved.email}`);
        return saved;
      } else {
        console.log(`⏭️  User already exists: ${existing.email}`);
        return existing;
      }
    }));

    // ARTISTS
    console.log('🎤 Seeding artists...');
    const artistRepo = AppDataSource.getRepository(Artist);
    const artists = await Promise.all([
      artistRepo.create({ name: 'Chrome!', bio: 'Chrome! er en dansk undergrunds rapper', genre: 'Opium' }),
      artistRepo.create({ name: 'Skomager', bio: 'Skomager er også en dansk undergrunds rapper', genre: 'Opium' }),
      artistRepo.create({ name: 'Jazz Cats', bio: 'Smooth jazz group.', genre: 'Jazz' }),
      artistRepo.create({ name: 'Pop Stars', bio: 'Top pop artists.', genre: 'Pop' }),
      artistRepo.create({ name: 'Electronic Dreams', bio: 'Electronic music duo.', genre: 'Electronic' }),
    ].map(async a => {
      let existing = await artistRepo.findOneBy({ name: a.name });
      if (!existing) {
        const saved = await artistRepo.save(a);
        console.log(`✅ Created artist: ${saved.name}`);
        return saved;
      } else {
        console.log(`⏭️  Artist already exists: ${existing.name}`);
        return existing;
      }
    }));

    // VENUES
    console.log('🏢 Seeding venues...');
    const venueRepo = AppDataSource.getRepository(Venue);
    const venues = await Promise.all([
      venueRepo.create({ 
        name: 'Rust', 
        description: 'A large concert hall.', 
        address: '123 Main St', 
        city: 'Metropolis', 
        mapEmbedHtml: `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.927764196586!2d-73.98513062365787!3d40.758895571386014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855d8c14b71%3A0x809c8ebf8cd7ea07!2sTimes%20Sq%2C%20New%20York%2C%20NY%2010036!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
      }),
      venueRepo.create({ 
        name: 'Nørrebronx', 
        description: 'Underground venue in Nørrebro.', 
        address: '456 Underground St', 
        city: 'Copenhagen', 
        mapEmbedHtml: `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2244.2657190888647!2d12.551971177031122!3d55.699897498589514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x465252ebf0acb1e1%3A0xb69bb60f3e8f302f!2sN%C3%B8rrebro%2C%201%2C%202200%20K%C3%B8benhavn!5e0!3m2!1sen!2sdk!4v1700000000001!5m2!1sen!2sdk" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
      }),
    ].map(async v => {
      let existing = await venueRepo.findOneBy({ name: v.name });
      if (!existing) {
        const saved = await venueRepo.save(v);
        console.log(`✅ Created venue: ${saved.name}`);
        return saved;
      } else {
        console.log(`⏭️  Venue already exists: ${existing.name}`);
        return existing;
      }
    }));

    // EVENTS
    console.log('🎪 Seeding events...');
    const eventRepo = AppDataSource.getRepository(Event);
    const events = await Promise.all([
      eventRepo.create({ 
        title: 'CHROME! + SKOMAGER', 
        description: 'Chrome og Skomager koncert på Rust.', 
        date: new Date('2025-08-16'), 
        startTime: '19:30', 
        endTime: '23:00', 
        ticketPrice: 50, 
        totalTickets: 500, 
        venue: venues[0], 
        isActive: true 
      }),
      eventRepo.create({ 
        title: 'L8 Events @ Distortion', 
        description: 'L8 Events overtager selveste distortion på Nørrebronx.', 
        date: new Date('2025-06-07'), 
        startTime: '20:00', 
        endTime: '03:00', 
        ticketPrice: 60, 
        totalTickets: 1000, 
        venue: venues[1], 
        isActive: true 
      }),
      eventRepo.create({ 
        title: 'Electronic Dreams Live', 
        description: 'Electronic music night featuring Electronic Dreams.', 
        date: new Date('2025-07-15'), 
        startTime: '21:00', 
        endTime: '02:00', 
        ticketPrice: 40, 
        totalTickets: 300, 
        venue: venues[0], 
        isActive: true 
      }),
    ].map(async e => {
      let existing = await eventRepo.findOneBy({ title: e.title });
      if (!existing) {
        const saved = await eventRepo.save(e);
        console.log(`✅ Created event: ${saved.title}`);
        return saved;
      } else {
        console.log(`⏭️  Event already exists: ${existing.title}`);
        return existing;
      }
    }));

    // EVENT ARTISTS
    console.log('🎭 Seeding event artists...');
    const eventArtistRepo = AppDataSource.getRepository(EventArtist);
    const eventArtists = await Promise.all([
      { eventId: events[0].id, artistId: artists[0].id, performanceOrder: 1, performanceTime: '20:00', setDuration: 60, fee: 1000 },
      { eventId: events[0].id, artistId: artists[1].id, performanceOrder: 2, performanceTime: '21:00', setDuration: 90, fee: 2000 },
      { eventId: events[2].id, artistId: artists[4].id, performanceOrder: 1, performanceTime: '21:00', setDuration: 120, fee: 1500 },
    ].map(async ea => {
      let existing = await eventArtistRepo.findOneBy({ 
        event: { id: ea.eventId }, 
        artist: { id: ea.artistId } 
      });
      if (!existing) {
        const eventArtist = eventArtistRepo.create({
          event: { id: ea.eventId },
          artist: { id: ea.artistId },
          performanceOrder: ea.performanceOrder,
          performanceTime: ea.performanceTime,
          setDuration: ea.setDuration,
          fee: ea.fee
        });
        const saved = await eventArtistRepo.save(eventArtist);
        console.log(`✅ Created event artist: ${artists.find(a => a.id === ea.artistId)?.name || 'Unknown'} for ${events.find(e => e.id === ea.eventId)?.title || 'Unknown'}`);
        return saved;
      } else {
        console.log(`⏭️  Event artist already exists: ${artists.find(a => a.id === ea.artistId)?.name || 'Unknown'} for ${events.find(e => e.id === ea.eventId)?.title || 'Unknown'}`);
        return existing;
      }
    }));

    // TICKETS
    console.log('🎫 Seeding tickets...');
    const ticketRepo = AppDataSource.getRepository(Ticket);
    const tickets = await Promise.all([
      ticketRepo.create({ event: events[0], user: users[1], ticketNumber: 'TICK-1001', price: 50, isUsed: false, isActive: true, quantity: 1, sold: 0 }),
      ticketRepo.create({ event: events[1], user: users[2], ticketNumber: 'TICK-1002', price: 60, isUsed: false, isActive: true, quantity: 2, sold: 0 }),
    ].map(async t => {
      let existing = await ticketRepo.findOneBy({ ticketNumber: t.ticketNumber });
      if (!existing) {
        const saved = await ticketRepo.save(t);
        console.log(`✅ Created ticket: ${saved.ticketNumber}`);
        return saved;
      } else {
        console.log(`⏭️  Ticket already exists: ${existing.ticketNumber}`);
        return existing;
      }
    }));

    // GALLERY IMAGES
    console.log('📸 Seeding gallery images...');
    const galleryImageRepo = AppDataSource.getRepository(GalleryImage);
    const galleryImages = await Promise.all([
      galleryImageRepo.create({ filename: 'rocknight.jpg', url: '/images/rocknight.jpg', caption: 'Rock Night Crowd', photographer: 'Alice', category: GalleryCategory.EVENT, isPublished: true, eventId: events[0].id }),
      galleryImageRepo.create({ filename: 'electrofest.jpg', url: '/images/electrofest.jpg', caption: 'DJ Spin Live', photographer: 'Bob', category: GalleryCategory.EVENT, isPublished: true, eventId: events[1].id }),
      galleryImageRepo.create({ filename: 'jazzclub.jpg', url: '/images/jazzclub.jpg', caption: 'Jazz Cats on Stage', photographer: 'Carol', category: GalleryCategory.EVENT, isPublished: true, eventId: events[2].id }),
      galleryImageRepo.create({ filename: 'popgala.jpg', url: '/images/popgala.jpg', caption: 'Pop Stars Performance', photographer: 'Dave', category: GalleryCategory.EVENT, isPublished: true, eventId: events[0].id }),
    ].map(async gi => {
      let existing = await galleryImageRepo.findOneBy({ filename: gi.filename });
      if (!existing) {
        const saved = await galleryImageRepo.save(gi);
        console.log(`✅ Created gallery image: ${saved.filename}`);
        return saved;
      } else {
        console.log(`⏭️  Gallery image already exists: ${existing.filename}`);
        return existing;
      }
    }));

    // CONTACT MESSAGES
    console.log('💬 Seeding contact messages...');
    const contactMessageRepo = AppDataSource.getRepository(ContactMessage);
    await Promise.all([
      contactMessageRepo.create({ name: 'Eve', email: 'eve@example.com', message: 'Great event!', type: MessageType.FEEDBACK, status: MessageStatus.READ }),
      contactMessageRepo.create({ name: 'Frank', email: 'frank@example.com', message: 'Booking request for Rock Night.', type: MessageType.BOOKING, status: MessageStatus.PENDING }),
      contactMessageRepo.create({ name: 'Grace', email: 'grace@example.com', message: 'Support needed.', type: MessageType.SUPPORT, status: MessageStatus.PENDING }),
      contactMessageRepo.create({ name: 'Heidi', email: 'heidi@example.com', message: 'General inquiry.', type: MessageType.GENERAL, status: MessageStatus.REPLIED }),
    ].map(async cm => {
      let existing = await contactMessageRepo.findOneBy({ email: cm.email, message: cm.message });
      if (!existing) {
        const saved = await contactMessageRepo.save(cm);
        console.log(`✅ Created contact message: ${saved.name} (${saved.email})`);
        return saved;
      } else {
        console.log(`⏭️  Contact message already exists: ${existing.name} (${existing.email})`);
        return existing;
      }
    }));

    console.log('🎉 Seeding complete!');
    console.log('\n📋 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Artists: ${artists.length}`);
    console.log(`- Venues: ${venues.length}`);
    console.log(`- Events: ${events.length}`);
    console.log(`- Event Artists: ${eventArtists.length}`);
    console.log(`- Tickets: ${tickets.length}`);
    console.log(`- Gallery Images: ${galleryImages.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@l8.dk / admin123');
    console.log('User: mike@l8.dk / kodeord1');
    console.log('Test: test@l8.dk / test123');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed().catch(err => {
  console.error('❌ Fatal seeding error:', err);
  process.exit(1);
}); 