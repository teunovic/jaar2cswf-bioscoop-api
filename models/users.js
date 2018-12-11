const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username must be provided'],
        validate: {
            validator: function(v) {
                return /([a-zA-Z0-9-_]{2,32})/.test(v);
            },
            message: 'Username must be alphanumeric and between 2 and 32 characters'
        },
        unique: true,
        trim true
    },
    password: {
        type: String,
        required: [true, 'Password must be provided'],
            validate: {
            validator: function(v) {
                return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v);
            },
            message: 'Password must be at least 8 characters, and contain at least 1 letter and 1 number'
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};
