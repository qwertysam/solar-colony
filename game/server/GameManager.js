var SocketManager = require('./SocketManager.js')
let gameloop = require('node-gameloop')
var Game = require('./Game.js')

const idLength = 6
const idChars = 'ABCDEFGHJKMNOPQRSTUVWXYZ23456789'

const maxPlayerCount = 8 * 6

class GameManager extends Object {
    constructor() {
        super()

        this.queuedGames = []
        this.games = []

        let so = this

        this.gameLoopID = gameloop.setGameLoop(function (delta) {
            for (var i in so.games) {
                try {
                    so.games[i].update(delta)
                } catch (err) {
                    console.log("================================")
                    console.log("ERROR: Server game tick error...")
                    console.log("================================")
                    console.log(err)
                }
            }
        }, 1000 / 30);

        this.socket = new SocketManager(this)
        this.socket.connect()
    }

    parse(sender, type, packet) {

        if (type == 'p') {
            if (sender.pinger) {
                sender.pinger.recieve()
            }
        } else if (this.socket.approved(sender)) {
            sender.game.parse(sender, type, packet)
        } else if (type == 'form') {
            this.socket.addConnection(sender, packet.host, packet.user, packet.id, packet.players)
        }

        // console.log('type: ' + type)
        // console.log('packet: ' + packet)
    }

    findGame(gameID) {
        for (var i in this.games) {
            if (this.games[i].gameID == gameID)
                return this.games[i]
        }
        return null
    }

    createGame(maxPlayers) {
        if (exists(maxPlayers)) {
            maxPlayers = Math.min(maxPlayers, maxPlayerCount)
            if (maxPlayers < 2)
                maxPlayers = maxPlayerCount
        } else {
            maxPlayers = maxPlayerCount
        }

        // Create a game with an ID
        var id = this.generateSafeID()

        var game = new Game(this, id, maxPlayers)
        this.games.push(game)
        console.log('Creating Game: ' + id + ' [' + maxPlayers + ']')

        return game
    }

    removeGame(game) {
        // Remove the game from the server
        var i = this.games.indexOf(game)
        if (i != -1) {
            this.games.splice(i, 1)
            console.log('Removing Game: ' + game.gameID)
        }

        this.removeQueue(game)
    }

    removeQueue(game) {
        // Remove the game from the queue
        var i = this.queuedGames.indexOf(game)
        if (i != -1) {
            this.queuedGames.splice(i, 1)
            console.log('Unqueueing Game: ' + game.gameID)
        }
    }

    queue(sock, name, playerCount) {
        // When queuing a player begin looking for existing queued games
        for (var i in this.queuedGames) {
            let game = this.queuedGames[i]

            // If the game has the player count being looked for
            let playerCountSatisfied = playerCount < 2 || game.maxPlayers == playerCount

            // If the player count is good and the player can be added to the game

            if (playerCountSatisfied && game.canAddPlayer()) {
                game.addPlayer(sock, name)
                return
            }
        }

        // If no game in the queue satisfied the requirements...
        let game = this.createGame(playerCount)
        game.addPlayer(sock, name)
        this.queuedGames.push(game)
        console.log('Queueing Game: ' + game.gameID)
    }

    // Generates an ID that no other game currently has
    generateSafeID() {
        var id
        while (true) {
            id = this.generateID()
            if (this.findGame(id) == null) {
                return id
            }
        }
    }

    // Generates a random game ID
    generateID() {
        var id = ''
        for (var i = 0; i < idLength; i++) {
            id += idChars.charAt(Math.floor(Math.random() * idChars.length))
        }
        return id
    }
}

module.exports = GameManager
