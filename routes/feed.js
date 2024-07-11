const express = require('express');
const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/movies
router.get('/movies', isAuth, feedController.getMovies);

// POST /feed/movie
router.post(
  '/movie',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createMovie
);

router.get('/movie/:movieId', isAuth, feedController.getMovie);

router.put(
  '/movie/:movieId',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updateMovie
);

router.delete('/movie/:movieId', isAuth, feedController.deleteMovie);

module.exports = router;
