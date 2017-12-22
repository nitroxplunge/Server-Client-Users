class DataRequest {
    constructor(datatype, userid, secret, all) {
        this.type = "datarequest";
        this.datatype = datatype;
        this.userid = userid;
        this.secret = secret;
        this.all = all;
    }
};