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

app.get('/projects', checkAuthenticated, async (req, res) => {
    // Fetch all projects from your database
    const projects = await Project.findAll();
    
    // Render a template that displays the list of projects
    res.render('all-projects.ejs', { projects: projects });
});


// Route for rendering the project creation form
app.get('/projects/new', checkAuthenticated, (req, res) => {
    res.render('project.ejs'); // Render the project creation form
});

// Route to get specific project
app.get('/projects/:projectId', checkAuthenticated, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = await Project.findByPk(projectId, {
            include: Task, // Include the associated tasks
        });

        if (!project) {
            return res.status(404).send('Project not found');
        }

        res.render('projectDetails.ejs', { project });
    } catch (error) {
        console.error('Error retrieving project:', error);
        res.status(500).send('Error retrieving project');
    }
});

// Route for rendering the project editing form
app.get('/projects/:projectId/edit', checkAuthenticated, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const project = await Project.findByPk(projectId);

        if (!project) {
            return res.status(404).send('Project not found');
        }

        res.render('editProject.ejs', { project });
    } catch (error) {
        console.error('Error retrieving project for edit:', error);
        res.status(500).send('Error retrieving project for edit');
    }
});

// Route for handling the project editing form submission
app.post('/projects/:projectId/edit', checkAuthenticated, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { name, description } = req.body;

        // Update the project in the database
        const updatedProject = await Project.update({
            name: name,
            description: description,
        }, {
            where: {
                id: projectId,
            },
        });

        res.redirect(`/projects`);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).send('Error updating project');
    }
});
  
// Route for handling the project creation form submission
app.post('/projects', checkAuthenticated, async (req, res) => {
    // Retrieve project data from the request body
    const { name, description } = req.body;
  
    // Create a new project in the database
    try {
      const project = await Project.create({
        name: name,
        description: description,
        // Set the UserId to the currently logged-in user's ID
        UserId: req.user.id,
        });
    
        // Redirect to a page that displays the newly created project
        res.redirect('/projects');
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).send('Error creating project');
    }
});

// route to add task to project
app.post('/projects/tasks', checkAuthenticated, async (req, res) => {
    // Retrieve task data from the request body
    const { title, description, assignee, dueDate } = req.body;

    // Create a new task in the database (you may need to adjust this part as needed)
    try {
        const task = await Task.create({
            title: title,
            description: description,
            assignee: assignee,
            dueDate: dueDate,
            UserId: req.user.id,
        });

        // You can choose to redirect to the project details page or another appropriate page
        res.redirect(`/projects/${req.params.projectId}`); // Redirect to the project's details page
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Error creating task');
    }
});

  
// Route for rendering the task creation form
app.get('/projects/:projectId/tasks/new', checkAuthenticated, (req, res) => {
    // Render the task creation form and pass the projectId as a parameter
    res.render('task.ejs', { projectId: req.params.projectId });
});
  
// Route for handling the task creation form submission
app.post('/projects/:projectId/tasks', checkAuthenticated, async (req, res) => {
    // Retrieve task data from the request body
    const { title, description, assignee, dueDate } = req.body;
  
    // Create a new task in the database associated with the project
    try {
      const task = await Task.create({
        title: title,
        description: description,
        assignee: assignee,
        dueDate: dueDate,
        // Set the UserId and ProjectId to associate the task with the user and project
        UserId: req.user.id,
        ProjectId: req.params.projectId,
      });
  
      // Redirect to a page that displays the newly created task
      res.redirect(`/projects`);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).send('Error creating task');
    }
});

// Route for rendering the edit task form
app.get('/projects/:projectId/tasks/:taskId/edit', checkAuthenticated, async (req, res) => {
    // Load the task details from the database
    try {
        const task = await Task.findByPk(req.params.taskId);
        if (!task) {
            return res.status(404).send('Task not found');
        }
        // Render the task edit form and pass the task data
        res.render('editTask.ejs', { task });
    } catch (error) {
        console.error('Error loading task:', error);
        res.status(500).send('Error loading task');
    }
});

// Route for handling the task edit form submission
app.post('/projects/:projectId/tasks/:taskId/edit', checkAuthenticated, async (req, res) => {
    // Retrieve updated task data from the request body
    const { title, description, assignee, dueDate } = req.body;
  
    // Update the task in the database
    try {
        await Task.update({
            title,
            description,
            assignee,
            dueDate
        }, {
            where: {
                id: req.params.taskId
            }
        });
    
        // Redirect to a page that displays the updated task
        res.redirect(`/projects/${req.params.projectId}/tasks/${req.params.taskId}`);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Error updating task');
    }
});

// Route for handling the task deletion
app.post('/projects/:projectId/tasks/:taskId/delete', checkAuthenticated, async (req, res) => {
    try {
        // Find the task by ID and delete it
        const task = await Task.findByPk(req.params.taskId);
        if (!task) {
            return res.status(404).send('Task not found');
        }
        await task.destroy();
        // Redirect to the project's tasks page or any other suitable location
        res.redirect(`/projects/${req.params.projectId}`);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Error deleting task');
    }
});

// Route for handling project deletion
app.delete('/projects/:projectId/delete', checkAuthenticated, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Delete the project from the database
    await Project.destroy({
      where: {
        id: projectId, // Delete the project with the specified ID
      },
    });

    res.redirect('/projects'); // Redirect to the projects list page after deletion
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send('Error deleting project');
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
