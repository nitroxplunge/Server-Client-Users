class AddUserResponse {
    constructor(username, password, accepted) {
        this.type = "adduserresponse";
        this.username = username;
        this.password = password;
        this.accepted = accepted;
    }
};

module.exports = AddUserResponse;