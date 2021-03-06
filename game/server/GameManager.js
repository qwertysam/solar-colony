const SocketManager = require('./SocketManager.js')
const gameloop = require('node-gameloop')
const ServerGame = require('./ServerGame.js')

class GameManager extends Object {
  constructor () {
    super()

    this.queuedGames = []
    this.games = []

    let so = this

    this.gameLoopID = gameloop.setGameLoop(function (delta) {
      for (let i in so.games) {
        try {
          so.games[i].update(delta)
        } catch (err) {
          console.log('================================================')
          console.log('ERROR: Server game tick error...')
          console.log('================================================')
          console.log(err)
          console.log('================================================')
        }
      }
    }, 1000 / TICKS_PER_SECOND)

    this.socket = new SocketManager(this)
    this.socket.connect()
  }

  findGame (gameID) {
    for (let i in this.games) {
      if (this.games[i].gameID === gameID) { return this.games[i] }
    }

    for (let i in this.queuedGames) {
      if (this.queuedGames[i].gameID === gameID) { return this.queuedGames[i] }
    }

    return null
  }

  createGame (playerCount) {
    if (exists(playerCount)) {
      playerCount = Math.min(Math.max(playerCount, MIN_PLAYERS), MAX_PLAYERS)
    } else {
      playerCount = MAX_PLAYERS
    }

    // Create a game with an ID
    let id = this.generateSafeID()

    let game = new ServerGame(id, playerCount, this)
    this.games.push(game)
    console.log('Creating Game: ' + id + ' [' + playerCount + ']')

    return game
  }

  removeGame (game) {
    this.removeQueue(game)

    // Remove the game from the server
    let i = this.games.indexOf(game)
    if (i !== -1) {
      this.games.splice(i, 1)
      console.log('Removing Game: ' + game.gameID)
    }
  }

  removeQueue (game) {
    // Remove the game from the queue
    let i = this.queuedGames.indexOf(game)
    if (i !== -1) {
      this.queuedGames.splice(i, 1)
      console.log('Unqueueing Game: ' + game.gameID)
    }
  }

  queue (sock) {
    // When queuing a player begin looking for existing queued games
    for (let i in this.queuedGames) {
      let game = this.queuedGames[i]
      if (game.canAddPlayer()) {
        game.addPlayer(sock)
        return
      }
    }

    // If no game in the queue satisfied the requirements...
    let game = this.createGame()
    game.addPlayer(sock)
    this.queuedGames.push(game)
    console.log('Queueing Game: ' + game.gameID)
  }

  // Generates an ID that no other game currently has
  generateSafeID () {
    while (true) {
      // Generates ID
      let id = ''
      for (let i = 0; i < ID_LENGTH; i++) {
        id += ID_CHARACTERS.charAt(Math.floor(Math.random() * ID_CHARACTERS.length))
      }
      // Makes sure it is safe
      if (!exists(this.findGame(id))) return id
    }
  }
}

module.exports = GameManager
