var WebSocket = require('ws');
var hasher = require('password-hash');
var longstr = require('generate-password');
var fs = require('fs');

var LoginResponse = require("./classes/loginresponse.js");
var Session = require("./classes/session.js");
var User = require("./classes/user.js");
var Task = require("./classes/task.js");
var AssignEventResponse = require("./classes/assigneventresponse.js");
var ResolveTaskResponse = require("./classes/resolvetaskresponse.js");
var UnresolveTaskResponse = require("./classes/unresolvetaskresponse.js");
var AddUserResponse = require("./classes/adduserresponse.js");
var AddTaskResponse = require("./classes/addtaskresponse.js");

var userFile = 'users.json';
var taskFile = 'tasks.json';

const wss = new WebSocket.Server({ port: 7308 });

var sessions = [];

  wss.on('connection', function connection(ws, req) {

    var ip = req.connection.remoteAddress + ":" + req.connection.remotePort;
    ws.on('message', function incoming(message) {

      var request = JSON.parse(message);

      if (request.type === "loginrequest") {
        getUserData()
          .then(function(data) {
            ws.send(respondToLogin(request, data, ip));
          })
          .catch(function(err) {
            console.log("Could not fetch data. Reason: " + err);
          });
      }
      else if (request.type === "datarequest") {
        if(verifyRequest(request)) {
          if (request.datatype === "task") {
            getTaskData()
              .then(function(data) {
                ws.send(fetchData(request.datatype, request.userid, request.all, request.includefinished, data));
              })
              .catch(function(err) {
                console.log("Could not fetch data. Reason: " + err);
              });
          }
        }
      }
      else if(request.type === "assigneventrequest") {
        if(verifyRequest(request)) {
          if (request.eventtype === "task") {
            assignTaskToUser(request.eventid, request.userid)
              .then(function(data) {
                ws.send(data);
              })
              .catch(function(err) {
                console.log("Could not fetch data. Reason: " + err);
              });
          }
        }
      }
      else if(request.type === "resolvetaskrequest") {
        if(verifyRequest(request)) {
          getTaskData()
            .then(function(data) {
              ws.send(resolveTask(request.taskid, request.userid, data));
            })
            .catch(function(err) {
              console.log("Could not fetch data. Reason: " + err);
            });
        }
      }
      else if(request.type === "unresolvetaskrequest") {
        if(verifyRequest(request)) {
          getTaskData()
            .then(function(data) {
              ws.send(unresolveTask(request.taskid, request.userid, data));
            })
            .catch(function(err) {
              console.log("Could not fetch data. Reason: " + err);
            });
        }
      }
      else if (request.type === "adduserrequest") {
        getUserData()
          .then(function(data) {
            if(verifyRequest(request) && request.userid == 0 && usernameAvailable(request.username, data.username)) {
              createUser(request.username, request.password);
              ws.send(JSON.stringify(new AddUserResponse(request.username, request.password, true)));
            } else {
              ws.send(JSON.stringify(new AddUserResponse(request.username, request.password, false)));
            }
          })
          .catch(function(err) {
            console.log("Could not fetch data. Reason: " + err);
          });
      }
      else if (request.type === "addtaskrequest") {
        getTaskData()
          .then(function(data) {
            addTask(new Task(request.tasktype, data.length, request.contents, -1, "", true, false));
            ws.send(JSON.stringify(new AddTaskResponse(data.length, true)));
          })
          .catch(function(err) {
            console.log("Could not fetch data. Reason: " + err);
          });
      }

    });

    ws.on('close', function close() {
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].ip === ip) {
          console.log("user " + sessions[i].userid + " logged out (disconnect)");
          sessions.splice(i, 1);
        }
      }
    });

    ws.on('error', () => console.log('error (probably a disconnect, new ws sucks)'));

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

function fetchData(datatype, userid, all, includefinished, tasks) {
  if (datatype === "task") {
    var newtasks = [];
    if (all) {
      if (includefinished) {
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].resolved == true) {
            newtasks.push(tasks[i]);
          }
        }
      } else {
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].resolved == false) {
            newtasks.push(tasks[i]);
          }
        }
      }
    } else {
      var newtasks = [];
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].userid == userid && tasks[i].resolved == false) {
          newtasks.push(tasks[i]);
        }
      }
    }
    return(JSON.stringify(newtasks));
  }
}

async function assignTaskToUser(taskid, userid) {
  try {
    var tasks = await getTaskData();
    var userdata = await getUserData();
    return new Promise(function(resolve, reject) {
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].taskid == taskid) {
          if (tasks[i].userid == userid) {
            tasks[i].userid = -1;
            tasks[i].username = getUsernameFromID(userid, userdata);
            tasks[i].open = true;
            var json = "{\"tasks\":"+ JSON.stringify(tasks) + "}";
            fs.writeFile (taskFile, json, function(err) { if (err) throw err });
            resolve(JSON.stringify(new AssignEventResponse(true, taskid, true)));
          }
          else {
            tasks[i].userid = userid;
            tasks[i].open = false;
            var json = "{\"tasks\":"+ JSON.stringify(tasks) + "}";
            fs.writeFile (taskFile, json, function(err) { if (err) throw err });
            resolve(JSON.stringify(new AssignEventResponse(true, taskid, false)));
          }
        }
      }
      resolve(JSON.stringify(new AssignEventResponse(false, taskid, false)));
    });
  }
  catch(err) {
    console.log(err);
  }
}

function resolveTask(taskid, userid, tasks) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].taskid == taskid) {
      tasks[i].resolved = true;
      var json = "{\"tasks\":"+ JSON.stringify(tasks) + "}";
      fs.writeFile (taskFile, json, function(err) { if (err) throw err });
      return JSON.stringify(new ResolveTaskResponse(true, taskid));
    }
  }
  return JSON.stringify(new ResolveTaskResponse(false, taskid));
}

function unresolveTask(taskid, userid, tasks) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].taskid == taskid) {
      tasks[i].resolved = false;
      tasks[i].userid = -1;
      tasks[i].open = true;
      var json = "{\"tasks\":"+ JSON.stringify(tasks) + "}";
      fs.writeFile (taskFile, json, function(err) { if (err) throw err });
      return JSON.stringify(new UnresolveTaskResponse(true, taskid));
    }
  }
  return JSON.stringify(new UnresolveTaskResponse(false, taskid));
}

function isLoggedIn(userid) {
  for (var i  = 0; i < sessions.length; i++) {
    if (sessions[i].userid === userid) {
      return true;
    }
  }
  return false;
}

function respondToLogin(request, data, ip) {
  var userid = 0;
  for (var i  = 0; i < data.username.length; i++) {
    if (data.username[i] === request.username) {
      userid = data.userid[i];
    }
  }
  if (verifyPassword(request.username, request.password, data) && !isLoggedIn(userid)) {
    var sessid = generateSessionId();
    var sesssecret = longstr.generate({ length: 15, numbers: true, strict: true });
    var session = new Session(sessid, userid, sesssecret, ip);
    sessions.push(session);
    console.log("user " + userid + " logged in.");
    var response = new LoginResponse(true, userid, session.secret);
    return JSON.stringify(response);
  }
  else {
    var response = new LoginResponse(false, -1, "");
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
  if (username === "") return false;
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
        reject(err);
        throw err;
      }
      resolve(JSON.parse(data));
    });
  });
}

function getTaskData() {
  return new Promise(function(resolve, reject) {
    fs.readFile(taskFile, 'utf8', function (err, data) {
      if (err) {
        reject(err);
        throw err;
      }
      resolve(JSON.parse(data).tasks);
    });
  });
}

function addTask(task) {
  fs.readFile(taskFile, 'utf8', function (err, data) {
    if (err) throw err;
    
    var eventjson = JSON.parse(data);
    eventjson.tasks.push(task);
    eventjson = JSON.stringify(eventjson);
    
    fs.writeFile (taskFile, eventjson, function(err) { if (err) throw err });
    console.log("added event \"" + task.contents + "\"")
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

function getUsernameFromID(userid, userdata) {
  for (var i = 0; i < userdata.userid.length; i++) {
    if (userdata.userid[i] == userid) {
      return userdata.username[i];
    }
  }
  return "";
}