const crypto = require('crypto');

/** Generates a 6-digit numeric OTP */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/** Hashes the OTP before storing in DB (never store raw OTP) */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function compareOtp(rawOtp, hashedOtp) {
  return hashOtp(rawOtp) === hashedOtp;
}

module.exports = { generateOtp, hashOtp, compareOtp };
