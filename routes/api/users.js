const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const User = require('../../models/User');
const loggedInUsers = new Set(); 
const isAuthenticated = (req, res, next) => {
    

    if (req.headers['x-user-id'] && loggedInUsers.has(req.headers['x-user-id'])) {
        req.user = { id: req.headers['x-user-id'] }; // 
        next();
    } else {
        res.status(401).json({ msg: 'Not authorized, no user ID found or not logged in' });
    }
};


router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Username already exists' });
        }

        user = new User({
            username,
            email,
            password
        });

        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(201).json({ msg: 'User registered successfully!', userId: user.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        
        loggedInUsers.add(user.id);
        res.json({ msg: 'Logged in successfully!', userId: user.id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.json({ msg: `Welcome to your dashboard, user ${req.user.id}!` });
});

router.post('/logout', isAuthenticated, (req, res) => {
    loggedInUsers.delete(req.user.id);
    res.json({ msg: 'Logged out successfully!' });
});

module.exports = { router, isAuthenticated }; 