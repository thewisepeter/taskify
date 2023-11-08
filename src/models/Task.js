const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Task = sequelize.define('Task', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        assignee: {
            type: DataTypes.STRING,
        },
        dueDate: {
            type: DataTypes.DATE,
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });

    return Task;
};

