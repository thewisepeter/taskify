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
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const multer = require('multer');
const upload = multer({ dest: 'public/profile-pictures' });

// Initialize Sequelize with your database connection details
const sequelize = new Sequelize('taskify', 'taskify', 'taskify_1', {
    host: 'localhost',
    dialect: 'mysql',
});

const sessionStore = new SequelizeStore({
    db: sequelize,
});

// Define Sequelize models for User, Project, Task
const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: {
        type: DataTypes.STRING,
        unique: true, // Ensures email is unique
    },
    password: DataTypes.STRING,
    profilePicture: DataTypes.STRING,
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
    saveUninitialized: false,
    store: sessionStore,
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static('public'));

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name, email: req.user.email, profilePicture: req.user.profilePicture })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    console.log('User authenticated. UserID:', req.user.id);
    req.session.userId = req.user.id;
    res.redirect('/');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, upload.single('profile-picture'), async (req, res) => {
    try {
        const { name, email, password, 'retype-password': retypePassword } = req.body;
        
        console.log('Request body:', req.body);
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

        const newUser = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            profilePicture: req.file.filename,
        });

        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error creating user');
    }
});

// route to get all projects of a user
app.get('/projects', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        // Fetch projects associated with the logged-in user
        const projects = await Project.findAll({
            where: { UserId: userId },
        });

        // Render a template that displays the list of projects
        res.render('all-projects.ejs', { projects: projects });
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).send('Error retrieving projects');
    }
});


// Route for rendering the project creation form
app.get('/projects/new', checkAuthenticated, (req, res) => {
    res.render('project.ejs'); // Render the project creation form
});

// Route for handling the project creation form submission
app.post('/projects', checkAuthenticated, async (req, res) => {
    // Retrieve project data from the request body
    const { name, description } = req.body;

    // Create a new project in the database associated with the currently authenticated user
    try {
        const userId = req.user.id;

        const project = await Project.create({
            name: name,
            description: description,
            UserId: userId,
        });

        // Redirect to a page that displays the newly created project
        res.redirect('/projects');
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).send('Error creating project');
    }
});




// Route to get specific project
app.get('/projects/:projectId', checkAuthenticated, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id;

        // Ensure that the project is associated with the currently authenticated user
        const project = await Project.findOne({
            where: {
                id: projectId,
                UserId: userId,
            },
            include: [Task], // Include the associated tasks
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
        const userId = req.user.id;

        // Ensure that the project is associated with the currently authenticated user
        const project = await Project.findOne({
            where: {
                id: projectId,
                UserId: userId,
            },
        });

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
        const userId = req.user.id;
        const { name, description } = req.body;

        // Update the project in the database, ensuring it's associated with the currently authenticated user
        const updatedProject = await Project.update(
            {
                name: name,
                description: description,
            },
            {
                where: {
                    id: projectId,
                    UserId: userId,
                },
            }
        );

        res.redirect(`/projects`);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).send('Error updating project');
    }
});


// route to add task to project
app.post('/projects/:projectId/tasks', checkAuthenticated, async (req, res) => {
    // Retrieve task data from the request body
    const { title, description, assignee, dueDate } = req.body;
    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Create a new task in the database associated with the project and the currently authenticated user
    try {
        const task = await Task.create({
            title: title,
            description: description,
            assignee: assignee,
            dueDate: dueDate,
            UserId: userId,
            ProjectId: projectId,
        });

        // Redirect to the project's details page or another appropriate page
        res.redirect(`/projects/${projectId}`); // Redirect to the project's details page
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
    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Create a new task in the database associated with the project and the currently authenticated user
    try {
        const task = await Task.create({
            title: title,
            description: description,
            assignee: assignee,
            dueDate: dueDate,
            UserId: userId,
            ProjectId: projectId,
        });

        // Redirect to a page that displays the newly created task
        res.redirect(`/projects/${projectId}`);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Error creating task');
    }
});


// Route for rendering the edit task form
app.get('/projects/:projectId/tasks/:taskId/edit', checkAuthenticated, async (req, res) => {
    // Load the task details from the database
    try {
        const userId = req.user.id;
        const projectId = req.params.projectId;

        // Ensure that the task is associated with the currently authenticated user and project
        const task = await Task.findOne({
            where: {
                id: req.params.taskId,
                UserId: userId,
                ProjectId: projectId,
            },
        });

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

    // Update the task in the database, ensuring it's associated with the currently authenticated user and project
    try {
        const userId = req.user.id;
        const projectId = req.params.projectId;

        await Task.update({
            title,
            description,
            assignee,
            dueDate,
        }, {
            where: {
                id: req.params.taskId,
                UserId: userId,
                ProjectId: projectId,
            },
        });

        // Redirect to a page that displays the updated task
        res.redirect(`/projects/${projectId}/tasks/${req.params.taskId}`);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Error updating task');
    }
});


// Route for handling the task deletion
app.post('/projects/:projectId/tasks/:taskId/delete', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const projectId = req.params.projectId;

        // Find the task by ID and delete it, ensuring it's associated with the currently authenticated user and project
        const task = await Task.findOne({
            where: {
                id: req.params.taskId,
                UserId: userId,
                ProjectId: projectId,
            },
        });

        if (!task) {
            return res.status(404).send('Task not found');
        }

        await task.destroy();

        // Redirect to the project's tasks page or any other suitable location
        res.redirect(`/projects/${projectId}`);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Error deleting task');
    }
});


// Route for handling project deletion
app.get('/projects/:projectId/delete', checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
  
      // Delete the project from the database, ensuring it's associated with the currently authenticated user
      await Project.destroy({
        where: {
          id: projectId,
          UserId: userId,
        },
      });
  
      res.redirect('/projects'); // Redirect to the projects list page after deletion
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).send('Error deleting project');
    }
  });
  

// Get all tasks for the currently authenticated user
app.get('/tasks', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch tasks only for the currently authenticated user
        const tasks = await Task.findAll({
            where: {
                UserId: userId,
            },
        });

        res.render('all-tasks.ejs', { tasks });
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        res.status(500).send('Error retrieving tasks');
    }
});


// Route for rendering the task creation form
app.get('/tasks/new', checkAuthenticated, (req, res) => {
    res.render('taskAlone.ejs');
});

// Route for handling the task creation form submission
app.post('/tasks', checkAuthenticated, async (req, res) => {
    // Retrieve task data from the request body
    const { title, description, assignee, dueDate } = req.body;

    try {
        // Create a new task in the database associated with the currently authenticated user
        const task = await Task.create({
            title: title,
            description: description,
            assignee: assignee,
            dueDate: dueDate,
            // Set the UserId to associate the task with the user
            UserId: req.user.id,
        });

        // Redirect to a page that displays the newly created task
        res.redirect(`/tasks`);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Error creating task');
    }
});


// Route for rendering the task edit form
app.get('/tasks/:taskId/edit', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.taskId;

        // Find the task in the database for the currently authenticated user
        const task = await Task.findOne({
            where: {
                id: taskId,
                UserId: userId,
            },
        });

        if (!task) {
            return res.status(404).send('Task not found');
        }

        res.render('editTask.ejs', { task });
    } catch (error) {
        console.error('Error retrieving task:', error);
        res.status(500).send('Error retrieving task');
    }
});

// Route for handling task updates using POST method
app.post('/tasks/:taskId/edit', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.taskId;

        // Retrieve updated task data from the request body
        const { title, description, assignee, dueDate, completed } = req.body;

        // Update the task in the database for the currently authenticated user
        const [updatedTaskCount] = await Task.update(
            {
                title: title,
                description: description,
                assignee: assignee,
                dueDate: dueDate,
                completed: completed,
            },
            {
                where: {
                    id: taskId,
                    UserId: userId,
                },
            }
        );

        // Check if the task was updated successfully
        if (updatedTaskCount === 1) {
            res.redirect('/tasks'); // Redirect to the tasks list page
        } else {
            res.status(404).send('Task not found or unauthorized'); // Handle case where task is not found or unauthorized
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Error updating task');
    }
});


// Route for handling task deletion
app.get('/tasks/:taskId/delete', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.taskId;

        // Delete the task from the database for the currently authenticated user
        const deletedTaskCount = await Task.destroy({
            where: {
                id: taskId,
                UserId: userId,
            },
        });

        // Check if the task was deleted successfully
        if (deletedTaskCount === 1) {
            res.redirect('/tasks'); // Redirect to the tasks list page after deletion
        } else {
            res.status(404).send('Task not found or unauthorized'); // Handle case where task is not found or unauthorized
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Error deleting task');
    }
});


// Route for handling marking a task as complete
app.post('/tasks/:taskId/complete', checkAuthenticated, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        // Update the task's completion status to true
        await Task.update(
            {
                completed: true,
            },
            {
                where: {
                    id: taskId,
                },
            }
        );

        res.redirect('/tasks'); // Redirect to the tasks list page after completion
    } catch (error) {
        console.error('Error marking task as complete:', error);
        res.status(500).send('Error marking task as complete');
    }
});

// Route for rendering the edit profile form
app.get('/edit-profile', checkAuthenticated, (req, res) => {
    res.render('editProfile.ejs', { user: req.user });
});

// Route for handling the edit profile form submission
app.post('/edit-profile', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, profilePicture } = req.body;

        // Update the user in the database
        await User.update(
            {
                name: name,
                email: email,
                profilePicture: profilePicture,
            },
            {
                where: {
                    id: userId,
                },
            }
        );

        res.redirect('/');
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send('Error updating user profile');
    }
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(); // Destroy the user's session
    res.redirect('/'); // Redirect to the home page
  });
});

function checkAuthenticated(req, res, next) {
    console.log('Is Authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }   
    res.redirect('/login');
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
