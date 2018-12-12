let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let users = require('../models/users');
let cinema = require('../models/cinema');
let jwt = require('../util/jwt');

chai.use(chaiHttp);

const baseUrl = 'http://localhost:3000';

describe('show endpoint tests', () => {

    let userToken;
    let adminToken;

    let movie;
    let room;

    before(async function() {
        let user = await users.User.create({
            username: 'test-account-user',
            password: 'test1234!'
        });
        userToken = jwt.encode(user._id);
        let admin = await users.User.create({
            username: 'test-account-admin',
            password: 'test1234!',
            isAdmin: true
        });
        adminToken = jwt.encode(admin._id);

        movie = await cinema.Movie.create({
            title: 'Test movie',
            description: 'description',
            releaseDate: new Date(),
            minutes: 120
        });
        room = await cinema.Room.create({
            name: 'Testroom A'
        });
    });

    after(async () => {
        await users.User.deleteMany({
            $or: [{username: 'test-account-user'}, {username: 'test-account-admin'}]
        });
        await cinema.Movie.deleteOne({_id: movie._id});
        await cinema.Room.deleteOne({_id: room._id});
    });

    it('should not be allowed to create a show as user', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', userToken)
            .send({
                title: 'Title',
                description: 'Show description',
                releaseDate: new Date(),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(403);
                done();
            })
    });

    it('should not be able to create a show with non-existing movie', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                movie: 'abcdefghijkl', // Any 12 length string is a valid objectid
                room: room._id,
                start: new Date(2019, 1, 1, 20, 0, 0, 0)
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(2);
                done();
            })
    });

    it('should not be able to create a show with non-existing room', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                movie: movie._id,
                room: 'abcdefghijkl',
                start: new Date(2019, 1, 1, 20, 0, 0, 0)
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(3);
                done();
            })
    });

    it('should not be able to create a show with invalid start date', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                movie: movie._id.toString(),
                room: room._id.toString(),
                start: 'boneless meal'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(1);
                done();
            })
    });

    let showId;

    it('should be able to create a show', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                movie: movie._id.toString(),
                room: room._id.toString(),
                start: new Date(2019, 1, 1, 20, 0, 0, 0).toISOString()
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.movie.should.equal(movie._id.toString());
                res.body.room.should.equal(room._id.toString());
                showId = res.body._id;
                done();
            })
    });

    it('should not be able to allow a show in the same room while it\'s in use', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                movie: movie._id.toString(),
                room: room._id.toString(),
                start: new Date(2019, 1, 1, 20, 30, 0, 0).toISOString()
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(4);
                done();
            })
    });

    it('should have the created show in the database', done => {
        cinema.Show.findById(showId, (err, show) => {
            should.not.exist(err);
            should.exist(show);
            done();
        });
    });

    it('should have the created show in the GET all', done => {
        chai.request(baseUrl)
            .get('/shows')
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.should.be.an('array');
                res.body.filter(s => s.movie._id === movie._id.toString() && s.room._id === room._id.toString()).should.have.lengthOf(1);
                done();
            })
    });

    it('should have the created show in the GET specific', done => {
        chai.request(baseUrl)
            .get('/shows/' + showId)
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                done();
            })
    });

    it('should be able to change a show based off its id', done => {
        chai.request(baseUrl)
            .put('/shows/' + showId)
            .set('Authorization', adminToken)
            .send({
                start: new Date(2019, 1, 2, 20, 0, 0, 0)
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                done();
            })
    });

    it('should have the same amount of shows in the databases as in the GET all endpoint', done => {
        cinema.Show.find({}, (dbErr, shows) => {
            should.not.exist(dbErr);
            let dbCount = shows.length;
            chai.request(baseUrl)
                .get('/shows')
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

    it('should remove a show from the database on DELETE', done => {
        chai.request(baseUrl)
            .delete('/shows/' + showId)
            .set('Authorization', adminToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                cinema.Show.findById(showId, (err, show) => {
                    should.not.exist(err);
                    should.not.exist(show);
                    done();
                });
            })
    });

});