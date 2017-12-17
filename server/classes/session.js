class Session {
    constructor(sessionid, userid, secret) {
        this.type = "session";
        this.sessionid = sessionid;
        this.userid = userid;
        this.secret = secret;
    }
};

module.exports = Session;