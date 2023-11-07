const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, db) {
  const authenticateUser = (email, password, done) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
      if (err) {
        return done(err);
      }   

      const user = rows[0];

      if (!user) {
        return done(null, false, { message: 'No user with that email' }); 
      }   

      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return done(err);
        }   
    
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password incorrect' }); 
        }   
      }); 
    }); 
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
      const user = rows[0];
      return done(null, user);
    } catch (error) {
      return done(error);
    }   
  });
}

module.exports = initialize;
