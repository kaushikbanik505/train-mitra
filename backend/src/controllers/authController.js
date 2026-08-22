const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const { sendVerificationEmail } = require('../utils/email');
const { incrementRegisteredCount } = require('../socket');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      passwordHash,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    // Best-effort: verification is not required to use the account right now,
    // so a failed send here shouldn't affect registration.
    sendVerificationEmail(user, verificationToken).catch((emailErr) => {
      console.error('Failed to send verification email:', emailErr.message);
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    incrementRegisteredCount();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        links: user.links,
        phone: user.phone,
        homeStation: user.homeStation,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user || user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ message: 'Verification link is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Email verification failed', error: err.message });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond the same way regardless of whether the account exists,
    // so this endpoint can't be used to probe for registered emails.
    if (!user || user.isVerified) {
      return res.json({ message: 'If that account needs verification, a new email has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({ message: 'If that account needs verification, a new email has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not resend verification email', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This account has been banned.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        links: user.links,
        phone: user.phone,
        homeStation: user.homeStation,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Token refresh failed', error: err.message });
  }
}

module.exports = { register, login, refresh, verifyEmail, resendVerification };
