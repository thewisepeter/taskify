if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express')
const app = express()
const bycrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const bodyParser = require('body-parser');
const Task = require('./src/models/Task');

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

const users = []
const tasks = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bycrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

// create new Task
app.post('/tasks', checkAuthenticated, (req, res) => {
    const { title, description, assignee, dueDate } = req.body;
    const newTask = new Task(title, description, assignee, dueDate);
    tasks.push(newTask);
    res.render('task.ejs', { tasks });
});

// Get all tasks
app.get('/tasks', checkAuthenticated, (req, res) => {
    res.json(tasks);
});

// Update a Task
app.put('/tasks/:id', checkAuthenticated, (req, res) => {
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

// delete a Task
app.delete('/tasks/:id', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex((tasks) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);
    res.json({ message: 'Task deleted successfully' });
});

app.delete('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.redirect('/error'); // Handle errors as needed
      }
      res.redirect('/login');
    });
  });
   
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}
app.listen(3000)
