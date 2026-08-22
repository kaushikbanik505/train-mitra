// One-time (or rerunnable) script to grant the admin role to a specific account.
// Usage: node scripts/promote-admin.js [email]  (defaults to the site owner's email)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = (process.argv[2] || 'iamkaushik018@gmail.com').toLowerCase();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email} - register the account first, then rerun this script.`);
  } else {
    console.log(`${user.email} is now role: ${user.role}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
