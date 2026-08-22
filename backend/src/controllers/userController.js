const User = require('../models/User');

const MAX_AVATAR_BYTES = 500 * 1024;

function toProfile(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    avatar: user.avatar,
    links: user.links,
    phone: user.phone,
    homeStation: user.homeStation,
  };
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(toProfile(user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const { name, bio, avatar, links, phone, homeStation } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }
    if (bio !== undefined) {
      user.bio = bio.trim().slice(0, 200);
    }
    if (avatar !== undefined) {
      if (avatar && (!avatar.startsWith('data:image/') || avatar.length > MAX_AVATAR_BYTES)) {
        return res.status(400).json({ message: 'Avatar must be an image under 500KB' });
      }
      user.avatar = avatar;
    }
    if (links !== undefined) {
      if (!Array.isArray(links)) {
        return res.status(400).json({ message: 'Links must be a list' });
      }
      if (links.length > 10) {
        return res.status(400).json({ message: 'You can add up to 10 links' });
      }
      const normalizedLinks = [];
      for (const raw of links) {
        const trimmed = String(raw).trim();
        if (!trimmed) continue;
        const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        try {
          new URL(normalized);
        } catch {
          return res.status(400).json({ message: `"${trimmed}" is not a valid URL` });
        }
        normalizedLinks.push(normalized.slice(0, 200));
      }
      user.links = normalizedLinks;
    }
    if (phone !== undefined) {
      const trimmed = phone.trim();
      if (trimmed && !/^[0-9+\-\s]{6,15}$/.test(trimmed)) {
        return res.status(400).json({ message: 'Phone must be a valid number' });
      }
      user.phone = trimmed;
    }
    if (homeStation !== undefined) {
      user.homeStation = homeStation.trim().slice(0, 100);
    }

    await user.save();
    res.json(toProfile(user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
}

module.exports = { getMe, updateMe };
