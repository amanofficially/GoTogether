/**
 * One-shot admin bootstrap script.
 *
 * Run with: npm run seed
 *
 * Without this script `npm run seed` (referenced in package.json) crashed
 * with "Cannot find module '.../utils/seed.js'", and there was otherwise no
 * way to create an admin account — role is 'user' for everyone who signs up
 * through /auth/register, and no controller in the app ever sets role to
 * 'admin'. This script fixes both: it connects to the same MongoDB the API
 * uses, then creates a verified, ready-to-use admin user (or promotes an
 * existing account to admin if the email already exists).
 *
 * Configure the account via env vars (falls back to sane dev defaults):
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const User = require('../models/User');

const ADMIN_NAME = process.env.ADMIN_NAME || 'GoTogether Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gotogether.app';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+910000000000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function run() {
  await mongoose.connect(mongoUri);
  // eslint-disable-next-line no-console
  console.log(`Connected to ${mongoose.connection.host} — seeding admin user...`);

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (user) {
    user.role = 'admin';
    user.isVerified = true;
    user.isBanned = false;
    await user.save({ validateBeforeSave: false });
    // eslint-disable-next-line no-console
    console.log(`✅ Existing user ${ADMIN_EMAIL} promoted to admin.`);
  } else {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    });
    // eslint-disable-next-line no-console
    console.log('✅ Admin user created:');
    // eslint-disable-next-line no-console
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    // eslint-disable-next-line no-console
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    // eslint-disable-next-line no-console
    console.log('   ⚠️  Log in and change this password immediately in a real deployment.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
