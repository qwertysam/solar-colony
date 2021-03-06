class Orbit extends (IS_SERVER ? Object : PIXI.Graphics) {
  constructor (x, y, radius) {
    super()

    this.x = x
    this.y = y
    this.radius = radius
    this.planets = []

    if (!IS_SERVER) {
      let numOfDashes = Math.max(Math.floor(Math.PI * radius / DASH_LENGTH), MIN_DASHES)
      let dashRadians = DASH_LENGTH / radius
      let spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

      // If it's a full circle, draw it full (more optimised)
      if (spacingRadians <= 0) {
        this.lineStyle(DASH_THICKNESS, Colour.DASHED_LINE) // (thickness, color)
        this.arc(x, y, radius, 0, 2 * Math.PI)
      } else { // Else, draw it dashed
        for (let i = 0; i < numOfDashes; i++) {
          let start = i * (dashRadians + spacingRadians)
          let end1 = start + dashRadians
          let end2 = end1 + spacingRadians
          this.lineStyle(DASH_THICKNESS, Colour.DASHED_LINE) // (thickness, color)
          this.arc(x, y, radius, start, end1)
          this.lineStyle(DASH_THICKNESS, Colour.BACKGROUND, 0)
          this.arc(x, y, radius, end1, end2)
        }
      }

      // disgusting
      // this.cacheAsBitmap = true
    }
  }

  addPlanet (planet) {
    this.planets.push(planet)
    planet.game = this.game
    planet.system = this.system
    planet.orbit = this

    if (IS_SERVER) {
      planet.id = planet.game.createID()
      return planet
    } else {
      planet.system.addChild(planet)
    }
  }

  update (delta) {
    let first = true
    for (let i in this.planets) {
      this.planets[i].update(delta)

      if (first && !IS_SERVER) {
        // Rotate the orbits (purely for visual effects)
        // TODO make their rotation separate from the planet speeds
        this.rotation = -this.planets[i].age * this.planets[i].speed / 8
        first = false
      }
    }
  }

  getPlanet (x, y) {
    for (let i in this.planets) {
      let clickRadius = this.planets[i].radius + PLANET_SELECT_RADIUS
      if (distSqr(x, y, this.planets[i].x, this.planets[i].y) < clickRadius * clickRadius) {
        return this.planets[i]
      }
    }

    return null
  }

  getPlanetByID (id) {
    for (let i in this.planets) {
      if (this.planets[i].id === id) {
        return this.planets[i]
      }
    }
    return null
  }

  save (literal) {
    if (!exists(literal)) literal = true

    let orb = {
      x: this.x,
      y: this.y,
      radius: this.radius,
      planets: []
    }
    if (literal) orb.id = this.id

    for (let i in this.planets) {
      orb.planets.push(this.planets[i].save(literal))
    }

    return orb
  }

  static load (json, game, system) {
    let orb = new Orbit(json.x, json.y, json.radius)
    if (exists(json.id)) orb.id = json.id
    if (!exists(json.planets)) json.planets = []

    // TODO make orbits independant of the system, and
    // make planets independant of the game and system.
    // Then we can move this addOrbit call to the System.load
    // in the same fashion as the addPlanet call is in the
    // loop below
    system.addOrbit(orb)

    if (exists(json.teamOrbit)) {
      let teamorb = json.teamOrbit
      // builds the player planets
      // const teamCount = this.teams.length
      let teamIDs = []
      for (let i in game.teams) {
        for (let j in teamorb.teams) {
          // If the team is in the planet's list of eligible teams
          /* eslint-disable */
          if (i == teamorb.teams[j]) {
            /* eslint-enable */
            teamIDs.push(game.teams[i].id)
            break
          }
        }
      }

      // Creates all the team planets
      let teamCount = teamIDs.length
      const rotation = 2 * Math.PI / teamCount
      for (let i = 0; i < teamCount; i++) {
        // The starting state for the team planets
        json.planets.push({
          radius: teamorb.radius,
          rotationConstant: teamorb.rotationConstant,
          startAngle: rotation * i,
          opm: teamorb.opm,
          team: teamIDs[i],
          spawnCount: 1
        })
      }
    }

    for (let i in json.planets) { orb.addPlanet(Planet.load(json.planets[i], game, system)) }

    return orb
  }
}

if (IS_SERVER) {
  module.exports = Orbit
}
