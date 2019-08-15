import passport from 'passport';
import { Router } from 'express';
import { Strategy as LocalStrategy } from 'passport-local';
import { find, create } from '../models/User';
import createError from 'http-errors';

const tableName = 'User';
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
    },
    async function(email, password, done) {
      try {
        const user = await find(tableName, email);
        if (!user) {
          return done(null, false);
        }
        if (user.password !== password) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function(id, cb) {
  try {
    const user = await find(tableName, id);
    cb(null, user);
  } catch (err) {
    return cb(err);
  }
});

const router = new Router();

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.send(req.user);
});
router.post('/signup', addUser);
router.get('/logout', logout);
router.get('/:id', getUserById);

export default router;

async function addUser(req, res, next) {
  try {
    await create(req.body.alias, req.body.email, req.body.password);
    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await find(tableName, req.params.id);
    if (!user) {
      return next(new createError.NotFound());
    }
    return res.send(user);
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  req.logout();
  return res.sendStatus(200);
}
