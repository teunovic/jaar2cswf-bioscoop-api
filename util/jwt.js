let jwt = require('jwt-simple');

module.exports = {
    SECRET_KEY: 'IUHSiushkahIUHFfsh783KJfhj',
    encode: function(id) {
        return jwt.encode(id, this.SECRET_KEY);
    },
    decode: function(token) {
        try {
            return jwt.decode(token, this.SECRET_KEY);
        } catch(err) {
            //console.error(err);
            return null;
        }
    }
};