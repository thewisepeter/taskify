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

program.parse(process.argv);
