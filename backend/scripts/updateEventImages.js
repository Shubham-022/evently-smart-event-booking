// backend/scripts/updateEventImages.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { default: pool } = await import('../config/db.js');

export const EVENT_IMAGE_MAPPINGS = [
  {
    title: 'React Developer Meetup',
    location: 'Indore',
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'AI & Machine Learning Summit',
    location: 'Indore',
    img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'React Developer Meetup',
    location: 'Bhopal',
    img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Startup Founders Conference',
    location: 'Mumbai',
    img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Full Stack Web Development Workshop',
    location: 'Pune',
    img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Data Science Bootcamp',
    location: 'Nagpur',
    img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Cyber Security Conference',
    location: 'Bengaluru',
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Music Festival',
    location: 'Mumbai',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Entrepreneurship Summit',
    location: 'Delhi',
    img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Cloud Computing Workshop',
    location: 'Hyderabad',
    img: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'UI/UX Design Masterclass',
    location: 'Indore',
    img: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Digital Marketing Conference',
    location: 'Jaipur',
    img: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Blockchain Developer Meetup',
    location: 'Pune',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Photography Exhibition',
    location: 'Bhopal',
    img: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Sports & Fitness Festival',
    location: 'Nagpur',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&h=675&q=80',
  },
  {
    title: 'Generative AI Hackathon',
    location: 'Bengaluru',
    img: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?auto=format&fit=crop&w=1200&h=675&q=80',
  },
];

export async function updateEventImages() {
  console.log('🖼️ Updating event card images with professional photography...');
  let updatedCount = 0;

  for (const item of EVENT_IMAGE_MAPPINGS) {
    try {
      const [res] = await pool.execute(
        'UPDATE events SET img = ? WHERE title = ? AND location = ?',
        [item.img, item.title, item.location]
      );
      if (res.affectedRows > 0) {
        updatedCount += res.affectedRows;
        console.log(`  ✔ Updated image for: "${item.title}" [${item.location}]`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Failed to update image for "${item.title}":`, err.message);
    }
  }

  // Also replace any remaining dummy/broken image links like example.com
  try {
    await pool.execute(
      "UPDATE events SET img = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&h=675&q=80' WHERE img LIKE '%example.com%' OR img IS NULL OR img = ''"
    );
  } catch (err) {
    // Non-blocking
  }

  console.log(`✅ Successfully updated ${updatedCount} event images in database.`);
  return updatedCount;
}

if (process.argv[1]?.endsWith('updateEventImages.js')) {
  updateEventImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

