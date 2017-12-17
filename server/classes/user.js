class User {
    constructor(id, username, hashedpassword, sessionid) {
        this.type = "user";
        this.id = id;
        this.username = username;
        this.hashedpassword = hashedpassword;
        this.sessionid = sessionid;
    }
};

module.exports = User;