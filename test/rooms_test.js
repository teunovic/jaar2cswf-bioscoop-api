let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let users = require('../models/users');
let cinema = require('../models/cinema');
let jwt = require('../util/jwt');

chai.use(chaiHttp);

const baseUrl = 'http://localhost:3000';

describe('room endpoint tests', () => {

    let userToken;
    let adminToken;

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
    });

    after(done => {
        users.User.deleteMany({
            $or: [{username: 'test-account-user'}, {username: 'test-account-admin'}]
        }).then(() => done());
    });

    it('should not be allowed to create a room as user', done => {
        chai.request(baseUrl)
            .post('/rooms')
            .set('Authorization', userToken)
            .send({
                name: 'Testroom 1'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(403);
                done();
            })
    });

    it('should not be able to create a room with invalid title', done => {
        chai.request(baseUrl)
            .post('/rooms')
            .set('Authorization', adminToken)
            .send({
                name: ''
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            })
    });

    let roomId;

    it('should be able to create a room', done => {
        chai.request(baseUrl)
            .post('/rooms')
            .set('Authorization', adminToken)
            .send({
                name: 'Testroom 1'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.name.should.equal('Testroom 1');
                roomId = res.body._id;
                done();
            })
    });

    it('should have the created room in the database', done => {
        cinema.Room.findById(roomId, (err, room) => {
            should.not.exist(err);
            room.name.should.equal('Testroom 1');
            done();
        });
    });

    it('should have the created room in the GET all', done => {
        chai.request(baseUrl)
            .get('/rooms')
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.should.be.an('array');
                res.body.filter(r => r._id === roomId).should.have.lengthOf(1);
                done();
            })
    });

    it('should have the created room in the GET specific', done => {
        chai.request(baseUrl)
            .get('/rooms/' + roomId)
            .set('Authorization', userToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.name.should.equal('Testroom 1');
                done();
            })
    });

    it('should be able to change a room based off its id', done => {
        chai.request(baseUrl)
            .put('/rooms/' + roomId)
            .set('Authorization', adminToken)
            .send({
                name: 'Testroom 2'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                res.body.name.should.equal('Testroom 2');
                done();
            })
    });

    it('should have the same amount of rooms in the databases as in the GET all endpoint', done => {
        cinema.Room.find({}, (dbErr, rooms) => {
            should.not.exist(dbErr);
            let dbCount = rooms.length;
            chai.request(baseUrl)
                .get('/rooms')
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

    it('should remove a room from the database on DELETE', done => {
        chai.request(baseUrl)
            .delete('/rooms/' + roomId)
            .set('Authorization', adminToken)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                cinema.Room.findById(roomId, (err, room) => {
                    should.not.exist(err);
                    should.not.exist(room);
                    done();
                });
            })
    });

});