class IBError extends Error {

    /**
     * 
     * @param {Number} code 
     * @param {String} message 
     * @param {Error} [error]
     */
    constructor(code, message, error) {
        super(error ? (error + " -> " + message) : message);
        this.parentError = error;

        this.code = code;
        this.errorMessage = message;
    }

}
class IBLoginError extends IBError {

    /**
     * 
     * @param {Number} code 
     * @param {String} message 
     * @param {String} username 
     * @param {Error} [error]
     */
    constructor(code, message, username, error) {
        super(code, message, error);

        this.username = username;
    }
    
}
class IBGotoError extends IBError {

    /**
     * 
     * @param {Number} code 
     * @param {String} message 
     * @param {String} goal 
     * @param {Error} [error]
     */
    constructor(code, message, goal, error) {
        super(code, message, error);

        this.goal = goal;
    }

}

module.exports = {
    IBError,
    IBLoginError,
    IBGotoError
};