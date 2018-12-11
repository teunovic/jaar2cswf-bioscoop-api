const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username must be provided'],
        minlength: 2,
        maxlength: 32,
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password must be provided'],
        minlength: 2,
        maxlength: 64,
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};