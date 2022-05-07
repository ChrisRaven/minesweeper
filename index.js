let playfield = []
let params = { x: 10, y: 10, mines: 10 }
let gameEnded = false
let numberOfFlags = 0


// shortcut for cases, when both x and y are from the same object
function getField({ x, y }) {
  return playfield[x][y]
}


function startGame() {
  gameEnded = false
  numberOfFlags = 0
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
      return { x: 8, y: 8, mines: 10 }
    case 'advanced':
      return { x: 16, y: 16, mines: 40 }
    case 'expert':
      return { x: 30, y: 16, mines: 99 }
    case 'custom':
      return { x: get('x-size'), y: get('y-size'), mines: get('no-of-mines')}
    default:
      return { x: 8, y: 8, mines: 10 }
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

    if (playfield[px][py].content === 'mine') continue

    playfield[px][py].content = 'mine'
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
      playfield[i][j].state = 'hidden'
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


function handleLeftClickOnTile(event) {
  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    switch (getField(coords).content) {
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
      if (el.state === 'flagged' && el.content === 'mine') {
        correctlyMarkedMines++
      }
    }
  }

  return correctlyMarkedMines === params.mines
}

function handleRightClickOnTile(event) {
  event.preventDefault()

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    let field = getField(coords)
    if (field.state === 'hidden') {
      clicked.innerHTML = '&#x1F6A9;'
      field.state = 'flagged'
      numberOfFlags++
    }
    else if (field.state === 'flagged') {
      clicked.innerHTML = ''
      field.state = 'hidden'
      numberOfFlags--
    }

    if (numberOfFlags === params.mines) {
      if (checkIfWon()) {
        winGame()
      }
    }
  }
}


function uncoverTile({ x, y }) {
  document.getElementById(x + '-' + y).textContent = playfield[x][y].content
  playfield[x][y].state = 'visible'
}

function uncoverNeighbours({ x, y }) {
  uncoverTile({ x, y })
  let neighbours = getNeighboursCoords(x, y, true)
  for (let neighbour of Object.values(neighbours)) {
    if (neighbour === null) continue

    let field = getField(neighbour);
    if (field.state === 'hidden') {
      if (field.content === 0) {
        uncoverNeighbours(neighbour)
      }
      else if (field.content !== 'mine' && field.state !== 'flagged') {
        uncoverTile(neighbour)
      }
    }
  }
}

function loseGame({ x, y }) {
  console.log('loser')
  showPlayfield()
  gameEnded = true
}

function winGame() {
  console.log('winner')
  showPlayfield()
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
// TODO: add win/lose icon
// TODO: add status (time, number of mines, number of flags, etc.)
// TODO: colour the numbers
// TODO: add different background for opened cells and blank tiles instead of "0"
