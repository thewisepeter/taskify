const uuid = require('uuid');

class Project {
    constructor(name, description) {
        this.id = uuid.v4();
        this.name = name;
        this.description = description;
        this.tasks = [];
    }
}

module.exports = Project;