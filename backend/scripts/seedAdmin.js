// backend/scripts/seedAdmin.js
// Run: node scripts/seedAdmin.js
// Creates default admin if none exists. Change credentials before production.
import 'dotenv/config';
import { registerAdminService } from '../services/authService.js';

const DEFAULT_ADMIN = {
  name:     'Admin',
  email:    'admin@evently.com',
  password: 'Admin@1234',
};

(async () => {
  console.log('Seeding admin account...');
  const result = await registerAdminService(DEFAULT_ADMIN);
  if (result?.error === 'Admin already exists') {
    console.log('Admin already exists. No action needed.');
  } else if (result?.duplicate) {
    console.log('Duplicate email. Admin may already exist.');
  } else {
    console.log('Admin created:', result);
  }
  process.exit(0);
})();
