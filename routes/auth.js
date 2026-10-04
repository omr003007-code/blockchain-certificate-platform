const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret key for JWT (In production, put this in .env)
const JWT_SECRET = 'supersecretkey123'; 

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { email, password, orgName } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ email, password, orgName });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, orgName: user.orgName }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, orgName: user.orgName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;