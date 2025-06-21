const express = require('express');
const router = express.Router();
const Task = require('../../models/Task'); // Import your Task model

// You imported isAuthenticated in server.js for /api/tasks,
// so you don't need to define it here or import it directly.
// The middleware chain in server.js already handles authentication before these routes.

// @route   GET api/tasks
// @desc    Get all tasks for the logged-in user
// @access  Private (handled by isAuthenticated in server.js)
router.get('/', async (req, res) => {
    try {
        // req.user.id is set by the isAuthenticated middleware
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', async (req, res) => {
    const { title, description } = req.body; // 'completed' will default to false in schema

    try {
        const newTask = new Task({
            title,
            description,
            user: req.user.id // Assign the task to the authenticated user
        });

        const task = await newTask.save();
        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/tasks/:id
// @desc    Get a single task by ID for the logged-in user
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Ensure task belongs to the authenticated user
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(task);
    } catch (err) {
        console.error(err.message);
        // Check for invalid ObjectId format
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', async (req, res) => {
    const { title, description, completed } = req.body;

    // Build task object
    const taskFields = {};
    if (title) taskFields.title = title;
    if (description) taskFields.description = description;
    // The 'completed' field can be explicitly set to false, so check if it's provided
    if (typeof completed === 'boolean') taskFields.completed = completed;

    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Ensure task belongs to the authenticated user
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: taskFields },
            { new: true } // Return the updated document
        );

        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Ensure task belongs to the authenticated user
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;