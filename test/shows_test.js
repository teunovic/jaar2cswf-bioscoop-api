let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let mongoose = require('mongoose');
let users = require('../models/users');
let cinema = require('../models/cinema');
let jwt = require('../util/jwt');

chai.use(chaiHttp);

const baseUrl = 'http://localhost:3000';

describe('show endpoint tests', () => {

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

    it('should not be able to create a show with invalid title', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                title: '',
                description: 'Show description',
                releaseDate: new Date(),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    it('should not be able to create a show with invalid description', done => {
        chai.request(baseUrl)
            .post('/shows')
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

    it('should not be able to create a show with invalid releaseDate', done => {
        chai.request(baseUrl)
            .post('/shows')
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

    it('should not be able to create a show with invalid minutes', done => {
        chai.request(baseUrl)
            .post('/shows')
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

    let showId;

    it('should be able to create a show', done => {
        chai.request(baseUrl)
            .post('/shows')
            .set('Authorization', adminToken)
            .send({
                title: 'Test show',
                description: 'Cool show',
                releaseDate: new Date(2018, 1, 1, 0, 0, 0, 0),
                minutes: 120
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.title.should.equal('Test show');
                showId = res.body._id;
                done();
            })
    });

    it('should have the created show in the database', done => {
        cinema.Show.findById(showId, (err, show) => {
            should.not.exist(err);
            show.title.should.equal('Test show');
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
                res.body.filter(m => m._id === showId).should.have.lengthOf(1);
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
                res.body.title.should.equal('Test show');
                done();
            })
    });

    it('should be able to change a show based off its id', done => {
        chai.request(baseUrl)
            .put('/shows/' + showId)
            .set('Authorization', adminToken)
            .send({
                minutes: 90
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.title.should.equal('Test show');
                res.body.minutes.should.equal(90);
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