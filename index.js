let playfield = []
let params = { x: 10, y: 10, mines: 10 }
let gameEnded = false
let numberOfFlagsPlaced = 0
let timerStarted = false
let startTime = 0
let timer = null

const DIRECTION = {
  ADD: 0,
  SUBTRACT: 1
}

const STATE = {
  HIDDEN: 0,
  VISIBLE: 1,
  FLAGGED: 2
}

// shortcut for cases, when both x and y are from the same object
function getField({ x, y }) {
  return playfield[x][y]
}

function convertTimeToMinutesAndSeconds(time) {
  let minutes = Math.floor(time / 60)
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  let seconds = Math.floor(time % 60)
  if (seconds < 10) {
    seconds = '0' + seconds
  }

  return { minutes, seconds }
}

function startTimer() {
  timerStarted = true
  startTime = Date.now()
  let timeDisplay = document.getElementById('time')
  timer = setInterval(() => {
    let currentTime = (Date.now() - startTime) / 1000
    currentTime = convertTimeToMinutesAndSeconds(currentTime)
    timeDisplay.textContent = currentTime.minutes + ':' + currentTime.seconds
  }, 100)
}


function stopTimer() {
  timerStarted = false
  clearInterval(timer)
}



function updateNumberOfFlags(direction) {
  if (direction) {
    numberOfFlagsPlaced = direction === DIRECTION.ADD ? numberOfFlagsPlaced +1 : numberOfFlagsPlaced - 1
  }
  document.getElementById('number-of-flags').textContent = params.mines - numberOfFlagsPlaced
}


function startGame() {
  gameEnded = false
  numberOfFlagsPlaced = 0
  timerStarted = false
  document.getElementById('time').textContent = '00:00'
  updateNumberOfFlags()
  generatePlayfield()
  placeMines()
  calculateNeighbours()
}


function getSettings() {
  settings = JSON.parse(localStorage.getItem('settings') || '""')
  if (settings) {
    params = settings
  }
}


function saveSettings() {
  params = getParameters()
  localStorage.setItem('settings', JSON.stringify(params))
  startGame()
}


function getParameters() {
  let selected = document.querySelector('input[name="sizeSelector"]:checked').value

  function get(name) {
    return parseInt(document.querySelector(`input[name=${name}]`).value,10)
  }

  switch(selected) {
    case 'beginner':
      return { x: 9, y: 9, mines: 10 }
    case 'advanced':
      return { x: 16, y: 16, mines: 40 }
    case 'expert':
      return { x: 16, y: 30, mines: 99 }
    case 'custom':
      return { x: get('x-size'), y: get('y-size'), mines: get('no-of-mines')}
    default:
      return { x: 9, y: 9, mines: 10 }
  }
}


function generatePlayfield() {  
  let x = params.x
  let y = params.y
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
  let x = params.x
  let y = params.y
  let mines = params.mines
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
  let maxX = params.x
  let maxY = params.y
  
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
  let x = params.x
  let y = params.y

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

  if (!timerStarted) {
    startTimer()
  }

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

  for (let i = 0; i < params.x; i++) {
    for (let j = 0; j < params.y; j++) {
      let el = playfield[i][j]
      if (el.state === STATE.FLAGGED && el.content === 'mine') {
        correctlyMarkedMines++
      }
    }
  }

  return correctlyMarkedMines === params.mines
}

function handleRightClickOnTile(event) {
  event.preventDefault()

  if (!timerStarted) {
    startTimer()
  }

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    let field = getField(coords)
    if (field.state === STATE.HIDDEN) {
      clicked.innerHTML = '&#x1F6A9;'
      field.state = STATE.FLAGGED
      updateNumberOfFlags(DIRECTION.ADD)
    }
    else if (field.state === STATE.FLAGGED) {
      clicked.innerHTML = ''
      field.state = STATE.HIDDEN
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    if (numberOfFlagsPlaced === params.mines) {
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
  document.getElementById('result-icon').textContent = '\u{1F61E}';
  document.getElementById(x + '-' + y).classList.add('exploded-tile')
  showPlayfield()
  stopTimer()
  gameEnded = true
}

function winGame() {
  document.getElementById('result-icon').textContent = '\u{1F600}';
  console.log('winner')
  showPlayfield()
  stopTimer()
  gameEnded = true
}


function showPlayfield() {
  let x = params.x
  let y = params.y

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      let text = playfield[i][j].content === 'mine' ? '\u{1F4A3}' : playfield[i][j].content
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
  document.getElementById('confirm-parameters').addEventListener('click', saveSettings)
  document.getElementById('restart-button').addEventListener('click', handleRestartButton)
  getSettings()
  startGame()
})()


// TODO: styling
// TODO: first element should be always safe
// TODO: add chording (two buttons pressed at the same time) to open all unflagged and unopened neighbours
// TODO: change showPlayfield() for when a user wins the game to not show bombs instead of flags
// TODO: add win condition, when only the fields with mines are unopened (some might be flagged, some not)
// TODO: add win condition, when last field is opened manually
// TODO: uncover all 8 neighbours of an empty field, while checking only 4 adjacent ones
// TODO: mark exploded mine with red background
// TODO: fix showPlayfield() to show blank tiles instead of zeroes