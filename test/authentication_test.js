let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let users = require('../models/users');

chai.use(chaiHttp);

const baseUrl = 'http://localhost:3000';

describe('authentication endpoint tests', () => {

    after(async () => {
        await users.User.deleteOne({username: 'test-account'});
    });

    it('should not allow an invalid username', done => {
        chai.request(baseUrl)
            .post('/register')
            .send({
                username: 'vlugge japie',
                password: 'validPass123'
            })
            .end((err, res) => {
                should.not.exist(err);
                console.log(res);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(1);
                done();
            });
    });

    it('should not allow an easy password', done => {
        chai.request(baseUrl)
            .post('/register')
            .send({
                username: 'test-account',
                password: 'lol'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                res.body.should.have.property('id');
                res.body.id.should.equal(1);
                done();
            });
    });

    it('should have user in database after register', done => {
        chai.request(baseUrl)
            .post('/register')
            .send({
                username: 'test-account',
                password: 'validPass123'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                users.User.findOne({
                    username: 'test-account'
                }).then(user => {
                    should.exist(user);
                    done();
                });
            });
    });
    it('should not allow double usernames', done => {
        chai.request(baseUrl)
            .post('/register')
            .send({
                username: 'test-account',
                password: 'validPass123'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(409);
                done();
            });
    });

});