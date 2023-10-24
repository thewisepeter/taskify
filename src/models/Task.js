#!/opt/homebrew/bin/node
const uuid = require('uuid');

class Task {
    constructor(title, description, assignee, dueDate) {
        this.id = uuid.v4();
        this.title = title;
        this.description = description;
        this.assignee = assignee;
        this.dueDate = dueDate;
        this.completed = false;
    }
}

module.exports = Task;