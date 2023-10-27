const program = require('commander');
const axios = require('axios');
const inquirer = require('inquirer');

let authToken = ''; // Store the authentication token here

async function loginUser() {
  try {
    const { username, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter your username:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
      },
    ]);

    const response = await axios.post('http://localhost:3000/login', {
      username,
      password,
    });

    authToken = response.data.token;
    console.log('Login successful. You are now authenticated.');
  } catch (error) {
    console.error('Error logging in:', error.response.data);
  }
}

program
  .command('register')
  .description('Register a new user')
  .option('-u, --username <username>', 'User username')
  .option('-e, --email <email>', 'User email')
  .option('-p, --password <password>', 'User password')
  .action(async (options) => {
    const { username, email, password } = options;

    try {
      // Send a POST request to your registration endpoint
      const response = await axios.post('http://localhost:3000/register', {
        username,
        email,
        password,
      });

      console.log('User registered successfully:', response.data);
    } catch (error) {
      if (error.response) {
        console.error('Error registering user:', error.response.data);
      } else {
        console.error('Error registering user:', error.message);
      }
    }
  });

program
  .command('login')
  .description('Log in to your account')
  .action(loginUser);

program
  .command('add')
  .description('Add a task')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-a, --assignee <assignee>', 'Task assignee')
  .option('-D, --dueDate <dueDate>', 'Task due date')
  .action(async (options) => {
    if (!authToken) {
      console.log('You need to log in first.');
      return;
    }

    const { title, description, assignee, dueDate } = options;

    try {
      const response = await axios.post('http://localhost:3000/tasks', {
        title,
        description,
        assignee,
        dueDate,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Task added successfully:', response.data);
    } catch (error) {
      if (error.response) {
        console.error('Error adding task:', error.response.data);
      } else {
        console.error('Error adding task:', error.message);
      }
    }
  });

program
  .command('modify <taskId>')
  .description('Modify a task by ID')
  .option('-t, --title <title>', 'New task title')
  .option('-d, --description <description>', 'New task description')
  .option('-a, --assignee <assignee>', 'New task assignee')
  .option('-D, --dueDate <dueDate>', 'New task due date')
  .action(async (taskId, options) => {
    if (!authToken) {
      console.log('You need to log in first.');
      return;
    }

    const { title, description, assignee, dueDate } = options;

    try {
      const response = await axios.put(`http://localhost:3000/tasks/${taskId}`, {
        title,
        description,
        assignee,
        dueDate,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log(`Task with ID ${taskId} modified successfully:`, response.data);
    } catch (error) {
      if (error.response) {
        console.error(`Error modifying task with ID ${taskId}:`, error.response.data);
      } else {
        console.error(`Error modifying task with ID ${taskId}:`, error.message);
      }
    }
  });

program
  .command('get')
  .description('Get all tasks')
  .action(async () => {
    if (!authToken) {
      console.log('You need to log in first.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/tasks', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('All tasks:', response.data);
    } catch (error) {
      if (error.response) {
        console.error('Error retrieving tasks:', error.response.data);
      } else {
        console.error('Error retrieving tasks:', error.message);
      }
    }
  });

program
  .command('delete <taskId>')
  .description('Delete a task by ID')
  .action(async (taskId) => {
    if (!authToken) {
      console.log('You need to log in first.');
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log(`Task with ID ${taskId} deleted successfully:`, response.data);
    } catch (error) {
      if (error.response) {
        console.error(`Error deleting task with ID ${taskId}:`, error.response.data);
      } else {
        console.error(`Error deleting task with ID ${taskId}:`, error.message);
      }
    }
  });

program
  .command('logout')
  .description('Logout the current user')
  .action(async () => {
    try {
      // Send a GET or POST request to your logout endpoint
      const response = await axios.get('http://localhost:3000/logout');
      console.log('User logged out successfully:', response.data);
    } catch (error) {
      if (error.response) {
        console.error('Error logging out:', error.response.data);
      } else {
        console.error('Error logging out:', error.message);
      }
    }
  });


program.parse(process.argv);
