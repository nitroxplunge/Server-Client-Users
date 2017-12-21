var WebSocket = require('ws');
var hasher = require('password-hash');
var longstr = require('generate-password');
var fs = require('fs');

var LoginResponse = require("./classes/loginresponse.js");
var Session = require("./classes/session.js");
var User = require("./classes/user.js");
var Task = require("./classes/task.js");

var userFile = 'users.json';

const wss = new WebSocket.Server({ port: 8080 });

var sessions = [];

var tasks = [new Task("code", "Finish Website"), new Task("mechanical", "Build Drivetrain")];

wss.on('connection', function connection(ws, req) {

  ws.on('message', function incoming(message) {

    var request = JSON.parse(message);

    if (request.type === "loginrequest") {
      getUserData()
        .then(function(data) {
          ws.send(respondToLogin(request, data, req.connection.remoteAddress));
        })
        .catch(function(err) {
          console.log("Could not fetch data. Reason: " + err);
        });
    }
    else if (request.type === "datarequest") {
      if(verifyRequest(request)) {
        ws.send(fetchData(request.datatype));
      }
    }

  });
});

function verifyRequest(request) {
  var verified = false;
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].userid == request.userid && sessions[i].secret == request.secret) {
      verified = true;
    }
  }
  return verified;
}

function fetchData(datatype) {
  if (datatype === "task") {
    return(JSON.stringify(tasks));
  }
}

function respondToLogin(request, data, ip) {

  if (verifyPassword(request.username, request.password, data)) {
    var userid = 0;
    for (var i  = 0; i < data.username.length; i++) {
      if (data.username[i] === request.username) {
        userid = data.userid[i];
      }
    }
    var sessid = generateSessionId();
    var sesssecret = longstr.generate({ length: 15, numbers: true, strict: true });
    var session = new Session(sessid, userid, sesssecret, ip);
    sessions.push(session);
    var response = new LoginResponse(true, userid, session.secret);
    return JSON.stringify(response);
  }
  else {
    var response = new LoginResponse(false, 0, "");
    return JSON.stringify(response);
  }

}

function verifyPassword(username, password, userdata) {
  if (usernameAvailable(username, userdata.username) == true) return false;
  var hashpass = "";
  for (var i = 0; i < userdata.username.length; i++) {
    if (userdata.username[i] === username) {
      hashpass = userdata.hashedpassword[i];
    }
  }
  if (hasher.verify(password, hashpass)) {
    console.log("User " + username + " logged in.");
    return true;
  } else {
    return false;
  }
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

function generateUserId(useridarr) {
  var tempid = Math.floor(Math.random() * 100000); // Generate random number between 0 and 99999
  for (var i  = 0; i < useridarr.length; i++) {
    if (useridarr[i] === tempid) {
      return generateUserId(useridarr);
    }
  }
  return tempid;
}

function usernameAvailable(username, usernamearr) {
  for (var i  = 0; i < usernamearr.length; i++) {
    if (usernamearr[i] === username) {
      return false;
    }
  }
  return true;
}

function getUserData() {
  return new Promise(function(resolve, reject) {
    fs.readFile(userFile, 'utf8', function (err, data) {
      if (err) {
        throw err;
        reject(err);
      }
      resolve(JSON.parse(data));
    });
  });
}

function createUser(username, password) {
  
  var hashedpassword = hasher.generate(password);

  getUserData()
    .then(function(data) {
      var userid = generateUserId(data.userid);
      var available = usernameAvailable(username, data.username);
      if (available) {
        fs.readFile(userFile, 'utf8', function (err, data) {
          if (err) throw err;
    
          var userjson = JSON.parse(data);
          userjson.userid.push(userid);
          userjson.username.push(username);
          userjson.hashedpassword.push(hashedpassword);
          userjson = JSON.stringify(userjson);
    
          fs.writeFile (userFile, userjson, function(err) { if (err) throw err });
          console.log("added user \"" + username + "\"")
        });
      } else {
        console.log("username not available");
      }
    })
    .catch(function(err) {
      console.log("Could not fetch data. Reason: " + err);
    });

}