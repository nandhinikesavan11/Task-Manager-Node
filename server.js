// server.js (updated again)
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();
const { router: userRoutes, isAuthenticated } = require('./routes/api/users'); // Import both

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Define Routes
app.use('/api/users', userRoutes); // User routes
app.use('/api/tasks', isAuthenticated, require('./routes/api/tasks')); // Protected task routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));