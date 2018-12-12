let app = require('../app');

before(done => {
    app.listen(3000, () => {
        // Make sure the mongo is loaded BEFORE the tests
        setTimeout(done, 1500);
    });
});