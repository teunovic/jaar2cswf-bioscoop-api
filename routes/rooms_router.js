let express = require('express');
let router = express.Router();
let ErrorResponse = require('../response_models/errorresponse');
let cinema = require('../models/cinema');
let mongoose = require('mongoose');
let util = require('../util/util');

router.get('/', function(req, res) {
    let search = {};
    if(req.query.name)
        search.name = new RegExp(util.escapeRegExp(req.query.name), 'i');

    cinema.Room.find(search)
        .then(rooms => {
            res.status(200).json(rooms);
        })
        .catch(err => {
            console.error(err);
        })
});

router.all('/:id*', function(req, res, next) {
    let id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        res.status(422).json(new ErrorResponse(1, 'Invalid room id'));
        return;
    }

    cinema.Room.findById(id)
        .then(room => {
            if(!room) {
                res.status(404).json(new ErrorResponse(1, 'Room does not exist'));
                return;
            }
            res.locals.room = room;
            next();
        })
        .catch(err => {
            console.error(err);
        })
});

router.get('/:id', function(req, res) {
    res.status(200).json(res.locals.room);
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
    cinema.Room.create(props)
        .then(room => {
            res.status(200).json(room);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});

router.delete('/:id', function(req, res) {
    cinema.Show.find({room: res.locals.room._id})
        .remove(() => {
            res.locals.room.remove();
            res.status(200).json({});
        })
});

router.put('/:id', function(req, res) {
    cinema.Room.findByIdAndUpdate(res.locals.room._id, req.body, {new: true, runValidators: true})
        .then(updatedRoom => {
            res.status(200).json(updatedRoom);
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});




module.exports = router;