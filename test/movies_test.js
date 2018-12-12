let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let mongoose = require('mongoose');
let users = require('../models/users');
let cinema = require('../models/cinema');
let jwt = require('../util/jwt');

chai.use(chaiHttp);

const baseUrl = 'http://localhost:3000';

describe('movie endpoint tests', () => {

    let userToken;
    let adminToken;

    before(done => {
        users.User.create({
            username: 'test-account-user',
            password: 'test1234!'
        }).then(user => {
            userToken = jwt.encode(user._id);
            users.User.create({
                username: 'test-account-admin',
                password: 'test1234!',
                isAdmin: true
            }).then(admin => {
                adminToken = jwt.encode(admin._id);
                done();
            });
        })
    });

    after(done => {
        users.User.deleteMany({
            $or: [{username: 'test-account-user'}, {username: 'test-account-admin'}]
        }).then(() => done());
    });

    it('should not be allowed to create a movie as user', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', userToken)
            .send({
                title: 'Title',
                description: 'Movie description',
                releaseDate: new Date(),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(403);
                done();
            })
    });

    it('should not be able to create a movie with invalid title', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', adminToken)
            .send({
                title: '',
                description: 'Movie description',
                releaseDate: new Date(),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    it('should not be able to create a movie with invalid description', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', adminToken)
            .send({
                title: 'Title',
                description: '',
                releaseDate: new Date(),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    it('should not be able to create a movie with invalid releaseDate', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', adminToken)
            .send({
                title: 'Title',
                description: 'description',
                releaseDate: 'yeet',
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    it('should not be able to create a movie with invalid minutes', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', adminToken)
            .send({
                title: 'Title',
                description: 'description',
                releaseDate: new Date(),
                minutes: -1
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    let movieId;

    it('should be able to create a movie', done => {
        chai.request(baseUrl)
            .post('/movies')
            .set('Authorization', adminToken)
            .send({
                title: 'Test movie',
                description: 'Cool movie',
                releaseDate: new Date(2018, 1, 1, 0, 0, 0, 0),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.title.should.equal('Test movie');
                movieId = res.body._id;
                done();
            })
    });

    it('should have the created movie in the database', done => {
        cinema.Movie.findById(movieId, (err, movie) => {
            should.not.exist(err);
            movie.title.should.equal('Test movie');
            done();
        });
    });

    it('should have the created movie in the GET all', done => {
        chai.request(baseUrl)
            .get('/movies')
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.should.be.an('array');
                res.body.filter(m => m._id === movieId).should.have.lengthOf(1);
                done();
            })
    });

    it('should have the created movie in the GET specific', done => {
        chai.request(baseUrl)
            .get('/movies/' + movieId)
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.title.should.equal('Test movie');
                done();
            })
    });

    it('should be able to change a movie based off its id', done => {
        chai.request(baseUrl)
            .put('/movies/' + movieId)
            .set('Authorization', adminToken)
            .send({
                minutes: 90
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.title.should.equal('Test movie');
                res.body.minutes.should.equal(90);
                done();
            })
    });

    it('should have the same amount of movies in the databases as in the GET all endpoint', done => {
        cinema.Movie.find({}, (dbErr, movies) => {
            should.not.exist(dbErr);
            let dbCount = movies.length;
            chai.request(baseUrl)
                .get('/movies')
                .set('Authorization', userToken)
                .end((err, res) => {
                    should.not.exist(err);
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.should.have.lengthOf(dbCount);
                    done();
                })
        })
    });

    it('should remove a movie from the database on DELETE', done => {
        chai.request(baseUrl)
            .delete('/movies/' + movieId)
            .set('Authorization', adminToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                cinema.Movie.findById(movieId, (err, movie) => {
                    should.not.exist(err);
                    should.not.exist(movie);
                    done();
                });
            })
    });

});