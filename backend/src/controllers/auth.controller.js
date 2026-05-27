const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { validationResult } = require('express-validator');
const { createNotification, notifyAdmins } = require('../services/notification.service');

const formatUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// REGISTER
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    // Welcome notification for new user
    await createNotification(
      user._id,
      'system',
      'Welcome to StreamSync! 🎉',
      'Start by uploading a video and saving your stream keys to go live on multiple platforms at once.'
    );

    // Notify all admins about new registration
    await notifyAdmins(
      'new_user',
      'New User Registered',
      `${name} (${email}) just created an account.`
    );

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.password) return res.status(400).json({ message: 'Please login with Google' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GOOGLE SIGN-IN (One Tap / credential from @react-oauth/google)
const googleTokenLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
    }

    const { data: payload } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: token },
    });

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: 'Invalid Google token audience' });
    }

    const email = payload.email;
    if (!email) {
      return res.status(400).json({ message: 'Google account email not available' });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId: payload.sub }] });
    let isNew = false;

    if (!user) {
      isNew = true;
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatar: payload.picture,
      });
      await createNotification(
        user._id,
        'system',
        'Welcome to StreamSync! 🎉',
        'Start by uploading a video and saving your stream keys to go live on multiple platforms at once.'
      );
      await notifyAdmins(
        'new_user',
        'New User Registered',
        `${user.name} (${email}) just created an account via Google.`
      );
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (payload.picture) user.avatar = payload.picture;
      await user.save();
    }

    const jwtToken = generateToken(user._id);
    res.json({
      token: jwtToken,
      user: formatUser(user),
      isNew,
    });
  } catch (err) {
    console.error('Google token login error:', err.response?.data || err.message);
    res.status(401).json({ message: 'Google login failed — invalid or expired token' });
  }
};

// GOOGLE CALLBACK
const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
  }
};

// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, googleTokenLogin, googleCallback, getMe };