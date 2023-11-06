if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const app = express();
const bycrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const Task = require('./src/models/Task');
const Project = require('./src/models/Project');

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

const users = [];
const tasks = [];
const projects = [];

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

// edit Task
app.get('/tasks/:id/edit', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const taskToUpdate = tasks.find((task) => task.id === id);
  
    if (!taskToUpdate) {
      return res.status(404).json({ message: 'Task not found' });
    }
  
    res.render('editTask.ejs', { task: taskToUpdate });
  });
  

// Update a Task
app.post('/tasks/:id', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const { title, description, assignee, dueDate, completed } = req.body;
    const taskToUpdate = tasks.find((task) => task.id === id);

    if (!taskToUpdate) {
        return res.status(404).json({ message: 'Task not found' });
    }

    taskToUpdate.title = title;
    taskToUpdate.description = description;
    taskToUpdate.assignee = assignee;
    taskToUpdate.dueDate = dueDate;
    taskToUpdate.completed = completed;

    res.render('task.ejs', { tasks });
});

app.get('/tasks/:id/delete', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    res.render('deleteTask.ejs', { id });
});

app.post('/tasks/:id/delete', checkAuthenticated, (req, res) => {
    const { id } = req.params;
  
    // Find the task to delete
    const taskIndex = tasks.findIndex((task) => task.id === id);
  
    // If the task doesn't exist, return a 404 error
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
  
    // Delete the task from the array
    tasks.splice(taskIndex, 1);
  
    // Redirect the user to the task list page
    res.render('task.ejs', { tasks });
  });
  
// delete a Task
app.delete('/tasks/:id', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex((tasks) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);
    res.redirect('/tasks');
});

// Project endpoints
// Create a new project
app.post('/projects', checkAuthenticated, (req, res) => {
    const { name, description, taskTitle, taskDescription, taskAssignee, taskDueDate } = req.body;
  
    const newProject = new Project(name, description);
    const newTask = new Task(taskTitle, taskDescription, taskAssignee, taskDueDate);
    newProject.tasks.push(newTask);
    projects.push(newProject);
    res.redirect('/projects');
  });
  

// List all projects
app.get('/projects', checkAuthenticated, (req, res) => {
    res.render('projects.ejs', { projects });
});

// Edit a project
app.get('/projects/:id/edit', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const projectToEdit = projects.find((project) => project.id === id);

    if (!projectToEdit) {
        return res.status(404).json({ message: 'Project not found' });
    }

    res.render('editProject.ejs', { project: projectToEdit });
});

//editing and deleting a task in a project
app.get('/projects/:projectId/tasks/:taskId/edit', (req, res) => {
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;
    const project = projects.find((proj) => proj.id === projectId);

    if (!project) {
        return res.status(404).send('Project not found');
    }

    const taskToEdit = project.tasks.find((task) => task.id === taskId);

    if (!taskToEdit) {
        return res.status(404).send('Task not found');
    }

    // Render the edit form with taskToEdit.
    res.render('editProjectTask.ejs', { project: project, task: taskToEdit });
});

app.get('/projects/:projectId/tasks/:taskId/delete', (req, res) => {
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;
    const project = projects.find((proj) => proj.id === projectId);

    if (!project) {
        return res.status(404).send('Project not found');
    }

    const taskIndex = project.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).send('Task not found');
    }

    // Perform the task deletion here.
    project.tasks.splice(taskIndex, 1);

    // Redirect the user back to the project page, or wherever you want.
    res.redirect('/projects/' + projectId);
});

  
// Update a project
app.post('/projects/:id', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const projectToUpdate = projects.find((project) => project.id === id);

    if (!projectToUpdate) {
        return res.status(404).json({ message: 'Project not found' });
    }

    projectToUpdate.name = name;
    projectToUpdate.description = description;
    res.redirect('/projects'); // Redirect to the projects list page.
});

// Delete a project
app.get('/projects/:id/delete', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    res.render('deleteProject.ejs', { id });
});

app.post('/projects/:id/delete', checkAuthenticated, (req, res) => {
    const { id } = req.params;
    const projectIndex = projects.findIndex((project) => project.id === id);

    if (projectIndex === -1) {
        return res.status(404).json({ message: 'Project not found' });
    }

    projects.splice(projectIndex, 1);
    res.redirect('/projects'); // Redirect to the projects list page.
});


app.delete('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.redirect('/error'); // Handle errors as needed
      }
      res.redirect('/tasks');
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
