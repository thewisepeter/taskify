# Taskify
## Simplify Your Task Management


## Introduction

Taskify is a simple task management application that allows users to organize their projects and tasks efficiently.

## Team
1. **Peter Wisdom**

    - Peter is the architectural backbone, ensuring the backend handles data management, API design, and rigorous testing seamlessly.

2. **Arnold Kiirya**

    - Arnold is at the forefront of crafting a user-centric interface, making task management a breeze for our users.

## Technologies 

### Languages
1. JavaScript (Node.js): For the backend server and real-time functionality.
2. ejs/CSS: For frontend web development.

### Database
1. MySql using Sequelize to communicate

### Authentication
1. Passport.js: For user authentication

### Development Tools
1. Visual Studio Code: Code editor or integrated development environment (IDE).
2. Git: Version control system for code manangement

### Learning Resources
1. Eloquent JavaScript by Marijn Haverbeke

## Installation

To run Taskify locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/thewisepeter/taskify.git
   cd taskify

2. **Install dependencies:**
   npm install

3. **Set up the database:**
    - Create a MySQL database and update the database configuration in config/config.json.
    - Run migrations to set up the database schema:
    
    npx sequelize-cli db:migrate

4. **Start the server:**
    npm run devStart
    - The application should now be running at **http://localhost:3000**

**Usage**
    - Visit http://localhost:3000 in your web browser to access the Taskify application.

    - Register an account, log in, and start managing your projects and tasks.

**Contributing**

We welcome contributions! If you'd like to contribute to Taskify, please follow these guidelines:
    1. Fork the repository and create your branch: git checkout -b feature/my-feature.
    2. Commit your changes: git commit -m 'Add some feature'
    3. Push to the branch: git push origin feature/my-feature.
    4. Open a pull request.