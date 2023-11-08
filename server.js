if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const app = express();
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const passport = require('passport');
const bcrypt = require('bcrypt');
const flash = require('express-flash');

// Initialize Sequelize with your database connection details
const sequelize = new Sequelize('taskify', 'taskify', 'taskify_1', {
    host: 'localhost',
    dialect: 'mysql',
});

// Define Sequelize models for User, Project, and Task
const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: {
        type: DataTypes.STRING,
        unique: true, // Ensures email is unique
    },
    password: DataTypes.STRING,
});

const Project = sequelize.define('Project', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
});

const Task = sequelize.define('Task', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    assignee: DataTypes.STRING,
    dueDate: DataTypes.DATE,
    completed: DataTypes.BOOLEAN,
});

const initializePassport = require('./passport-config');

initializePassport(passport, User); // Pass your User model to initializePassport


// Define associations between models
User.hasMany(Project);
User.hasMany(Task);
Project.hasMany(Task);
Task.belongsTo(User);
Task.belongsTo(Project);
 
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
app.use(express.static('public'));

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name, email: req.user.email })
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
        const { name, email, password, 'retype-password': retypePassword } = req.body;

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ where: { email: email } });

        if (existingUser) {
            // Email already in use
            return res.status(400).send('Email is already in use');
        }

        if (password !== retypePassword) {
            return res.status(400).send('Passwords do not match');
        }

        // If the email is not in use, proceed with registration
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: name,
            email: email,
            password: hashedPassword,
        });

        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error creating user');
    }
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

// Sync the database to create tables based on the defined models
sequelize.sync()
    .then(() => {
        console.log('Database synchronized');
    })
    .catch((err) => {
        console.error('Error synchronizing database:', err);
    });

app.listen(3000)
