const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Movie = require('../models/movie');
const User = require('../models/user');

exports.getMovies = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Movie.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      return Movie.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(movies => {
      res.status(200).json({
        message: 'Fetched movies successfully.',
        movies: movies,
        totalItems: totalItems
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createMovie = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const movie = new Movie({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  movie
    .save()
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.movies.push(movie);
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'Movie created successfully!',
        movie: movie,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getMovie = (req, res, next) => {
  const movieId = req.params.movieId;
  Movie.findById(movieId)
    .then(movie => {
      if (!movie) {
        const error = new Error('Could not find movie.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Movie fetched.', movie: movie });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateMovie = (req, res, next) => {
  const movieId = req.params.movieId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  Movie.findById(movieId)
    .then(movie => {
      if (!movie) {
        const error = new Error('Could not find movie.');
        error.statusCode = 404;
        throw error;
      }
      if (movie.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== movie.imageUrl) {
        clearImage(movie.imageUrl);
      }
      movie.title = title;
      movie.imageUrl = imageUrl;
      movie.content = content;
      return movie.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Movie updated!', movie: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteMovie = (req, res, next) => {
  const movieId = req.params.movieId;
  Movie.findById(movieId)
    .then(movie => {
      if (!movie) {
        const error = new Error('Could not find movie.');
        error.statusCode = 404;
        throw error;
      }
      if (movie.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // Check logged in user
      clearImage(movie.imageUrl);
      return Movie.findByIdAndRemove(movieId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.movies.pull(movieId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted movie.' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
