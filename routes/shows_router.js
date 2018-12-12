let express = require('express');
let router = express.Router();
let ErrorResponse = require('../response_models/errorresponse');
let cinema = require('../models/cinema');
let mongoose = require('mongoose');
let util = require('../util/util');
let moment = require('moment');

router.get('/', function(req, res) {
    let search = {};
    if(req.query.movie)
        search.movie = req.query.movie;
    if(req.query.room)
        search.room = req.query.room;
    if(req.query.day) {
        let day = new Date(req.query.day);
        if(day)
            search.start = {$gte: moment(day).startOf('day'), $lt: moment(day).endOf('day')};
    }
    cinema.Show.find(search)
        .sort('start')
        .exec()
        .then(shows => {
            res.status(200).json(shows);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
            console.error(err);
        })
});

router.all('/:id*', function(req, res, next) {
    let id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        res.status(422).json(new ErrorResponse(1, 'Invalid show id'));
        return;
    }

    cinema.Show.findById(id)
        .then(show => {
            if(!show) {
                res.status(404).json(new ErrorResponse(1, 'Show does not exist'));
                return;
            }
            res.locals.show = show;
            next();
        })
        .catch(err => {
            console.error(err);
        })
});

router.get('/:id', function(req, res) {
    res.status(200).json(res.locals.show);
});

router.all('*', function(req, res, next) {
    // admin check for all endpoints below; POST/PUT/DELETE
    if(!res.locals.user.isAdmin) {
        res.status(403).json(new ErrorResponse(1, 'No authorisation'));
        return;
    }
    next();
});

router.post('/', function(req, res) {
    let props = req.body;

    let start = new Date(props.start);
    if(!start) {
        res.status(409).json(new ErrorResponse(1, 'Invalid start'));
        return;
    }
    console.log(start);

    cinema.Movie.findById(props.movie)
        .then(movie => {
            if(!movie) {
                res.status(409).json(new ErrorResponse(1, 'Movie does not exist'));
                return;
            }
            let end = moment(start).add(movie.minutes, 'm').toDate();
            props.end = end;

            cinema.Show.find({room: props.room, start: {$lt: end}, end: {$gt: start}})
                .then(shows => {
                    console.log(shows);
                    if(shows.length) {
                        res.status(409).json(new ErrorResponse(2, 'Room in use'));
                        return;
                    }
                    cinema.Show.create(props)
                        .then(show => {
                            res.status(200).json(show);
                        })
                        .catch(err => {
                            res.status(409).json(new ErrorResponse(-2, err.message));
                        })
                })
                .catch(err => {
                    res.status(409).json(new ErrorResponse(-3, err.message));
                });
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        });


});

router.delete('/:id', function(req, res) {
    res.locals.show.remove();
    res.status(200).json({});
});

router.put('/:id', function(req, res) {
    cinema.Show.findByIdAndUpdate(res.locals.show._id, req.body, {new: true, runValidators: true})
        .then(updatedShow => {
            res.status(200).json(updatedShow);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});




module.exports = router;