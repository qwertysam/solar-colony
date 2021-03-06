const shipSpeed = 15 // units per second

class Planet extends (IS_SERVER ? Object : PIXI.Sprite) {
  constructor (radius, rotationConstant, startAngle, opm, system) {
    if (IS_SERVER) {
      super()
    } else {
      super(resources.planet1.texture)
    }

    this.radius = radius

    let gring
    let scale

    if (IS_SERVER) {
      this.infantry = {}
    } else {
      scale = radius / this.width
      this.pixelRadius = this.width / 2

      this.pivot.set(this.pixelRadius, this.pixelRadius)

      // Infantry
      this.infantry = new PIXI.particles.Emitter(this, resources.infantry.texture, Particle.Infantry)
      this.infantry.updateSpawnPos(this.pixelRadius, this.pixelRadius)
      this.infantry.emit = false

      // Selection ring
      let ring = new PIXI.Graphics()
      ring.lineStyle(DASH_THICKNESS * 46, Colour.DARK8)
      ring.arc(this.pixelRadius, this.pixelRadius, this.pixelRadius * 3, 0, 7)
      ring.visible = false
      this.outline = this.addChild(ring)

      // Ghost selection ring
      gring = new PIXI.Graphics()
      gring.lineStyle(scale * DASH_THICKNESS * 46, Colour.DARK8)
      gring.arc(scale * this.pixelRadius, scale * this.pixelRadius, scale * this.pixelRadius * 3, 0, 7)
      gring.visible = false

      // Set the scale
      this.scale.set(scale)
    }

    this.pixelRate = 0
    this.pixelCounter = 0

    this.startAngle = startAngle
    // orbits per minute
    this.opm = opm

    if (!IS_SERVER) {
      // Ghosting ring
      let ghost = new PIXI.Graphics()
      ghost.lineStyle(DASH_THICKNESS * 2, Colour.DARK8)
      ghost.arc(this.pixelRadius * scale, this.pixelRadius * scale, this.pixelRadius * scale, 0, 7)
      ghost.visible = false
      ghost.pivot.set(this.pixelRadius * scale, this.pixelRadius * scale)
      ghost.outline = ghost.addChild(gring)
      this.ghost = system.addChild(ghost)

      let li = new Line(2)
      li.setPoints(0, 0)
      this.drawLine = system.addChild(li)
    }

    // The rotation speed in radians/second
    this.speed = opm * (1 / 60) * 2 * Math.PI
    this.rotationConstant = rotationConstant
    this.age = startAngle / this.speed

    if (IS_SERVER) {
      addPosition(this)
      // Server-side counter
      this.spawns = 0
    } else {
      this.spawns = []
    }

    this.team = null
    this.ships = []
    this.shipCount = 0
    this.fighters = []
    if (!IS_SERVER) this.displayFighters = []
  }

  update (delta) {
    // Age the planet
    this.age += delta
    this.updatePosition()
    if (!IS_SERVER) {
      // Rotate the planet (purely for visual effects)
      this.rotation = this.age * this.rotationConstant
      // Updates infantry
      this.infantry.update(delta)
    }

    if (IS_SERVER || this.isMyPlanet()) {
      this.pixelCounter += this.pixelRate * delta

      // Adds the accumulated number of pixels to a user
      let toAdd = Math.floor(this.pixelCounter)
      if (toAdd > 0) {
        this.pixelCounter -= toAdd
        this.team.addPixels(toAdd)
      }
    }
  }

  // Some team's ships arriving
  arrive (team, amount) {
    if (exists(this.team)) {
      // Battle existing team
      // Note: there could be multiple teams fighting at once
      createFighters(team, amount)
    } else {
      // Colonize
      setTeam(team)
    }
  }

  createFighters (team, n) {
    for (let i = 0; i < n; i++) {
      // Add the teams to a list of fighters
      this.fighters.push(team)
    }
    updateDisplayFighters()
  }

  updateDisplayFighters () {
    // Adds all existing fighters (so long as it's below the max display ships count)
    for (let i = 0; i < MAX_DISPLAY_SHIPS && i < this.fighters.length; i++) {
      let ship = new PIXI.Sprite(resources.ship.texture)

      // The position on the planet's surface to place the ship (the angle)
      // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
      let angle = Math.PI * 2 * Math.random()

      let distFromPlanet = 60

      // hypotenuse, opposite, adjacent
      let h = this.pixelRadius + distFromPlanet
      let o = h * Math.sin(angle)
      let a = h * Math.cos(angle)
      let x = a + this.pixelRadius
      let y = o + this.pixelRadius

      ship.tint = this.tint
      ship.pivot.set(ship.width * 0.5, ship.height * 0.5)
      ship.position.set(x, y)
      ship.rotation = angle - (Math.PI / 2)
      this.addChild(ship)
      this.displayShips.push(ship)
    }
  }

  // to = target planet
  // This function determines the time to the nearest intercept of the ships
  // Being send from this planet to "to". This is useful because we can then
  // determine the position that "to" will be in for the nearest intercept
  timeToFastestIntersect (to) {
    // Can be ound on Desmos here https://www.desmos.com/calculator/ksdkwjxmdx

    let r = to.orbit.radius
    let x1 = this.position.x
    let y1 = this.position.y
    let s1Sqr = shipSpeed * shipSpeed

    // The first part of the equation
    let frst = (r * r) + (x1 * x1) + (y1 * y1)

    let time = 0
    let iterations = 0

    while (iterations < 1000) {
      iterations++
      let pos = to.calcPosition(time)

      let d = Math.sqrt((frst - 2 * (x1 * pos.x + y1 * pos.y)) / s1Sqr)

      let diff = d - time

      // The smaller the right side of the < is, the more accurate, but also the more prone to errors
      if (diff < 0.5) {
        return time
      } else if (diff < 2) {
        time += 0.1
      } else if (diff < 4) {
        time += 0.5
      } else {
        time += 1
      }
    }

    return time
  }

  updatePosition () {
    let pos = this.calcPosition()
    this.position.set(pos.x, pos.y)
  }

  calcPosition (additionalAge) {
    if (!additionalAge) { additionalAge = 0 }

    if (!this.orbit) {
      return {
        x: 0,
        y: 0
      }
    }

    let radius = this.orbit.radius
    let age = this.age + additionalAge
    let x = Math.cos(age * this.speed) * radius
    let y = Math.sin(age * this.speed) * radius
    return {
      x: x,
      y: y
    }
  }

  isMyPlanet () {
    // Client-side only
    return exists(this.team) ? this.team.id === game.myTeam.id : false
  }

  isTeamsPlanet (team) {
    return this.team.id === team.id
  }

  setTeam (team) {
    this.team = team

    if (IS_SERVER) {
      // Creates the planet on the client-side
      /* Will we need this???
      let pack = {
        type: Pack.SET_PLANET_TEAM,
        planet: this.id,
        team: team.id
      }
      this.system.game.sendPlayers(pack)
      */
    } else {
      let colour = exists(team) ? team.colour : 0xFFFFFF
      this.tint = colour
      this.outline.tint = colour
      this.ghost.tint = colour
      this.ghost.outline.tint = colour
      this.drawLine.tint = colour
      for (let i in this.spawns) {
        this.spawns[i].tint = colour
      }
    }
  }

  // A client-side function for ease of use
  createShipsClick (n, cost) {
    let pack = {
      type: Pack.CREATE_SHIPS,
      pl: this.id, // planet
      n: n, // n
      c: cost // cost
    }
    socket.send(pack)
  }
  createShips (n, force, cost) {
    if (n <= 0) return
    force = exists(force) ? force : false
    if (IS_SERVER) {
      let good = false
      if (force) {
        good = true
      } else if (this.team.pixels >= cost && n > 0) {
        // Validate to make sure the client isn't lying about the packet
        if (n <= 10 && cost >= 10) {
          good = true
        } else if (n <= 100 && cost >= 90) {
          good = true
        } else if (n <= 1000 && cost >= 800) {
          good = true
        }
      }

      if (good) {
        this.shipCount += n
        if (!force) this.team.addPixels(-cost)
        this.system.game.sendPlayers({
          type: Pack.CREATE_SHIPS,
          pl: this.id,
          n: n,
          c: force ? 0 : cost
        })
      }
    } else {
      for (let i = 0; i < n; i++) {
        if (this.shipCount + i < MAX_DISPLAY_SHIPS) {
          let ship = new PIXI.Sprite(resources.ship.texture)

          // The position on the planet's surface to place the ship (the angle)
          // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
          let angle = Math.PI * 2 * Math.random()

          let distFromPlanet = 60

          // hypotenuse, opposite, adjacent
          let h = this.pixelRadius + distFromPlanet
          let o = h * Math.sin(angle)
          let a = h * Math.cos(angle)
          let x = a + this.pixelRadius
          let y = o + this.pixelRadius

          ship.tint = this.tint
          ship.pivot.set(ship.width * 0.5, ship.height * 0.5)
          ship.position.set(x, y)
          ship.rotation = angle + (Math.PI / 2)
          this.addChild(ship)
          this.ships.push(ship)
        }
      }
      // Must keep these after the above for loop ^ otherwise the incorrect number of whips will display due to the if statement
      this.shipCount += n
      this.team.shipCount += n
      if (!force) this.team.addPixels(-cost)
    }
  }

  removeShips (n) {
    if (!IS_SERVER) {
      let visualsToRemove = Math.min(n, Math.max(0, MAX_DISPLAY_SHIPS - this.shipCount + n))

      if (visualsToRemove > 0) {
        // Removes the ships from the world
        for (let i = 0; i < visualsToRemove && i < this.ships.length; i++) {
          this.removeChild(this.ships[i])
        }

        // Removes the ships from the array
        this.ships.splice(0, visualsToRemove)
      }
    }
    this.shipCount = this.shipCount - n
    this.team.shipCount -= n
  }

  // A client-side function for ease of use
  sendShipsToClick (toPlanet, amount) {
    socket.send({
      type: Pack.SEND_SHIPS,
      pl: this.id,
      to: toPlanet.id,
      amount: amount
    })
  }

  sendShipsTo (toPlanet, amount) {
    if (IS_SERVER && exists(toPlanet)) {
      amount = Math.min(Math.max(amount, 0), this.shipCount)
      this.removeShips(amount)

      let duration = this.timeToFastestIntersect(toPlanet)
      let pos = toPlanet.calcPosition(duration)

      let sys = this.game.system
      let ship = new Ship(sys, this.position.x, this.position.y, pos.x, pos.y, shipSpeed, amount, this.tint, toPlanet, duration)
      sys.sendingShips.push(ship)

      this.system.game.sendPlayers({
        type: Pack.SEND_SHIPS,
        pl: this.id,
        to: toPlanet.id,
        amount: amount,
        x1: this.position.x,
        y1: this.position.y,
        x2: pos.x,
        y2: pos.y,
        shipSpeed: shipSpeed,
        duration: duration
      })
    }
  }

  spawnCount () {
    return IS_SERVER ? this.spawns : this.spawns.length
  }

  // A client-side function for ease of use
  createSpawnClick () {
    socket.send({
      type: Pack.CREATE_SPAWN,
      pl: this.id // planet
    })
  }

  createSpawn (force, loading) {
    let good = false
    let nextSpawn = true // TODO
    if (!IS_SERVER) {
      if (this.team && !force) {
        this.team.addPixels(-200)
      }
      let spawn = new PIXI.Sprite(resources.spawn.texture)

      // The position on this planet's surface to place the spawn (the angle)
      // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
      let angle = Math.PI * 6 * this.spawnCount() / 10

      let distFromPlanet = -8

      // hypotenuse, opposite, adjacent
      let h = this.pixelRadius + distFromPlanet
      let o = h * Math.sin(angle)
      let a = h * Math.cos(angle)
      let x = a + this.pixelRadius
      let y = o + this.pixelRadius

      spawn.tint = this.tint
      spawn.pivot.set(spawn.width * 0.5, spawn.height)
      spawn.scale.set(1.3)
      spawn.position.set(x, y)
      spawn.rotation = angle + (Math.PI / 2)
      this.addChild(spawn)
      this.spawns.push(spawn)

      // this.updateInfantry()
      good = true
    } else {
      if (force) {
        good = true
      } else if (this.team.pixels >= 200 && this.spawnCount() < MAX_SPAWNS) {
        good = true
        this.team.addPixels(-200)
      }

      if (good) {
        // Only don't send the packet if this method is being called from Planet.load()
        if (!exists(loading) || !loading) {
          let pack = {
            type: Pack.CREATE_SPAWN,
            planet: this.id,
            force: force
          }
          this.system.game.sendPlayers(pack)
        }
        this.spawns++
      }
    }

    // Updates the pixel spawn rate
    if (good) {
      this.pixelRate = MAX_PIXEL_RATE * Math.log(this.spawnCount() + 1) / SPAWN_LN

      if (!IS_SERVER) {
        this.infantry.maxParticles = this.pixelRate
        if (this.pixelRate > 0) {
          this.infantry.frequency = 1 / this.pixelRate
          this.infantry.emit = true
        } else {
          this.infantry.emit = false
        }
      }
    }
  }

  /* We don't neccessarily need this at all
  // Removes the spawns from this planet
  removeSpawn(n) {
    let removeTo = this.spawnCount() - n

    if (removeTo >= 0) {
      if (IS_SERVER) {
        this.spawns = removeTo
      } else {
        for (let i = this.spawns.length - 1; i >= removeTo && i >= 0; i--) {
          this.removeChild(this.spawns[i])
        }

        // Removes the spawns from the array
        this.spawns.splice(removeTo, n)
        updatePurchaseHud()
      }

      this.updateInfantry()
    }
  } */

  save (literal) {
    if (!exists(literal)) literal = true

    let pla = {
      radius: this.radius,
      rotationConstant: this.rotationConstant,
      startAngle: this.startAngle,
      opm: this.opm
    }
    if (literal) {
      pla.id = this.id
      pla.team = this.team ? this.team.id : -1
      pla.shipCount = this.shipCount
      pla.spawnCount = this.spawnCount()
      pla.pixelCounter = this.pixelCounter
      pla.age = this.age
    }
    return pla
  }

  static load (json, game, system) {
    let pla = new Planet(json.radius, json.rotationConstant, json.startAngle, json.opm, system)
    if (exists(json.id)) pla.id = json.id
    if (exists(json.team)) pla.setTeam(game.getTeam(json.team))
    if (exists(json.shipCount)) pla.createShips(json.shipCount, true)
    if (exists(json.spawnCount)) {
      for (let i = 0; i < json.spawnCount; i++) { pla.createSpawn(true, true) }
    }
    if (exists(json.pixelCounter)) pla.pixelCounter = json.pixelCounter
    if (exists(json.age)) pla.age = json.age

    pla.updatePosition()

    return pla
  }
}

if (IS_SERVER) {
  module.exports = Planet
}
