module.exports = class ErrorResponse {
    constructor(id, message) {
        this.id = id;
        this.message = message;
        this.timestamp =  (new Date().getTime());
    }
};