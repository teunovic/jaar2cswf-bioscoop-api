let express = require('express');
let bcrypt = require('bcrypt');
let router = express.Router();
let ErrorResponse = require('../response_models/errorresponse');
let users = require('../models/users');
let jwt = require('../util/jwt');


router.post('/login', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    console.log('logging in with ' + username);

    users.User.findOne({username: username, password: password})
        .then(user => {
            console.log(user);
            if (!user) {
                res.status(403).json(new ErrorResponse(1, "Incorrect username or password"));
                return;
            }

            res.json({
                _id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                token: jwt.encode(user._id)
            });
        })
        .catch(err => {
            res.status(409).json(new ErrorResponse(-1, err.message));
        })
});

router.post('/register', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    users.User.create({username: username, password: password})
        .then(user => {
            res.json({
                _id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                token: jwt.encode(user._id)
            });
        })
        .catch(err => {
            if(err.code === 11000) {
                res.status(409).json(new ErrorResponse(2, 'Username is already taken'));
                return;
            }
            res.status(409).json(new ErrorResponse(1, err.message));
        })
});


router.all('*', function(req, res, next) {
    let token = req.get('Authorization');
    if(!token) {
        res.status(403).json(new ErrorResponse(1, 'Did not provide authorization token'));
        return;
    }

    let id = jwt.decode(token);
    if(!id) {
        res.status(403).json(new ErrorResponse(2, 'Invalid authorization token'));
        return;
    }

    users.User.findById(id)
        .then(user => {
            if(!user) {
                res.status(403).json(new ErrorResponse(3, 'Invalid authorization token'));
                return;
            }
            res.locals.user = user;
            next();
        })
});



module.exports = router;
