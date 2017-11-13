//   _____      _               
//  / ____|    | |              
// | (___   ___| |_ _   _ _ __  
//  \___ \ / _ \ __| | | | '_ \ 
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/ 
//                       | |    
//                       |_|   

/*class Line extends PIXI.Graphics {
    constructor(points, lineSize, lineColor) {
        super()

        this.lineWidth = lineSize || 5
        this.lineColor = lineColor || "0x000000"

        //this.updatePoints(points)

        this.lineStyle(this.lineWidth, this.lineColor)
        this.moveTo(points[0], points[1])
        this.lineTo(points[2], points[3])

        this.delay = false
    }

    updatePoints(points) {

        //this.position.set(points[0], points[1])
        //this.scale.set()

        
        if (this.delay) {
            this.clear()
        }
        this.delay = !this.delay

        this.lineStyle(this.lineWidth, this.lineColor)
        this.moveTo(points[0], points[1])
        this.lineTo(points[2], points[3])
    }
}*/

class Line extends PIXI.Graphics {
    constructor(lineSize, lineColor) {
        super()
        
        this.l_width = lineSize || 5
        this.l_colour = lineColor || "0x000000"
    }
    
    setPoints(points) {
        this.clear()
        this.lineStyle(this.l_width, this.l_colour)
        
        this.moveTo(points[0], points[1])
        this.lineTo(points[2], points[3])
    }
}

const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)

const maxHeight = 1000
const minHeight = 100

// This is variable, used here to initialize things
const h = 600
const w = 600

window.addEventListener('resize', resize)
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
document.addEventListener('contextmenu', event => event.preventDefault());

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
const viewportOptions = {
    pauseOnBlur: false,
    screenWidth: w,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
}

const viewport = new Viewport(game.stage, viewportOptions)

const clampOptions = {
    minWidth: 1,
    minHeight: minHeight,
    maxWidth: 1000 * w,
    maxHeight: maxHeight
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
    .load(onLoad)

//  _____       _ _   
// |_   _|     (_) |  
//   | |  _ __  _| |_ 
//   | | | '_ \| | __|
//  _| |_| | | | | |_ 
// |_____|_| |_|_|\__|

const hudMargin = 20
const textSize = 30

var planets
var sun

var hud

var shipTexture

function onLoad(loader, resources) {

    const stage = game.stage

    const orbit1 = game.stage.addChild(createOrbit(0, 0, 150, 25))
    const orbit2 = game.stage.addChild(createOrbit(0, 0, 220, 25))
    const orbit3 = game.stage.addChild(createOrbit(0, 0, 270, 25))
    const orbit4 = game.stage.addChild(createOrbit(0, 0, 360, 25))

    sun = new PIXI.particles.Emitter(stage, resources.sunTexture.texture, sunParticle)
    sun.emit = true

    const planet1 = stage.addChild(createPlanet(resources.planet1.texture, orbit1, 0.1, -1 / 4, Math.PI / 2, 2))
    const planet2a = stage.addChild(createPlanet(resources.planet2.texture, orbit2, 0.1, -1 / 6, 0, 1))
    const planet2b = stage.addChild(createPlanet(resources.planet2.texture, orbit2, 0.1, -1 / 6, Math.PI, 1))
    const planet3 = stage.addChild(createPlanet(resources.planet1.texture, orbit3, 0.1, 1 / 3, Math.PI / 4, 1 / 2))
    const planet4 = stage.addChild(createPlanet(resources.planet2.texture, orbit4, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4))

    planets = [planet1, planet2a, planet2b, planet3, planet4]

    lastElapsed = Date.now()
    game.ticker.add(gameLoop)

    viewport.fitHeight(centerHeight)
    viewport.moveCenter(0, 0)

    hud = new PIXI.Container()
    stage.addChild(hud)

    var style = {
        fontFamily: 'Verdana',
        fontSize: textSize,
        fill: Colour.dark10
    };

    pixelText = new PIXI.Text('Pixels: 0', style)
    hud.addChild(pixelText)

    shipsText = new PIXI.Text('Ships: 0', style)
    hud.addChild(shipsText)

    buy1ShipText = new PIXI.Text('1 Ship (10 pixels)', style)
    hud.addChild(buy1ShipText)
    buy10ShipText = new PIXI.Text('10 Ship (90 pixels)', style)
    hud.addChild(buy10ShipText)
    buy100ShipText = new PIXI.Text('100 Ship (800 pixels)', style)
    hud.addChild(buy100ShipText)

    sendShipText = new PIXI.Text('Send Ships (100 ships)', style)
    hud.addChild(sendShipText)

    shipTexture = resources.ship.texture

    resize()

    for (i in planets) {
        planets[i].tint = 0xFFFFFF
    }

    // Setup for testing the game
    myPlanet = planet2a
    //planet1.tint = 0xFFCCCC
    planet2a.tint = 0xFFAAAA
    planet2b.tint = 0xAAAAFF
    //planet3.tint = 0xCCCCFF
    //planet4.tint = 0xFAFACC
}

//  _____                   _   
// |_   _|                 | |  
//   | |  _ __  _ __  _   _| |_ 
//   | | | '_ \| '_ \| | | | __|
//  _| |_| | | | |_) | |_| | |_ 
// |_____|_| |_| .__/ \__,_|\__|
//             | |              
//             |_|              

const animTime = 300
const zoomHeight = 250
const centerHeight = 800
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
            time: animTime,
            removeOnComplete: true,
            ease: 'easeInOutSine'
        })

        viewport.snapZoom({
            height: centerHeight,
            time: animTime,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutQuart'
        })
    }
}

function updateKeyboard() {
    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.UP)) {
        stopSnap()
        stopFollow()
        viewport.snap(0, 0, {
            time: 1000,
            removeOnComplete: true,
            ease: 'easeOutQuart'
        })
    }

    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.RIGHT)) {

        viewport.snapZoom({
            height: 200,
            time: 5000,
            removeOnComplete: true,
            ease: 'easeOutExpo',
            center: {
                x: 0,
                y: 0
            }
        })
    }

    if (PIXI.keyboardManager.isPressed(Key.P)) {
        pixels += 5000
    }
    if (PIXI.keyboardManager.isPressed(Key.O)) {
        removeShips(myPlanet, 10)
    }

    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        //viewport.removePlugin('snap')

        for (i in planets) {
            drawLines[i].clear()
        }
    }

    if (PIXI.keyboardManager.isPressed(Key.ESCAPE)) {
        centerView()
    }

    PIXI.keyboardManager.update()
}

viewport.on('drag-start', function (e) {
    stopSnap()
    stopFollow()
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', function (e) {
    stopSnap()

    var point = new PIXI.Point(e.screen.x, e.screen.y)

    if (buy1ShipText.visible && buy1ShipText.containsPoint(point)) {
        createShips(myPlanet, 1, 10)
        return
    }

    if (buy10ShipText.visible && buy10ShipText.containsPoint(point)) {
        createShips(myPlanet, 10, 90)
        return
    }

    if (buy100ShipText.visible && buy100ShipText.containsPoint(point)) {
        createShips(myPlanet, 100, 800)
        return
    }

    if (sendShipText.visible && sendShipText.containsPoint(point)) {
        goToSendShipsScreen(myPlanet)
        return
    }

    var planet = getPlanet(e.world.x, e.world.y)
    if (planet) {

        // If the viewport is already following the planet that was clicked on, then don't do anything
        var follow = viewport.plugins['follow']
        if (follow && (follow.target == planet)) {
            // Do the zoom if holding shift
            if (PIXI.keyboardManager.isDown(Key.SHIFT)) {
                viewport.snapZoom({
                    height: centerHeight,
                    time: animTime,
                    removeOnComplete: true,
                    ease: 'easeInOutSine'
                })
            } else {
                viewport.snapZoom({
                    height: zoomHeight,
                    time: animTime,
                    removeOnComplete: true,
                    ease: 'easeInOutSine'
                })
            }

            return
        }

        snappingToPlanet = planet

        // The calculated future positions of the planet
        var pos = calcPlanetPosition(planet, (animTime / 1000))

        // Snap to that position
        viewport.snap(pos.x, pos.y, {
            time: animTime,
            removeOnComplete: true,
            ease: 'easeOutQuart'
        })

        // Do the zoom if not holding shift
        if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
            viewport.snapZoom({
                height: zoomHeight,
                time: animTime,
                removeOnComplete: true,
                ease: 'easeInOutSine'
            })
        }

    } else {
        // If nothing was clicked on, remove the follow plugin
        stopFollow()

        if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
            centerView()
            return
        }

        const sunRadiusSqr = 100 * 100

        if (distSqr(e.world.x, e.world.y, 0, 0) < sunRadiusSqr) {
            centerView()
        }
    }
})
// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
viewport.on('snap-end', function () {
    if (snappingToPlanet) {
        viewport.follow(snappingToPlanet)
        focusPlanet = snappingToPlanet
        snappingToPlanet = false
    }
    snappingToCenter = false
})

//   _____                _       
//  / ____|              | |      
// | |     _ __ ___  __ _| |_ ___ 
// | |    | '__/ _ \/ _` | __/ _ \
// | |____| | |  __/ (_| | ||  __/
//  \_____|_|  \___|\__,_|\__\___|

const minDashes = 2
const dashThickness = 1.4

// The max number of ships to display in storage per planet
const maxShips = 100

function createOrbit(x, y, radius, dashLength) {

    var numOfDashes = Math.max(Math.floor(Math.PI * radius / dashLength), minDashes)
    var dashRadians = dashLength / radius
    var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

    var pixiCircle = new PIXI.Graphics()
    pixiCircle.radius = radius

    // If it's a full circle, draw it full (more optimised)
    if (spacingRadians <= 0) {
        pixiCircle.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
        pixiCircle.arc(x, y, radius, 0, 2 * Math.PI)
    } else { // Else, draw it dashed
        for (i = 0; i < numOfDashes; i++) {
            var start = i * (dashRadians + spacingRadians)
            var end1 = start + dashRadians
            var end2 = end1 + spacingRadians
            pixiCircle.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
            pixiCircle.arc(x, y, radius, start, end1)
            pixiCircle.lineStyle(dashThickness, Colour.background, 0)
            pixiCircle.arc(x, y, radius, end1, end2)
        }
    }

    // disgusting
    // pixiCircle.cacheAsBitmap = true

    return pixiCircle
}

function createPlanet(texture, orbit, scale, rotationConstant, startAngle, opm) {
    var planet = new PIXI.Sprite(texture)
    planet.radius = 0.5 * planet.width
    planet.orbit = orbit
    planet.pivot.set(planet.radius, planet.radius)
    planet.scale.set(scale)
    planet.radius = planet.radius * planet.scale.x
    planet.opm = opm
    // The rotation speed in radians/second
    planet.speed = opm * (1 / 60) * 2 * Math.PI
    planet.rotationConstant = rotationConstant
    planet.ships = []
    planet.age = startAngle / planet.speed
    return planet
}

function createShips(planet, n, cost) {
    if (pixels >= cost) {
        pixels -= cost
        for (var i = 0; i < n; i++) {
            if (ships < maxShips) {
                var ship = new PIXI.Sprite(shipTexture)

                // The position on the planet's surface to place the ship (the angle)
                // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
                let angle = Math.PI * 2 * Math.random()

                let distFromPlanet = 60

                // hypotenuse, opposite, adjacent
                let h = planet.radius / planet.scale.x + distFromPlanet
                let o = h * Math.sin(angle)
                let a = h * Math.cos(angle)
                let x = a + planet.radius / planet.scale.x
                let y = o + planet.radius / planet.scale.x

                ship.tint = planet.tint
                ship.pivot.set(0.5, 0.5)
                ship.position.set(x, y)
                ship.rotation = angle + (Math.PI / 2)
                planet.addChild(ship)
                planet.ships.push(ship)
            }
            ships++
        }
    }
}

function removeShips(planet, n) {

    var visualsToRemove = Math.min(n, Math.max(0, maxShips - ships + n))

    if (visualsToRemove > 0) {
        // Removes the ships from the world
        for (var i = 0; i < visualsToRemove && i < planet.ships.length; i++) {
            planet.removeChild(planet.ships[i])
        }

        // Removes the ships from the array
        planet.ships.splice(0, visualsToRemove)
    }

    ships = Math.max(0, ships - n)
}

//  _    _ _   _ _ 
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40

function getPlanet(x, y) {
    for (var i in planets) {
        let clickThresh = (planets[i].radius + clickThreshold)
        if (distSqr(x, y, planets[i].x, planets[i].y) < clickThresh * clickThresh) {
            return planets[i]
        }
    }

    return null
}

function distSqr(x1, y1, x2, y2) {
    return ((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2))
}

function calcPlanetPosition(planet, additionalAge) {
    if (!additionalAge)
        additionalAge = 0

    let radius = planet.orbit.radius
    let age = planet.age + additionalAge
    let x = Math.cos(age * planet.speed) * radius
    let y = Math.sin(age * planet.speed) * radius
    return {
        x: x,
        y: y
    }
}

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
    viewport.resize(width, height)
    viewport.fitHeight(prevHeight, false)

    // Must maintain the center manually instad of using fitHeight's built in one because the
    // center value will change upon resizing the viewport and game window
    if (oldCenter) {
        viewport.moveCenter(oldCenter)
    }

    stopSnap()
    resizeHud(width, height)
}

function updateHud() {
    hud.position.copy(viewport.toWorld(0, 0))
    hud.scale.set(1 / game.stage.scale.x)
}

function resizeHud(width, height) {
    pixelText.position.set(hudMargin, hudMargin)
    shipsText.position.set(hudMargin, hudMargin + pixelText.height + 2)

    buy1ShipText.position.set(width / 2 - buy1ShipText.width - 100, (height - buy1ShipText.height) / 2 + buy10ShipText.height + 2)
    buy10ShipText.position.set(width / 2 - buy10ShipText.width - 100, (height - buy10ShipText.height) / 2)
    buy100ShipText.position.set(width / 2 - buy100ShipText.width - 100, (height - buy100ShipText.height) / 2 - buy10ShipText.height - 2)

    sendShipText.position.set(width / 2 + 100, (height - buy10ShipText.height) / 2)
}

var drawLinesFrom
var drawLines

function goToSendShipsScreen(fromPlanet) {
    centerView()
    drawLinesFrom = fromPlanet

    if (!drawLines) {
        drawLines = []

        for (i in planets) {
            drawLines.push(game.stage.addChild(new Line(dashThickness, planets[i].tint)))
        }
    }
}

function cancelSendShips() {

    for (i in drawLines) {
        drawLines[i].visible = false
    }

    drawLinesFrom = null
    drawLinesTo = null
}

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

var lastPixels = 1
var pixels = 0
var lastShips = 1
var ships = 0
var planets
var myPlanet
var focusPlanet

var mybool = false

function gameLoop() {

    updateKeyboard()

    let now = Date.now()
    let elasped = now - lastElapsed
    lastElapsed = now
    let eTime = (elasped * 0.001)

    // Update the particle emitter
    sun.update(eTime)

    for (i in planets) {
        // Age the planet
        planets[i].age += eTime;
        var pos = calcPlanetPosition(planets[i])
        planets[i].position.set(pos.x, pos.y)
        // Rotate the planet (purely for visual effects)
        planets[i].rotation = planets[i].age * planets[i].rotationConstant
        // Rotate the orbits (purely for visual effects)
        planets[i].orbit.rotation = -planets[i].age * planets[i].speed / 8
    }

    viewport.update()

    if (pixels != lastPixels) {
        lastPixels = pixels
        pixelText.text = 'Pixels: ' + pixels
    }
    if (ships != lastShips) {
        lastShips = ships
        shipsText.text = 'Ships: ' + ships
    }

    if (focusPlanet && focusPlanet == myPlanet) {
        buy1ShipText.visible = true
        buy10ShipText.visible = true
        buy100ShipText.visible = true
        sendShipText.visible = true
    } else {
        buy1ShipText.visible = false
        buy10ShipText.visible = false
        buy100ShipText.visible = false
        sendShipText.visible = false
    }

    if (drawLinesFrom) {
        for (i in planets) {
            if (planets[i] != drawLinesFrom) {
                drawLines[i].setPoints([planets[i].position.x,
                                       planets[i].position.y,
                                       drawLinesFrom.position.x,
                                       drawLinesFrom.position.y])
            }
        }
    }

    updateHud()
}