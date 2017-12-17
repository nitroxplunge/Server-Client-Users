var WebSocket = require('ws');
var hasher = require('password-hash');
var longstr = require('generate-password');
var mysql = require('mysql');

var LoginResponse = require("./classes/loginresponse.js");
var Session = require("./classes/session.js");
var User = require("./classes/user.js");

const wss = new WebSocket.Server({ port: 8080 });

var sessions = [];

var con = mysql.createConnection({
  host: "localhost",
  user: "webadmin",
  password: "Shaggy2001",
  database: "userinfo"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database");
});

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {

    var data = JSON.parse(message)

    if (data.type === "loginrequest") {
      ws.send(respondToLogin(data));
    }

  });
});

function respondToLogin(request) {

  console.log(JSON.stringify(request));
  var verified = true;

  //console.log(verifyPassword(request.username, request.password));

  var user = new User(result.id, request.username, request.password, null);
  var sessid = generateSessionId();
  var sesssecret = longstr.generate({ length: 15, numbers: true, strict: true });
  var session = new Session(sessid, 0, sesssecret);
  sessions.push(session);
  user.session = session;
  var response = new LoginResponse(true, user.id, session.secret);
  return JSON.stringify(response);
}

function verifyPassword(username, password) {
  var sql = "SELECT * FROM users WHERE username = '" + username + "'";

  con.query(sql, function (err, result) {
    if (err) throw err;

    var pass = result[0].hashedpassword;
    if (hasher.verify(password, pass)) {
      console.log("horray");
      return true;
    } else {
      return false;
    }
  });
}

function generateSessionId() {
  var tempid = Math.floor(Math.random() * 100000); // Generate random number between 0 and 99999
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].id === tempid) {
      return generateSessionId();
    }
  }
  return tempid;
}

function generateUserId() {

  var tempid = Math.floor(Math.random() * 100000); // Generate random number between 0 and 99999

    con.query("SELECT id FROM users", function (err, result) {
      if (err) throw err;

      for (var i  = 0; i < result.length; i++) {
        if (result[i].id === tempid) {
          return generateUserId();
        }
      }

    });
    return tempid;
}

function createUser(username, password) {
  
  var hashedpassword = hasher.generate(password);

    var userid = generateUserId();
    con.query("INSERT INTO users (username, hashedpassword, id) VALUES ('" + username + "', '" + hashedpassword + "', '" + userid + "')", function (err, result) {
      if (err) throw err;
      console.log("user created " + username + ", " + hashedpassword + ", " + userid);
    });

}