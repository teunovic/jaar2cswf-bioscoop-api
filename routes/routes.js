let authenticationRouter = require('./authentication_router');
let moviesRouter = require('./movies_router');
let roomsRouter = require('./rooms_router');
let showsRouter  = require('./shows_router');
let ErrorResponse = require('../response_models/errorresponse');


module.exports = router => {

    router.all('*', (req, res, next) => {
        console.log('yeet meat yoyoyoyoyo');
        console.log(req.method + ' ' + req.path);
        next();
    });

    router.use(authenticationRouter);
    router.use('/movies', moviesRouter);
    router.use('/rooms', roomsRouter);
    router.use('/shows', showsRouter);

    router.all('*', (req, res) => {
        res.status(404).json(new ErrorResponse(1, 'Endpoint does not exist'));
    })

};