import { dbPool } from '../../configs/database.js';
import crypto from 'crypto';

function uuid() {
  return crypto.randomUUID();
}

async function seed() {
  try {
    console.log('Checking if demo data needed...');

    const pool = dbPool.initialize();

    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count, 10) > 5) {
      console.log(`Database already has ${userCount.rows[0].count} users — skipping seed.`);
      await dbPool.close();
      return;
    }

    console.log('Seeding demo data...');

    const users = [
      { id: uuid(), name: 'Ana García', username: 'anarunner', email: 'ana@example.com', password_hash: '$2b$10$placeholder', bio: 'Maratonista apasionada', city: 'Buenos Aires', country: 'Argentina', gender: 'female', lat: -34.6037, lng: -58.3816, is_active: true },
      { id: uuid(), name: 'Carlos López', username: 'carlosrun', email: 'carlos@example.com', password_hash: '$2b$10$placeholder', bio: 'Corredor de montaña', city: 'Bogotá', country: 'Colombia', gender: 'male', lat: 4.7110, lng: -74.0721, is_active: true },
      { id: uuid(), name: 'María Fernández', username: 'mariafit', email: 'maria@example.com', password_hash: '$2b$10$placeholder', bio: 'Triatleta en formación', city: 'Madrid', country: 'España', gender: 'female', lat: 40.4168, lng: -3.7038, is_active: true },
      { id: uuid(), name: 'Pedro Martínez', username: 'pedroveloz', email: 'pedro@example.com', password_hash: '$2b$10$placeholder', bio: 'Rápido y furioso', city: 'Ciudad de México', country: 'México', gender: 'male', lat: 19.4326, lng: -99.1332, is_active: true },
      { id: uuid(), name: 'Laura Torres', username: 'lauratrek', email: 'laura@example.com', password_hash: '$2b$10$placeholder', bio: 'Ultra runner', city: 'Santiago', country: 'Chile', gender: 'female', lat: -33.4489, lng: -70.6693, is_active: true },
    ];

    for (const u of users) {
      await pool.query(`
        INSERT INTO users (id, name, username, email, password_hash, bio, city, country, gender, lat, lng, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (email) DO NOTHING
      `, [u.id, u.name, u.username, u.email, u.password_hash, u.bio, u.city, u.country, u.gender, u.lat, u.lng, u.is_active]);
    }

    const existingUsers = await pool.query('SELECT id, name FROM users WHERE is_active = true AND deleted_at IS NULL LIMIT 5');
    const userIds = existingUsers.rows.map(r => r.id);

    if (userIds.length < 2) {
      console.log('Not enough users — skipping activity/event seeding.');
      await dbPool.close();
      return;
    }

    const now = new Date();
    const daysAgo = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt; };
    const daysLater = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt; };

    const activityCount = await pool.query('SELECT COUNT(*) FROM activities');
    if (parseInt(activityCount.rows[0].count, 10) === 0) {
      const activities = [
        { userId: userIds[0], type: 'running', distance: 10500, duration: 3600, start: daysAgo(1), name: 'Trote matutino' },
        { userId: userIds[0], type: 'running', distance: 42195, duration: 14400, start: daysAgo(7), name: 'Maratón entrenamiento' },
        { userId: userIds[0], type: 'trail_running', distance: 15000, duration: 5400, start: daysAgo(3), name: 'Trail domingo' },
        { userId: userIds[1], type: 'running', distance: 8000, duration: 2400, start: daysAgo(2), name: '8K ritmo' },
        { userId: userIds[1], type: 'trail_running', distance: 25000, duration: 10800, start: daysAgo(5), name: 'Trail montaña' },
        { userId: userIds[2], type: 'running', distance: 5000, duration: 1500, start: daysAgo(1), name: '5K rápido' },
        { userId: userIds[2], type: 'cycling', distance: 40000, duration: 5400, start: daysAgo(4), name: 'Ruta en bici' },
        { userId: userIds[3], type: 'running', distance: 21097, duration: 6300, start: daysAgo(6), name: 'Media maratón' },
        { userId: userIds[4], type: 'running', distance: 35000, duration: 12600, start: daysAgo(2), name: 'Ultra entrenamiento' },
      ];

      for (const a of activities) {
        await pool.query(`
          INSERT INTO activities (id, user_id, activity_type, distance_m, duration_seconds, start_time, end_time, title, is_private)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
        `, [uuid(), a.userId, a.type, a.distance, a.duration, a.start, new Date(a.start.getTime() + a.duration * 1000), a.name]);
      }
      console.log(`  ✓ ${activities.length} activities created`);
    }

    const clubCount = await pool.query('SELECT COUNT(*) FROM clubs');
    if (parseInt(clubCount.rows[0].count, 10) === 0) {
      const clubs = [
        { name: 'Runneros Bs As', desc: 'Club de running en Buenos Aires', city: 'Buenos Aires', country: 'Argentina', founderId: userIds[0], lat: -34.6037, lng: -58.3816 },
        { name: 'Bogotá Trail', desc: 'Trail running en los Cerros Orientales', city: 'Bogotá', country: 'Colombia', founderId: userIds[1], lat: 4.7110, lng: -74.0721 },
        { name: 'Madrid Runners', desc: 'Running urbano en Madrid', city: 'Madrid', country: 'España', founderId: userIds[2], lat: 40.4168, lng: -3.7038 },
      ];

      for (const c of clubs) {
        const clubId = uuid();
        await pool.query(`
          INSERT INTO clubs (id, name, description, city, country, founder_id, member_count, lat, lng, is_private)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, false)
        `, [clubId, c.name, c.desc, c.city, c.country, c.founderId, c.lat, c.lng]);

        await pool.query(`
          INSERT INTO club_members (id, club_id, user_id, role)
          VALUES ($1, $2, $3, 'admin')
        `, [uuid(), clubId, c.founderId]);
      }
      console.log(`  ✓ ${clubs.length} clubs created`);
    }

    const eventCount = await pool.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventCount.rows[0].count, 10) === 0) {
      const events = [
        { title: 'Carrera 10K Buenos Aires', type: 'race', desc: 'Carrera popular 10K', userId: userIds[0], date: daysLater(15), lat: -34.6037, lng: -58.3816 },
        { title: 'Trail Cerro Monserrate', type: 'race', desc: 'Ascenso al Monserrate', userId: userIds[1], date: daysLater(30), lat: 4.6058, lng: -74.0588 },
        { title: 'Entrenamiento grupal Madrid Río', type: 'group_training', desc: 'Entrenamiento semanal', userId: userIds[2], date: daysLater(5), lat: 40.3988, lng: -3.7143 },
        { title: 'Maratón Santiago 2026', type: 'race', desc: 'Maratón internacional', userId: userIds[4], date: daysLater(60), lat: -33.4489, lng: -70.6693 },
      ];

      for (const e of events) {
        await pool.query(`
          INSERT INTO events (id, title, description, event_type, created_by, start_date, lat, lng, participant_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
        `, [uuid(), e.title, e.desc, e.type, e.userId, e.date, e.lat, e.lng]);
      }
      console.log(`  ✓ ${events.length} events created`);
    }

    const routeCount = await pool.query('SELECT COUNT(*) FROM routes');
    if (parseInt(routeCount.rows[0].count, 10) === 0) {
      const routes = [
        { name: 'Circuito Palermo', desc: 'Circuito clásico por los lagos', userId: userIds[0], distance: 8000, city: 'Buenos Aires', country: 'Argentina', lat: -34.5744, lng: -58.4090 },
        { name: 'Cerro de la Muerte', desc: 'Ruta challenge con gran desnivel', userId: userIds[1], distance: 35000, city: 'Bogotá', country: 'Colombia', lat: 4.5693, lng: -74.0624 },
        { name: 'Parque del Retiro', desc: 'Ruta por el corazón de Madrid', userId: userIds[2], distance: 5000, city: 'Madrid', country: 'España', lat: 40.4156, lng: -3.6834 },
      ];

      for (const r of routes) {
        await pool.query(`
          INSERT INTO routes (id, name, description, user_id, distance_m, city, country, lat, lng, is_public, activity_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 0)
        `, [uuid(), r.name, r.desc, r.userId, r.distance, r.city, r.country, r.lat, r.lng]);
      }
      console.log(`  ✓ ${routes.length} routes created`);
    }

    console.log('✓ Seed completed successfully');
    await dbPool.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await dbPool.close();
    process.exit(1);
  }
}

seed();
