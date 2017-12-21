class Session {
    constructor(sessionid, userid, secret, ip) {
        this.type = "session";
        this.sessionid = sessionid;
        this.userid = userid;
        this.secret = secret;
        this.ip = ip;
    }
};

module.exports = Session;