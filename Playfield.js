import { settings, DIRECTION } from './index.js'


const ICON = {
  FLAG: '🚩',
  MINE: '💣',
  INCORRECT_FLAG: '❌'
}

export const STATE = {
  HIDDEN: 0,
  VISIBLE: 1,
  FLAGGED: 2
}

export default class Playfield {

  constructor () {
    this.playfield = []
    this.DOMNode = document.getElementById('playfield')
  }


  generate() {  
    let x = settings.x
    let y = settings.y
    const tiles = []

    this.playfield = Array(y).fill(null).map(() => Array(x))

    for (let i = 0; i < y; i++) {
      for (let j = 0; j < x; j++) {
        this.playfield[i][j] = { content: null, state: null }
        tiles.push(`<div class="tile" id="${j}-${i}"> </div>`)
      }
      tiles.push('<br />')
    }

    // to remove previous event listeners from tiles
    this.DOMNode.replaceWith(this.DOMNode.cloneNode(true))
    this.DOMNode = document.getElementById('playfield')

    this.DOMNode.innerHTML = tiles.join('')
  }


  getField(arg1, arg2) {
    let x, y

    if (typeof arg1 === 'object') {
      x = arg1.x
      y = arg1.y
    }
    else {
      x = arg1
      y = arg2
    }
    return this.playfield[y][x]
  }


  #generateMines() {
    let x = settings.x
    let y = settings.y
    let mines = settings.mines
    const size = x * y

    while (mines) {
      let position = Math.floor(Math.random() * size)
      let px = Math.floor(position / y)
      let py = position % y

      let field = this.getField(px, py)
      field.state = STATE.HIDDEN

      if (field.content === 'mine') continue

      field.content = 'mine'
      mines--
      
    }
  }


  #clear() {
    for (let i = 0; i < settings.y; i++) {
      for (let j = 0; j < settings.x; j++) {
        this.playfield[i][j] = { content: null, state: null }
      }
    }
  }


  placeMines(clickCoords) {
    return new Promise(resolve => {
      let mouseX = parseInt(clickCoords[0], 10)
      let mouseY = parseInt(clickCoords[1], 10)

      this.#generateMines()
      while (this.getField(mouseX, mouseY).content === 'mine') {
        this.#clear()
        this.#generateMines()
      }

      resolve('resolved')
    })
    
  }


  getNeighboursCoords(x, y, diagonals =  true) {
    let maxX = settings.x
    let maxY = settings.y
    x = parseInt(x, 10)
    y = parseInt(y, 10)
    
    /*
    p = plus
    m = minus

    xm1my xmy xp1my
    xm1    x    xp1
    xm1py xpy xp1py
    */

    let result = {
      xm1:   x > 0        ? { x: x - 1, y: y     } : null,
      xp1:   x < maxX - 1 ? { x: x + 1, y: y     } : null,
      xmy:   y > 0        ? { x: x    , y: y - 1 } : null,
      xpy:   y < maxY - 1 ? { x: x    , y: y + 1 } : null
    }

    if (diagonals) {
      result = Object.assign(result, {
        xm1my: x > 0        && y > 0        ? { x: x - 1, y: y - 1 } : null,
        xm1py: x > 0        && y < maxY - 1 ? { x: x - 1, y: y + 1 } : null,
        xp1my: x < maxX - 1 && y > 0        ? { x: x + 1, y: y - 1 } : null,
        xp1py: x < maxX - 1 && y < maxY - 1 ? { x: x + 1, y: y + 1 } : null
      })
    }

    return result
  }


  calculateNeighbours() {
    return new Promise(resolve => {
      let x = settings.x
      let y = settings.y

      for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
          let field = this.getField(i, j)

          field.state = STATE.HIDDEN
          if (field.content === 'mine') continue

          let neighbours = this.getNeighboursCoords(i, j)
          let counter = 0

          for (let coords of Object.values(neighbours)) {
            if (coords === null) continue

            let el = this.getField(coords)
            if (el.content === 'mine') {
              counter++
            }
          }

          field.content = counter
        }
      }

      resolve('resolved');
    })
  }


  flag(element) {
    const coords = element.id.split('-').map(el => parseInt(el, 10))
    let field = this.getField(coords[0], coords[1])

    if (field.state === STATE.HIDDEN) {
      element.textContent = ICON.FLAG
      element.classList.add('flag')
      field.state = STATE.FLAGGED
      return DIRECTION.ADD
    }
    
    if (field.state === STATE.FLAGGED) {
      element.textContent = ''
      element.classList.remove('flag')
      field.state = STATE.HIDDEN
      return DIRECTION.SUBTRACT
    }
  }


  getColorClass(content) {
    switch (content) {
      case 0: return ''
      case 1: return 'one'
      case 2: return 'two'
      case 3: return 'three'
      case 4: return 'four'
      case 5: return 'five'
      case 6: return 'six'
      case 7: return 'seven'
      case 8: return 'eight'
      case 'mine': return ''
    }
  }


  uncoverTile({ x, y }) {
    let field = this.getField(x, y)
    field.state = STATE.VISIBLE

    let value = field.content === 0 ? '' : field.content
    
    let element = document.getElementById(x + '-' + y)
    element.textContent = value
    let color = this.getColorClass(value)
    color && element.classList.add(color)
    element.classList.add('opened-tile')
  }


  uncoverNeighbours({ x, y }) {
    this.uncoverTile({ x, y })
    const uncoverDiagonals = this.getField(x, y).content === 0
    let neighbours = this.getNeighboursCoords(x, y, uncoverDiagonals)

    for (let neighbour of Object.values(neighbours)) {
      if (neighbour === null) continue

      let field = this.getField(neighbour)
      if (field.state === STATE.HIDDEN) {
        if (field.content === 0) {
          this.uncoverNeighbours(neighbour)
        }
        else if (field.content !== 'mine' && field.state !== STATE.FLAGGED) {
          this.uncoverTile(neighbour)
        }
      }
    }
  }


  uncoverAll() {
    let x = settings.x
    let y = settings.y

    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        let tile = this.getField(i, j)
        let text = tile.content

        if (tile.content === 'mine' && tile.state === STATE.FLAGGED) {
          text = ICON.FLAG
        }
        if (tile.content === 'mine' && tile.state !== STATE.FLAGGED) {
          text = ICON.MINE
        }
        else if (tile.content !== 'mine' && tile.state === STATE.FLAGGED) {
          text = ICON.INCORRECT_FLAG
        }
        else if (tile.content === 0) {
          text = ''
        }

        const el = document.getElementById(i + '-' + j)
        el.textContent = text
        el.classList.add('opened-tile')
        let color = this.getColorClass(text)
        color && el.classList.add(color)
        if (tile.state === STATE.FLAGGED || tile.content === 'mine') {
          el.classList.add('mine')
        }

      }
    }
  }


  checkField(element) {
    let coords = {}; // don't touch the semicolon
    [coords.x, coords.y] = element.id.split('-').map(el => parseInt(el, 10))
    let field = this.getField(coords)

    let result = null
    if (field.state === STATE.FLAGGED) {
      result = 'flagged'
    }

    switch (field.content) {
      case 'mine':
        result = 'lost'
        break
      case 0:
        this.uncoverNeighbours(coords)
        break
      default:
        this.uncoverTile(coords)
        break
    }

    if (this.checkIfWon()) {
      result = 'won'
    }
    
    return result
  }


  highlightNeighbours(coords) {
    let x = coords[0]
    let y = coords[1]
    let neighbours = Object.values(this.getNeighboursCoords(x, y, true))
    neighbours.forEach(n => {
      if (!n) return
      if (this.getField(n).state === STATE.VISIBLE) return

      let el = document.getElementById(n.x + '-' + n.y)
      el.classList.add('opened-tile')
    })
  }

  unhighlightNeighbours(coords) {
    let x = coords[0]
    let y = coords[1]
    let neighbours = Object.values(this.getNeighboursCoords(x, y, true))
    neighbours.forEach(n => {
      if (!n) return
      if (this.getField(n).state === STATE.VISIBLE) return

      let el = document.getElementById(n.x + '-' + n.y)
      el.classList.remove('opened-tile')
    })
  }


  uncoverNeighboursIfClear(coords) {
    let x = coords[0]
    let y = coords[1]

    if (this.getField(x, y).state !== STATE.VISIBLE) return
    
    let neighbours = Object.values(this.getNeighboursCoords(x, y, true))

    neighbours.forEach(n => {
      if (n === null) return
      let el = this.getField(n)
      if (el.state !== STATE.FLAGGED) {
        document.getElementById(n.x + '-' + n.y).click()
      }
    })
  }


  checkIfWon() {
    const size = settings.x * settings.y
    let uncoveredOrFlaggedFields = 0

    for (let i = 0; i < settings.x; i++) {
      for (let j = 0; j < settings.y; j++) {
        let el = this.getField(i, j)

        if (el.state === STATE.HIDDEN || el.state === STATE.FLAGGED) {
          uncoveredOrFlaggedFields++
        }
      }
    }

    const onlyFieldsWithMinesLeft = uncoveredOrFlaggedFields === settings.mines
    return  onlyFieldsWithMinesLeft
  }

}