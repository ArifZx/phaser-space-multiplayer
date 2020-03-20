var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io").listen(server);
var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 700) + 50
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "./index.html");
});

io.on("connection", socket => {
  console.log("a user connected");

  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 700) + 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue"
  };

  // send the players object to the new player
  socket.emit("currentPlayers", players);

  // send the star object to the new player
  socket.emit("starLocation", star);

  // send the current scores
  socket.emit("scoreUpdate", scores);

  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", () => {
    console.log("user disconnected");

    // remove this player from our players object
    delete players[socket.id];

    // emit a message to all players to remove this player
    io.emit("disconnect", socket.id);
  });

  socket.on("playerMovement", movementData => {
    if (movementData) {
      Object.keys(movementData).forEach(key => {
        players[socket.id][key] = movementData[key];
      });

      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("starCollected", function() {
    if (players[socket.id].team === "red") {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit("starLocation", star);
    io.emit("scoreUpdate", scores);
  });
});

const PORT = process.env.PORT || 8081;

server.listen(PORT, () => {
  console.log(`listening on`, server.address().port);
});
