#!/opt/homebrew/bin/node
const express = require('express');
const bodyParser = require('body-parser');
const Task = require('./src/models/Task');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// temporary data store for tasks (replace with datatbase)
const tasks = [];

// create new task
app.post('/tasks', (req, res) => {
    const { title, description, assignee, dueDate } = req.body;
    const newTask = new Task(title, description, assignee, dueDate);
    tasks.push(newTask);
    res.json(newTask);
});

// Get all tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// Update a task
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, assignee, dueDate, completed } = req.body;
    const taskToUpdate = tasks.find((task) => task.id === id);

    if (!taskToUpdate) {
        return res.status(404).json({ message: 'Task not found' });
    }

    taskToUpdate.title = title || taskToUpdate.title;
    taskToUpdate.description = description || taskToUpdate.description;
    taskToUpdate.assignee = assignee || taskToUpdate.assignee;
    taskToUpdate.dueDate = dueDate || taskToUpdate.dueDate;
    taskToUpdate.completed = completed || taskToUpdate.completed;

    res.json(taskToUpdate);
});

// delete a task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex((tasks) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);
    res.json({ message: 'Task deleted successfully' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});