//   _____      _               
//  / ____|    | |              
// | (___   ___| |_ _   _ _ __  
//  \___ \ / _ \ __| | | | '_ \ 
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/ 
//                       | |    
//                       |_|   

// This is variable, used here to initialize things
const h = 600
const w = 600

window.onorientationchange = resize

// Creates the PIXI application
const game = new PIXI.Application(w, h, {
	antialias: true,
	transparent: false
})

// Sets up the element
game.view.style.position = 'absolute'
game.view.style.display = 'block'
document.body.appendChild(game.view)
game.renderer.autoResize = true
game.renderer.backgroundColor = Colour.background
document.addEventListener('contextmenu', event => event.preventDefault())

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
const viewportOptions = {
	screenWidth: w,
	screenHeight: h,
	worldWidth: w,
	worldHeight: h,
	ticker: game.ticker
}

const viewport = new Viewport(viewportOptions)
game.stage.addChild(viewport)


const clampOptions = {
	minWidth: 1,
	minHeight: MIN_HEIGHT,
	maxWidth: 1000 * w,
	maxHeight: MAX_HEIGHT
}

const pinchOptions = {
	percent: 4.5
}

viewport
.drag()
.wheel()
.pinch(pinchOptions)
.clampZoom(clampOptions)
.decelerate()

PIXI.loader
.add('sunTexture', 'game/assets/sun.png')
.add('planet1', 'game/assets/planet1.png')
.add('planet2', 'game/assets/planet2.png')
.add('ship', 'game/assets/ship.png')
.add('spawn', 'game/assets/spawn.png')
.add('infantry', 'game/assets/infantry.png')
.load(onLoad)

//  _____       _ _   
// |_   _|     (_) |  
//   | |  _ __  _| |_ 
//   | | | '_ \| | __|
//  _| |_| | | | | |_ 
// |_____|_| |_|_|\__|

var myTeam
var system
var teams
var hud

var socket
var ping = 200

var resources

function onLoad(loader, res) {
	resources = res

	lastElapsed = Date.now()
	game.ticker.add(gameLoop)

	viewport.fitHeight(SUN_HEIGHT)
	viewport.moveCenter(0, 0)

	var style = {
		fontFamily: 'Verdana',
		fontSize: 28,
		fill: Colour.white,
		disabledFill: Colour.greyText
	}

	var smallStyle = {
		fontFamily: 'Verdana',
		fontSize: 18,
		fill: Colour.white,
		disabledFill: Colour.greyText
	}

	var largeStyle = {
		fontFamily: 'Verdana',
		fontSize: 48,
		fill: Colour.white,
		disabledFill: Colour.greyText
	}

	hud = game.stage.addChild(new Hud())

	pixelText = hud.addChild(new TextButton('Pixels: 0', style, 0, 0, 20, 20))
	shipsText = hud.addChild(new TextButton('Ships: 0', style, 0, 0, 0, 0, pixelText, 0, 1))

	countDownText = hud.addChild(new TextButton('Starting Game in 3', largeStyle, 0.5, 0, 0, 30))
	countDownText.anchor.set(0.5, 0)

	buy10ShipText = hud.addChild(new TextButton('10 Ships (90 pixels)', style, 0.5, 0.5, -100, 0))
	buy10ShipText.anchor.set(1, 0.5)
	buy1ShipText = hud.addChild(new TextButton('1 Ship (10 pixels)', style, 0, 0, 0, 2, buy10ShipText, 0, 1))
	buy1ShipText.anchor.set(1, 0.5)
	buy100ShipText = hud.addChild(new TextButton('100 Ships (800 pixels)', style, 0, 0, 0, -2, buy10ShipText, 0, -1))
	buy100ShipText.anchor.set(1, 0.5)

	buySpawnText = hud.addChild(new TextButton('1 Spawn (1000 pixels)', style, 0.5, 0.5, 0, -100))
	buySpawnText.anchor.set(0.5, 1)

	sendShipText = hud.addChild(new TextButton('Send Ships (100 ships)', style, 0.5, 0.5, 100, 0))
	sendShipText.anchor.set(0, 0.5)

	resize()

	socket = new SocketManager()

	gotoTitle()
	connect()
}

//  _____                   _   
// |_   _|                 | |  
//   | |  _ __  _ __  _   _| |_ 
//   | | | '_ \| '_ \| | | | __|
//  _| |_| | | | |_) | |_| | |_ 
// |_____|_| |_| .__/ \__,_|\__|
//             | |              
//             |_|              

var snappingToPlanet = false
var snappingToCenter = false

function stopSnap() {
	snappingToPlanet = false
	snappingToCenter = false
	viewport.removePlugin('snap')
	viewport.removePlugin('snap-zoom')
}

function stopFollow() {
	viewport.removePlugin('follow')
	focusPlanet = null
}

function centerView() {
	if (!snappingToCenter) {
		stopSnap()
		snappingToCenter = true
		stopFollow()
		viewport.snap(0, 0, {
			time: ANIMATION_TIME,
			removeOnComplete: true,
			center: true,
			ease: 'easeInOutSine'
		})

		viewport.snapZoom({
			height: SUN_HEIGHT,
			time: ANIMATION_TIME,
			removeOnComplete: true,
			center: true,
			ease: 'easeOutQuart'
		})
	}
}

function updateKeyboard() {
	if (PIXI.keyboardManager.isPressed(Key.P)) {
		myTeam.pixels += 5000000000000000000000
		hud.updateText()
	}
	if (PIXI.keyboardManager.isPressed(Key.O)) {

	}
	if (PIXI.keyboardManager.isPressed(Key.L)) {

	}

	let screenPoint = game.renderer.plugins.interaction.mouse.global
	if (PIXI.keyboardManager.isPressed(Key.W)) {
		/* TODO
		viewport.down(screenPoint.x, screenPoint.y, {
			id: 0
		})*/
	} else if (PIXI.keyboardManager.isDown(Key.W)) {
		/* TODO
		viewport.move(screenPoint.x, screenPoint.y, {
			id: 0
		})*/
	} else if (PIXI.keyboardManager.isReleased(Key.W)) {
		if (viewport.plugins['drag'] && viewport.plugins['drag'].moved) {

		} else {
			onMouseClick({
				data: {
					global: {
						x: screenPoint.x,
						y: screenPoint.y
					}
				}
			})
		}

		/* TODO
		viewport.up(screenPoint.x, screenPoint.y, {
			id: 0
		})*/
	}

	if (PIXI.keyboardManager.isPressed(Key.ESCAPE) || PIXI.keyboardManager.isPressed(Key.A) || PIXI.keyboardManager.isPressed(Key.D) || PIXI.keyboardManager.isPressed(Key.SPACE)) {

		if (isChoosingShipSend()) {
			cancelSendShips()
		} else {
			centerView()
		}
	}

	PIXI.keyboardManager.update()
}

// Quick hack while dragging error persists:
// Click event fires after drag
var dragging = false
viewport.on('drag-start', function (e) {
	stopSnap()
	stopFollow()
	dragging = true
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', handleClick)
viewport.on('tap', handleClick)

function handleClick(e) {
	if (!dragging) {
		onMouseClick(e)
	} else {
		dragging = false
	}
}

var allowMouseClick = true

function onMouseClick(e) {
	if (allowMouseClick) {
		let screen = e.data.global
		let world = viewport.toWorld(screen)

		var point = new PIXI.Point(screen.x, screen.y)

		if (system) {
			if (isChoosingShipSend()) {
				// updateSelectedPlanet(e.world.x, e.world.y)

				if (selectedPlanet) {
					sendShipsFrom.sendShipsTo(selectedPlanet, sendShipsAmount)
				}
				cancelSendShips()

				return
			}

			stopSnap()

			if (buy1ShipText.clicked(point)) {
				focusPlanet.createShipsClick(1, 10)
				return
			}

			if (buy10ShipText.clicked(point)) {
				focusPlanet.createShipsClick(10, 90)
				return
			}

			if (buy100ShipText.clicked(point)) {
				focusPlanet.createShipsClick(100, 800)
				return
			}

			if (sendShipText.clicked(point)) {
				goToSendShipsScreen(focusPlanet, 100)
				return
			}

			if (buySpawnText.clicked(point)) {
				focusPlanet.createSpawnClick()
				return
			}

			var planet = system.getPlanet(world.x, world.y)
			if (planet) {
				// If the viewport is already following the planet that was clicked on, then don't do anything
				var follow = viewport.plugins['follow']
				if (follow && (follow.target == planet)) {
					// Do the zoom if holding shift
					if (PIXI.keyboardManager.isDown(Key.SHIFT)) {
						viewport.snapZoom({
							height: SUN_HEIGHT,
							time: ANIMATION_TIME,
							removeOnComplete: true,
							ease: 'easeInOutSine'
						})
					} else {
						viewport.snapZoom({
							height: PLANET_HEIGHT,
							time: ANIMATION_TIME,
							removeOnComplete: true,
							ease: 'easeInOutSine'
						})
					}

					return
				}

				snappingToPlanet = planet

				// The calculated future positions of the planet
				var pos = planet.calcPosition(ANIMATION_TIME / 1000)

				// Snap to that position
				viewport.snap(pos.x, pos.y, {
					time: ANIMATION_TIME,
					removeOnComplete: true,
					ease: 'easeOutQuart'
				})

				// Do the zoom if not holding shift
				if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
					viewport.snapZoom({
						height: PLANET_HEIGHT,
						time: ANIMATION_TIME,
						removeOnComplete: true,
						ease: 'easeInOutSine'
					})
				}

				return
			}

			// If nothing was clicked on, remove the follow plugin
			stopFollow()
			centerView()
		}
	}
}

// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
viewport.on('snap-end', function () {
	if (snappingToPlanet) {
		viewport.follow(snappingToPlanet)
		focusPlanet = snappingToPlanet
	}
	stopSnap()
})

//  _    _ _   _ _ 
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

function resize() {
	window.scrollTo(0, 0)

	var oldCenter
	if (viewport.center) {
		oldCenter = viewport.center
	}

	var prevHeight = viewport.worldScreenHeight

	var width = window.innerWidth
	var height = window.innerHeight
	var ratio = height / h

	game.renderer.resize(width, height)
	viewport.resize(width, height, width, height)
	viewport.fitHeight(prevHeight, false)

	// Must maintain the center manually instad of using fitHeight's built in one because the
	// center value will change upon resizing the viewport and game window
	if (oldCenter) {
		viewport.moveCenter(oldCenter)
	}

	stopSnap()
	hud.resize(width, height)
	doGuiResize()
}

function getTeam(id) {
	for (var i in this.teams) {
		if (this.teams[i].id == id) {
			return this.teams[i]
		}
	}
	return null
}

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

// Stats
var lastPixels = -1
var lastShips = -1

// Planet vars
var lastFocus = true
var focusPlanet

function gameLoop() {

	updateKeyboard()

	let now = Date.now()
	let elapsed = now - lastElapsed
	lastElapsed = now
	let eTime = (elapsed * 0.001) // time elapsed in seconds

	if (system) {
		system.update(eTime)

		if (myTeam.shipCount != lastShips) {
			lastShips = myTeam.shipCount
			shipsText.text = 'Ships: ' + myTeam.shipCount
		}

		// TODO this can be done in parse() when the server sends new pixels
		if (myTeam.pixels != lastPixels) {
			lastPixels = myTeam.pixels
			pixelText.text = 'Pixels: ' + myTeam.pixels
		}

		var focussed = focusPlanet && focusPlanet.isMyPlanet()

		if (focussed != lastFocus) {
			lastFocus = focussed

			buy1ShipText.visible = focussed
			buy10ShipText.visible = focussed
			buy100ShipText.visible = focussed
			sendShipText.visible = focussed
			buySpawnText.visible = focussed
		}
		if (focussed) {
			hud.updateText()
		}
	}
}

var gameID = null
var player = 0
var inTeamSelection = false
var countDown

function parse(type, pack) {

	switch (type) {
		case Pack.PING_PROBE:
		let pPack = {
			type: Pack.PING_PROBE,
		}
		socket.ws.send(JSON.stringify(pPack))
		break
		case Pack.PING_SET:
		ping = pack.ping
		setText(PING, 'Ping: ' + ping + 'ms')
		break
		case Pack.UPDATE_PIXELS: // update pixel count
		var pl = pack.pl
		myTeam.pixels = pl
		break
		case Pack.BUY_SHIPS: // buy ships
		system.getPlanetByID(pack.pl).createShips(pack.n)
		break
		case Pack.FORM_FAIL:
		failSendForm(pack.reason)
		break
		case Pack.JOIN_GAME:
		hideMenu()

		countDown = COUNTDOWN_TIME
		inTeamSelection = true

		gameID = pack.gameID
		player = pack.player

		teams = []
		myTeam = null

		setVisible(START_BUTTON)
		setVisible(QUIT_BUTTON)

		setVisible(ID_DISPLAY)
		setText(ID_DISPLAY, 'Game ID: ' + gameID)

		setVisible(TEAM_RED)
		setVisible(TEAM_ORANGE)
		setVisible(TEAM_YELLOW)
		setVisible(TEAM_GREEN)
		setVisible(TEAM_BLUE)
		setVisible(TEAM_PURPLE)

		setVisible(TEAM_LIST_RED)
		setVisible(TEAM_LIST_ORANGE)
		setVisible(TEAM_LIST_YELLOW)
		setVisible(TEAM_LIST_GREEN)
		setVisible(TEAM_LIST_BLUE)
		setVisible(TEAM_LIST_PURPLE)

		setVisible(PING)
		break
		case Pack.CREATE_SYSTEM:
		system = new System()
		break
		case Pack.CREATE_ORBIT:
		var orbit = new Orbit(pack.x, pack.y, pack.radius)
		orbit.id = pack.id
		system.addOrbit(orbit)
		break
		case Pack.CREATE_PLANET:
		var planet = new Planet(resources.planet1.texture, pack.scale, pack.rotationConstant, pack.startAngle, pack.opm)
		planet.id = pack.id
		system.addPlanet(planet)
		break
		case Pack.SET_PLANET_ORBIT:
		var planet = system.getPlanetByID(pack.planet)
		var orbit = system.getOrbit(pack.orbit)
		planet.setOrbit(orbit)
		break
		case Pack.CREATE_SPAWN:
		var planet = system.getPlanetByID(pack.planet)

		if (pack.force) {
			planet.createSpawn(true)
		} else {
			// 1. subtract the counter that has happened while this packet sent
			// 2. update the spawn counter by creating a spawn
			// 3. push the spawn counter forward by the new rate
			planet.spawnCounter -= planet.spawnRate * ping
			planet.createSpawn(false)
			planet.spawnCounter += planet.spawnRate * ping
		}

		break
		case Pack.CREATE_TEAM:
		teams.push(new Team(pack.colour, pack.id))
		break
		case Pack.SET_PLANET_TEAM:
		var planet = system.getPlanetByID(pack.planet)
		var team = getTeam(pack.team)
		planet.setTeam(team)
		break
		case Pack.SET_CLIENT_TEAM:
		myTeam = getTeam(pack.team)

		/*if (waitingMessage) {
			setText(MESSAGE_TEXT, waitingMessage)
			waitingMessage = null
		}*/
		break
		case Pack.SHOW_SYSTEM:
		viewport.addChild(system)
		hideMenu()
		setVisible(PING)
		pixelText.visible = true
		shipsText.visible = true

		// A little hack to get planets to go to their correct positions when the game starts
		system.play() // This lets us update the planets
		system.update(0) // this updates them from their default pos
		system.pause() // This reverts the game state to being paused

		countDownText.text = "Starting Game in " + Math.ceil(countDown / 1000)
		countDownText.visible = true

		viewport.pausePlugin('drag')
		viewport.pausePlugin('pinch')
		viewport.pausePlugin('wheel')
		allowMouseClick = false
		break
		case Pack.START_GAME:
		inTeamSelection = false
		countDown -= COUNTDOWN_INTERVAL
		countDownText.text = "Starting Game in " + Math.ceil(countDown / 1000)

		if (countDown <= 0) {
			system.play()
			system.update(ping / 1000) // fast forward based on our ping

			countDownText.visible = false

			viewport.resumePlugin('drag')
			viewport.resumePlugin('pinch')
			viewport.resumePlugin('wheel')
			allowMouseClick = true
		}

		break
		case Pack.UPDATE_START_BUTTON:
		var started = pack.chosen
		var total = pack.total

		if (isButtonEnabled(START_BUTTON)) {
			setText(MESSAGE_TEXT, 'Press Start to confirm teams (' + started + '/' + total + ')')
		} else {
			let starting = total - started
			setText(MESSAGE_TEXT, 'Waiting for ' + starting + ' player' + (starting != 1 ? 's' : '') + ' to confirm teams (' + started + '/' + total + ')')
		}

		break
		case Pack.POPULATE_TEAM:
		var team = getTeam(pack.team)
		var name = pack.name

		var list

		switch (pack.team) {
			case 0:
			list = document.getElementById(TEAM_LIST_RED)
			break
			case 1:
			list = document.getElementById(TEAM_LIST_ORANGE)
			break
			case 2:
			list = document.getElementById(TEAM_LIST_YELLOW)
			break
			case 3:
			list = document.getElementById(TEAM_LIST_GREEN)
			break
			case 4:
			list = document.getElementById(TEAM_LIST_BLUE)
			break
			case 5:
			list = document.getElementById(TEAM_LIST_PURPLE)
			break
		}

		var entry = document.createElement('li');
		entry.appendChild(document.createTextNode(name));
		list.appendChild(entry);

		team.addPlayer(new Player(name))

		break
		case Pack.CLEAR_TEAMS:
		teams = []
		break
		case Pack.CLEAR_TEAM_GUI:
		for (var i in teams) {
			teams[i].players = []
		}
		document.getElementById(TEAM_LIST_RED).innerHTML = "";
		document.getElementById(TEAM_LIST_ORANGE).innerHTML = "";
		document.getElementById(TEAM_LIST_YELLOW).innerHTML = "";
		document.getElementById(TEAM_LIST_GREEN).innerHTML = "";
		document.getElementById(TEAM_LIST_BLUE).innerHTML = "";
		document.getElementById(TEAM_LIST_PURPLE).innerHTML = "";
		break
		case Pack.UPDATE_PLAYER_COUNT:
		var chosen = pack.chosen
		var total = pack.total
		var max = pack.max

		setVisible(PLAYER_COUNT)
		setText(PLAYER_COUNT, 'Players: (' + total + '/' + max + ')')

		enableButton(START_BUTTON)
		setVisible(MESSAGE_TEXT)

		if (total >= 2) {
			if (chosen == total) {
				// Double checks to make sure that more than one team is populated populated
				var populatedTeams = 0
				for (var i in teams) {
					if (teams[i].players.length > 0) {
						populatedTeams++
					}
				}

				if (populatedTeams > 1) {
					enableButton(START_BUTTON)
					setText(MESSAGE_TEXT, 'Press Start to confirm teams! (0/' + total + ')')
				} else {
					setText(MESSAGE_TEXT, 'More than one team must be populated')
				}
			} else {
				var choosing = total - chosen
				setText(MESSAGE_TEXT, 'Waiting for ' + choosing + ' player' + (choosing != 1 ? 's' : '') + ' to choose a team')
			}
		} else {
			setText(MESSAGE_TEXT, 'Waiting for one or more players to join...')
		}

		// If a team hasn't been chosen yet, display a choose team message
		if (!myTeam) {
			setText(MESSAGE_TEXT, 'Click a colour above to join that team!')
		}
		break
	}

	//console.log('type: ' + type)
	//console.log('pack: ' + pack)
}
