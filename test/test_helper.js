let app = require('../app');

before((done) => {
    app.listen(3000, done)
});