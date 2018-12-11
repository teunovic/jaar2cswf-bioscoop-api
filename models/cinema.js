const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*•	Films, filmvoorstellingen en zalen.*/

const MovieSchema = new Schema({
    title: {
        type: String,
        required: true,
        minlength: 2
    },
    description: {
        type: String,
        required: true,
        minlength: 2
    },
    releaseDate: {
        type: Date,
        required: true
    },
    minutes: {
        type: Number,
        required: true,
        min: 1,
        max: 1024
    }
});

const RoomSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 2
    }
});

const ShowSchema = new Schema({
    room: {
        type: mongoose.ObjectId,
        ref: 'Room',
        required: true,
        validate: [
            (value) => { return new Promise((res, rej) => Room.findOne({_id: value})
                .then(room => room ? res(room) : rej())
                .catch(err => rej(err))
            )},
            'Room does not exist'
        ]
    },
    movie: {
        type: mongoose.ObjectId,
        ref: 'Movie',
        required: true,
        validate: [
            (value) => { return new Promise((res, rej) => Movie.findOne({_id: value})
                .then(movie => movie ? res(movie) : rej())
                .catch(err => rej(err))
            )},
            'Movie does not exist'
        ]
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
});

ShowSchema.pre('find', function() {
    this.populate(['room', 'movie']);
});
ShowSchema.pre('findOne', function() {
    this.populate(['room', 'movie']);
});

const Movie = mongoose.model('Movie', MovieSchema);
const Room = mongoose.model('Room', RoomSchema);
const Show = mongoose.model('Show', ShowSchema);

module.exports = {Movie, Room, Show};