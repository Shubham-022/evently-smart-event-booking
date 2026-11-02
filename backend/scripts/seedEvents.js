// backend/scripts/seedEvents.js
//
// Usage:  node backend/scripts/seedEvents.js
//
// Safety guarantees:
//  - Checks each event by (title, location) before inserting. Safe to re-run.
//  - Never deletes or modifies existing rows.
//  - Uses parameterised queries throughout.
//  - Reads credentials from backend/.env (dotenv).

import 'dotenv/config';
import mysql from 'mysql2/promise';

// ─── Connection ────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'smart_event_booking',
  waitForConnections: true,
  connectionLimit: 5,
});

// ─── Seed data ─────────────────────────────────────────────────────────────
//  Dates are spread over the next ~3 months (relative to Nov 2026).
//  Unsplash images are reliable public URLs that load in any browser.
const EVENTS = [
  {
    title:           'AI & Machine Learning Summit',
    description:     'A premier gathering of AI researchers, engineers and enthusiasts exploring the cutting edge of machine learning, deep learning, LLMs and real-world AI applications. Featuring keynotes, workshops and live demos.',
    location:        'Indore',
    date:            '2026-11-20 10:00:00',
    total_seats:     300,
    available_seats: 187,
    price:           1999.00,
    img:             'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'React Developer Meetup',
    description:     'Monthly meetup for React developers to share knowledge, showcase projects and discuss the latest in the React ecosystem — including React 19, Server Components and Next.js.',
    location:        'Bhopal',
    date:            '2026-11-22 18:00:00',
    total_seats:     80,
    available_seats: 12,
    price:           199.00,
    img:             'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Startup Founders Conference',
    description:     'India\'s most impactful startup conference bringing together 500+ founders, investors and mentors. Gain insights on fundraising, product-market fit, scaling and building a world-class team.',
    location:        'Mumbai',
    date:            '2026-11-28 09:00:00',
    total_seats:     500,
    available_seats: 0,          // SOLD OUT
    price:           2999.00,
    img:             'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Full Stack Web Development Workshop',
    description:     'An intensive 2-day hands-on workshop covering the complete modern web stack: React, Node.js, Express, MySQL, REST APIs, authentication and deployment on cloud platforms.',
    location:        'Pune',
    date:            '2026-12-05 09:30:00',
    total_seats:     60,
    available_seats: 38,
    price:           1499.00,
    img:             'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Data Science Bootcamp',
    description:     'A 3-day immersive bootcamp covering data wrangling, exploratory data analysis, statistical modelling, scikit-learn, Pandas and real-world case studies with hands-on projects.',
    location:        'Nagpur',
    date:            '2026-12-10 10:00:00',
    total_seats:     100,
    available_seats: 6,          // LOW AVAILABILITY
    price:           2499.00,
    img:             'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Cyber Security Conference',
    description:     'India\'s leading cyber security event covering threat intelligence, ethical hacking, zero-trust architecture, cloud security and compliance frameworks. A must-attend for security professionals.',
    location:        'Bengaluru',
    date:            '2026-12-12 09:00:00',
    total_seats:     250,
    available_seats: 143,
    price:           1799.00,
    img:             'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Music Festival',
    description:     'A spectacular open-air music festival featuring 20+ live acts across three stages — spanning indie, electronic, folk and classical genres. Food stalls, art installations and a vibrant community atmosphere.',
    location:        'Mumbai',
    date:            '2026-12-14 16:00:00',
    total_seats:     400,
    available_seats: 254,
    price:           799.00,
    img:             'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Entrepreneurship Summit',
    description:     'Bringing together visionary entrepreneurs, policy makers and venture capitalists to discuss the future of Indian startups, government schemes, export opportunities and global market expansion.',
    location:        'Delhi',
    date:            '2026-12-18 10:00:00',
    total_seats:     350,
    available_seats: 201,
    price:           2499.00,
    img:             'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Cloud Computing Workshop',
    description:     'A practitioner-focused workshop covering AWS, Azure and GCP — including serverless architecture, container orchestration with Kubernetes, CI/CD pipelines and cost optimisation strategies.',
    location:        'Hyderabad',
    date:            '2026-12-20 10:00:00',
    total_seats:     120,
    available_seats: 3,          // LOW AVAILABILITY
    price:           1999.00,
    img:             'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'UI/UX Design Masterclass',
    description:     'An expert-led masterclass on human-centred design: user research, wireframing, prototyping in Figma, design systems, accessibility and how to present designs to stakeholders effectively.',
    location:        'Indore',
    date:            '2026-12-22 11:00:00',
    total_seats:     75,
    available_seats: 48,
    price:           1299.00,
    img:             'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Digital Marketing Conference',
    description:     'Stay ahead of the curve with sessions on SEO, content marketing, performance advertising, influencer strategy, social media growth hacking and marketing analytics for 2027.',
    location:        'Jaipur',
    date:            '2026-12-27 09:30:00',
    total_seats:     200,
    available_seats: 133,
    price:           999.00,
    img:             'https://images.unsplash.com/photo-1559223607-a43c990c692c?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Blockchain Developer Meetup',
    description:     'A hands-on technical meetup for blockchain developers covering smart contract development in Solidity, DeFi protocols, Web3.js, ethers.js and building decentralised applications.',
    location:        'Pune',
    date:            '2027-01-08 18:30:00',
    total_seats:     90,
    available_seats: 0,          // SOLD OUT
    price:           499.00,
    img:             'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Photography Exhibition',
    description:     'A curated exhibition showcasing works from 30 emerging and established Indian photographers. Themes include street life, wildlife, portraiture and abstract art. Walk-through guided sessions available.',
    location:        'Bhopal',
    date:            '2027-01-15 10:00:00',
    total_seats:     150,
    available_seats: 97,
    price:           299.00,
    img:             'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Sports & Fitness Festival',
    description:     'A high-energy festival celebrating health and wellness with live fitness classes, obstacle courses, nutrition workshops, sports demos and meet-and-greet sessions with professional athletes.',
    location:        'Nagpur',
    date:            '2027-01-22 07:00:00',
    total_seats:     500,
    available_seats: 312,
    price:           599.00,
    img:             'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title:           'Generative AI Hackathon',
    description:     '48-hour hackathon focused on building innovative applications using generative AI models — GPT, Stable Diffusion, Whisper and more. Compete for ₹5L+ in prizes and mentorship from top AI engineers.',
    location:        'Bengaluru',
    date:            '2027-01-30 09:00:00',
    total_seats:     200,
    available_seats: 74,
    price:           399.00,
    img:             'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=1200&h=675&q=80',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const BOLD  = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function log(color, icon, msg) {
  console.log(`${color}${icon} ${msg}${RESET}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function seed() {
  const conn = await pool.getConnection();
  console.log('\n' + BOLD + CYAN + '═══════════════════════════════════════════════' + RESET);
  console.log(BOLD + CYAN + '   Evently — Event Seed Script' + RESET);
  console.log(BOLD + CYAN + '═══════════════════════════════════════════════' + RESET + '\n');

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  try {
    // ── Snapshot existing count ─────────────────────────────────────────
    const [[{ row_count_before }]] = await conn.execute('SELECT COUNT(*) AS row_count_before FROM events');
    log(DIM, '📋', `Existing event rows before seed: ${row_count_before}`);
    console.log();
    const before = row_count_before;

    for (const ev of EVENTS) {
      try {
        // Idempotency: skip if (title, location) already exists
        const [dup] = await conn.execute(
          'SELECT id FROM events WHERE title = ? AND location = ? LIMIT 1',
          [ev.title, ev.location],
        );

        if (dup.length > 0) {
          log(YELLOW, '⏭ ', `SKIPPED  (already exists) — ${ev.title} [${ev.location}]`);
          skipped++;
          continue;
        }

        await conn.execute(
          `INSERT INTO events
             (title, description, location, \`date\`, total_seats, available_seats, price, img)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ev.title,
            ev.description,
            ev.location,
            ev.date,
            ev.total_seats,
            ev.available_seats,
            ev.price,
            ev.img,
          ],
        );

        const tag = ev.available_seats === 0
          ? RED   + '[SOLD OUT]'
          : ev.available_seats <= 10
          ? YELLOW + '[LOW]    '
          : GREEN  + '[OK]     ';

        log(GREEN, '✔ ', `INSERTED ${tag}${RESET}${GREEN} — ${ev.title} | ${ev.location} | ₹${ev.price} | seats: ${ev.available_seats}/${ev.total_seats}${RESET}`);
        inserted++;
      } catch (rowErr) {
        log(RED, '✘ ', `ERROR inserting "${ev.title}": ${rowErr.message}`);
        errors++;
      }
    }

    // ── Final verification query ────────────────────────────────────────
    console.log('\n' + BOLD + '─── All events ordered by date ───────────────────' + RESET);
    const [allEvents] = await conn.execute(
      `SELECT id, title, location, date, available_seats, total_seats, price
       FROM events
       ORDER BY date ASC`,
    );

    const colW = [4, 42, 12, 22, 10, 7, 8];
    const header = [
      'ID'.padEnd(colW[0]),
      'Title'.padEnd(colW[1]),
      'Location'.padEnd(colW[2]),
      'Date'.padEnd(colW[3]),
      'Seats'.padEnd(colW[4]),
      'Avail'.padEnd(colW[5]),
      'Price',
    ].join('  ');

    console.log(BOLD + CYAN + header + RESET);
    console.log(DIM + '─'.repeat(header.length + 12) + RESET);

    for (const e of allEvents) {
      const avail = e.available_seats === 0
        ? RED + '0 (SOLD)' + RESET
        : e.available_seats <= 10
        ? YELLOW + String(e.available_seats).padEnd(colW[5]) + RESET
        : String(e.available_seats).padEnd(colW[5]);

      console.log(
        String(e.id).padEnd(colW[0]) + '  ' +
        String(e.title).substring(0, 40).padEnd(colW[1]) + '  ' +
        String(e.location).padEnd(colW[2]) + '  ' +
        new Date(e.date).toISOString().replace('T', ' ').substring(0, 19).padEnd(colW[3]) + '  ' +
        String(e.total_seats).padEnd(colW[4]) + '  ' +
        avail + '  ' +
        `₹${e.price}`,
      );
    }

    // ── Summary ─────────────────────────────────────────────────────────
    console.log('\n' + BOLD + '─── Seed Summary ─────────────────────────────────' + RESET);
    log(GREEN,  '✔', `Inserted : ${inserted}`);
    log(YELLOW, '⏭', `Skipped  : ${skipped} (already existed)`);
    log(RED,    '✘', `Errors   : ${errors}`);
    log(CYAN,   '📊', `Total events in DB: ${allEvents.length}`);

    const soldOut = allEvents.filter((e) => e.available_seats === 0);
    const lowAvail = allEvents.filter((e) => e.available_seats > 0 && e.available_seats <= 10);
    log(RED,    '🔴', `Sold-out events  : ${soldOut.length} — ${soldOut.map((e) => e.title).join(', ')}`);
    log(YELLOW, '🟡', `Low availability : ${lowAvail.length} — ${lowAvail.map((e) => e.title).join(', ')}`);

    // Verify no pre-existing rows were modified (count delta matches inserts)
    const [[{ row_count_after }]] = await conn.execute('SELECT COUNT(*) AS row_count_after FROM events');
    const after = row_count_after;
    const delta = after - before;
    if (delta === inserted) {
      log(GREEN, '✔', `Data integrity confirmed — ${before} → ${after} rows (Δ +${delta}).`);
    } else {
      log(RED, '⚠', `UNEXPECTED delta: expected +${inserted} but DB changed by +${delta}. Investigate.`);
    }
  } finally {
    conn.release();
    await pool.end();
    console.log('\n' + BOLD + CYAN + '═══════════════════════════════════════════════' + RESET + '\n');
  }
}

seed().catch((err) => {
  console.error(RED + '❌ Seed script fatal error:', err.message + RESET);
  process.exit(1);
});
