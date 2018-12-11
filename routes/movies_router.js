let express = require('express');
let router = express.Router();
let ErrorResponse = require('../response_models/errorresponse');
let cinema = require('../models/cinema');
let mongoose = require('mongoose');
let util = require('../util/util');

router.get('/', function(req, res) {
    let search = {};
    if(req.query.title)
        search.title = new RegExp(util.escapeRegExp(req.query.title), 'i');
    if(req.query.description)
        search.description = new RegExp(util.escapeRegExp(req.query.description), 'i');
    if(req.query.minutes)
        search.minutes = req.query.minutes;

    cinema.Movie.find(search)
        .then(movies => {
            res.status(200).json(movies);
        })
        .catch(err => {
            console.error(err);
        })
});

router.all('/:id*', function(req, res, next) {
    let id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        res.status(422).json(new ErrorResponse(1, 'Invalid movie id'));
        return;
    }

    cinema.Movie.findById(id)
        .then(movie => {
            if(!movie) {
                res.status(404).json(new ErrorResponse(1, 'Movie does not exist'));
                return;
            }
            res.locals.movie = movie;
            next();
        })
        .catch(err => {
            console.error(err);
        })
});

router.get('/:id', function(req, res) {
    res.status(200).json(res.locals.movie);
});

router.all('*', function(req, res, next) {
    // admin check for all endpoints below; POST/PUT/DELETE
    if(!res.locals.user.isAdmin) {
        res.status(403).json(new ErrorResponse(1, 'No authorization'));
        return;
    }
    next();
});

router.post('/', function(req, res) {
    let props = req.body;
    console.log(props);
    cinema.Movie.create(props)
        .then(movie => {
            res.status(200).json(movie);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});

router.delete('/:id', function(req, res) {
    res.locals.movie.remove();
    res.status(200).json({});
});

router.put('/:id', function(req, res) {
    cinema.Movie.findByIdAndUpdate(res.locals.movie._id, req.body, {new: true, runValidators: true})
        .then(updatedMovie => {
            res.status(200).json(updatedMovie);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});




module.exports = router;