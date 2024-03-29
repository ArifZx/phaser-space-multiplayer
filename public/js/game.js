const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: {
        y: 0
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
var star = {};
var player = {};

function preload() {
  this.load.image("ship", "assets/playerShip1_blue.png");
  1;
  this.load.image("otherPlayer", "assets/playerShip2_green.png");
  this.load.image("star", "assets/Power-ups/star_gold.png");
  // console.log("preload");
}

function create() {
  let self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  this.socket.on("currentPlayers", players => {
    Object.keys(players).forEach(playerId => {
      if (players[playerId].playerId === self.socket.id) {
        addPlayer(self, players[playerId]);
      } else {
        addOtherPlayers(self, players[playerId]);
      }
    });
    // console.log(players);
  });

  this.socket.on("newPlayer", playerInfo => {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on("disconnect", playerId => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on("playerMoved", playerInfo => {
    self.otherPlayers.getChildren().forEach(otherPlayer => {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  // console.log("created");

  this.blueScoreText = this.add.text(16, 16, "", {
    fontSize: "32px",
    fill: "#0000FF"
  });
  this.redScoreText = this.add.text(584, 16, "", {
    fontSize: "32px",
    fill: "#FF0000"
  });

  this.socket.on("scoreUpdate", function(scores) {
    self.blueScoreText.setText("Blue: " + scores.blue);
    self.redScoreText.setText("Red: " + scores.red);
  });

  this.socket.on("starLocation", function(starLocation) {
    // star = starLocation;
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, "star");
    self.physics.add.overlap(
      self.ship,
      self.star,
      function() {
        this.socket.emit("starCollected");
      },
      null,
      self
    );
  });
}

function update() {
  // console.log('update');
  if (this.ship) {
    player = this.ship;
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(
        this.ship.rotation + 1.5,
        100,
        this.ship.body.acceleration
      );
    } else {
      this.ship.setAcceleration(0);
    }

    this.physics.world.wrap(this.ship, 5);

    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;

    if (
      this.ship.oldPosition &&
      (x != this.ship.oldPosition.x ||
        y != this.ship.oldPosition.y ||
        r != this.ship.oldPosition.rotation)
    ) {
      this.socket.emit("playerMovement", { x, y, rotation: r });
    }

    this.ship.oldPosition = { x, y, rotation: r };
  }
}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);

  if (playerInfo.team === "blue") {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }

  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add
    .image(playerInfo.x, playerInfo.y, "ship")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(53, 40);

  if (playerInfo.team === "blue") {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }

  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}
