import Time from './Time.js'
import Settings from './Settings.js'


let playfield = []
let gameEnded = false
let numberOfFlagsPlaced = 0


let time = new Time()
let settings = new Settings()


const DIRECTION = {
  ADD: 0,
  SUBTRACT: 1
}

const STATE = {
  HIDDEN: 0,
  VISIBLE: 1,
  FLAGGED: 2
}


const ICON = {
  WON_FACE: '\u{1F600}',
  LOST_FACE: '\u{1F61E}',
  FLAG: '\u{1F6A9}',
  MINE: '\u{1F4A3}'
}


// shortcut for cases, when both x and y are from the same object
function getField({ x, y }) {
  return playfield[x][y]
}


function updateNumberOfFlags(direction) {
  if (direction) {
    numberOfFlagsPlaced = direction === DIRECTION.ADD ? numberOfFlagsPlaced +1 : numberOfFlagsPlaced - 1
  }
  document.getElementById('number-of-flags').textContent = settings.mines - numberOfFlagsPlaced
}


function startGame() {
  gameEnded = false
  numberOfFlagsPlaced = 0
  time.resetTimer()
  updateNumberOfFlags()
  generatePlayfield()
  placeMines()
  calculateNeighbours()
}


function generatePlayfield() {  
  let x = settings.x
  let y = settings.y
  let playfieldElement = document.getElementById('playfield')
  const tiles = []

  playfield = Array(x).fill(null).map(() => Array(y))

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      playfield[i][j] = { content: null, state: null }
      tiles.push(`<div class="tile" id="${i}-${j}"> </div>`)
    }
    tiles.push('<br />')
  }

  // to remove previous event listeners
  playfieldElement.replaceWith(playfieldElement.cloneNode(true))
  playfieldElement = document.getElementById('playfield')

  playfieldElement.innerHTML = tiles.join('')
  playfieldElement.addEventListener('click', handleLeftClickOnTile.bind(event))
  playfieldElement.addEventListener('contextmenu', handleRightClickOnTile.bind(event))
}


function placeMines() {
  let x = settings.x
  let y = settings.y
  let mines = settings.mines
  const size = x * y
  
  while (mines) {
    let position = Math.floor(Math.random() * size)
    let px = Math.floor(position / y);
    let py = position % y

    let field = getField({ x: px, y: py })
    field.state = STATE.HIDDEN

    if (field.content === 'mine') continue

    field.content = 'mine'
    mines--
  }
}

function getNeighboursCoords(x, y, adjacentOnly =  false) {
  let maxX = settings.x
  let maxY = settings.y
  
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

  if (!adjacentOnly) {
    result = Object.assign(result, {
      xm1my: x > 0        && y > 0        ? { x: x - 1, y: y - 1 } : null,
      xm1py: x > 0        && y < maxY - 1 ? { x: x - 1, y: y + 1 } : null,
      xp1my: x < maxX - 1 && y > 0        ? { x: x + 1, y: y - 1 } : null,
      xp1py: x < maxX - 1 && y < maxY - 1 ? { x: x + 1, y: y + 1 } : null
    })
  }

  return result
}


function calculateNeighbours() {
  let x = settings.x
  let y = settings.y

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      playfield[i][j].state = STATE.HIDDEN
      if (playfield[i][j].content === 'mine') continue

      let neighbours = getNeighboursCoords(i, j)
      let counter = 0

      for (let coords of Object.values(neighbours)) {
        if (coords === null) continue

        let el = getField(coords);
        if (el.content === 'mine') {
          counter++
        }
      }

      playfield[i][j].content = counter
    }
  }
}

function getColorClass(content) {
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


function handleLeftClickOnTile(event) {
  if (gameEnded) return

  time.startTimer()

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))
    let field = getField(coords)

    if (field.state === STATE.FLAGGED) {
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    switch (field.content) {
      case 'mine':
        return loseGame(coords)
      case 0:
        return uncoverNeighbours(coords)
      default:
        return uncoverTile(coords)
    }
  }
}

function checkIfWon() {
  let correctlyMarkedMines = 0

  for (let i = 0; i < settings.x; i++) {
    for (let j = 0; j < settings.y; j++) {
      let el = playfield[i][j]
      if (el.state === STATE.FLAGGED && el.content === 'mine') {
        correctlyMarkedMines++
      }
    }
  }

  return correctlyMarkedMines === settings.mines
}

function handleRightClickOnTile(event) {
  event.preventDefault()
  time.startTimer()

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    let field = getField(coords)
    if (field.state === STATE.HIDDEN) {
      clicked.textContent = ICON.FLAG
      field.state = STATE.FLAGGED
      updateNumberOfFlags(DIRECTION.ADD)
    }
    else if (field.state === STATE.FLAGGED) {
      clicked.textContent = ''
      field.state = STATE.HIDDEN
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    if (numberOfFlagsPlaced === settings.mines) {
      if (checkIfWon()) {
        winGame()
      }
    }
  }
}


function uncoverTile({ x, y }) {
  let element = document.getElementById(x + '-' + y)
  let value = playfield[x][y].content
  if (value === 0) {
    value = ''
  }
  element.textContent = value
  element.classList.add(getColorClass(value) || null)
  playfield[x][y].state = STATE.VISIBLE
  element.classList.add('opened-tile')
}


function uncoverNeighbours({ x, y }) {
  uncoverTile({ x, y })
  let neighbours = getNeighboursCoords(x, y, true)
  for (let neighbour of Object.values(neighbours)) {
    if (neighbour === null) continue

    let field = getField(neighbour);
    if (field.state === STATE.HIDDEN) {
      if (field.content === 0) {
        uncoverNeighbours(neighbour)
      }
      else if (field.content !== 'mine' && field.state !== STATE.FLAGGED) {
        uncoverTile(neighbour)
      }
    }
  }
}

function loseGame({ x, y }) {
  console.log('loser')
  document.getElementById('result-icon').textContent = ICON.LOST_FACE;
  document.getElementById(x + '-' + y).classList.add('exploded-tile')
  showPlayfield()
  time.stopTimer()
  gameEnded = true
}

function winGame() {
  document.getElementById('result-icon').textContent = ICON.WON_FACE;
  console.log('winner')
  showPlayfield()
  time.stopTimer()
  gameEnded = true
}


function showPlayfield() {
  let x = settings.x
  let y = settings.y

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      let tile = playfield[i][j]
      let text = tile.content

      if (tile.content === 'mine' && tile.state === STATE.FLAGGED) {
        text = ICON.FLAG
      }
      if (tile.content === 'mine' && tile.state !== STATE.FLAGGED) {
        text = ICON.MINE
      }
      else if (tile.content !== 'mine' && tile.state === STATE.FLAGGED) {
        text = 'F'
      }
      else if (tile.content === 0) {
        text = ''
      }

      document.getElementById(i + '-' + j).textContent = text
    }
  }
}

function handleRestartButton() {
  if (!gameEnded) {
    if (confirm('Do you want to restart the unfinishe game?')) {
      startGame()
    }
  }
  else {
    startGame()
  }
}


(() => {
  document.getElementById('confirm-parameters').addEventListener('click', () => { settings.saveSettings(); startGame() })
  document.getElementById('restart-button').addEventListener('click', handleRestartButton)
  settings.getSettings()
  startGame()
})()


// TODO: styling
// TODO: first element should be always safe
// TODO: add chording (two buttons pressed at the same time) to open all unflagged and unopened neighbours
// TODO: add win condition, when only the fields with mines are unopened (some might be flagged, some not)
// TODO: add win condition, when last field is opened manually
// TODO: uncover all 8 neighbours of an empty field, while checking only 4 adjacent ones
// TODO: refactor
// TODO: when there was a flag an user left-clicked the field and there was a bomb, change the emoji to bomb