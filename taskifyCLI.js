const program = require('commander');
const axios = require('axios');

program
  .command('add')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-a, --assignee <assignee>', 'Task assignee')
  .option('-D, --dueDate <dueDate>', 'Task due date')
  .action(async (options) => {
    const { title, description, assignee, dueDate } = options;

    try {
      const response = await axios.post('http://localhost:3000/tasks', {
        title,
        description,
        assignee,
        dueDate,
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
  .command('delete <taskId>')
  .description('Delete a task by ID')
  .action(async (taskId) => {
    try {
      const response = await axios.delete(`http://localhost:3000/tasks/${taskId}`);
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
  .command('get')
  .description('Get all tasks')
  .action(async () => {
    try {
      const response = await axios.get('http://localhost:3000/tasks');
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
  .command('put <taskId>')
  .description('Update a task by ID')
  .option('-t, --title <title>', 'New task title')
  .option('-d, --description <description>', 'New task description')
  .option('-a, --assignee <assignee>', 'New task assignee')
  .option('-D, --dueDate <dueDate>', 'New task due date')
  .action(async (taskId, options) => {
    const { title, description, assignee, dueDate } = options;

    try {
      const response = await axios.put(`http://localhost:3000/tasks/${taskId}`, {
        title,
        description,
        assignee,
        dueDate,
      });

      console.log(`Task with ID ${taskId} updated successfully:`, response.data);
    } catch (error) {
      if (error.response) {
        console.error(`Error updating task with ID ${taskId}:`, error.response.data);
      } else {
        console.error(`Error updating task with ID ${taskId}:`, error.message);
      }
    }
  });


program.parse(process.argv);
