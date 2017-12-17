class LoginResponse {
    constructor(accepted, userid, secret) {
        this.type = "loginresponse";
        this.accepted = accepted;
        this.userid = userid;
        this.secret = secret;
    }
};

module.exports = LoginResponse;