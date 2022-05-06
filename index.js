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
  const squares = []

  playfield = Array(x).fill(null).map(() => Array(y))

  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      playfield[i][j] = { content: null, state: null }
      squares.push(`<div class="square" id="${i}-${j}"> </div>`)
    }
    squares.push('<br />')
  }

  // to remove previous event listeners
  playfieldElement.replaceWith(playfieldElement.cloneNode(true))
  playfieldElement = document.getElementById('playfield')

  playfieldElement.innerHTML = squares.join('')
  playfieldElement.addEventListener('click', handleSquareLeftClick.bind(event))
  playfieldElement.addEventListener('contextmenu', handleSquareRightClick.bind(event))
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


function handleSquareLeftClick(event) {
  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('square')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    switch (getField(coords).content) {
      case 'mine':
        return endGame(coords)
      case 0:
        return uncoverPartOfTheField(coords)
      default:
        return uncoverSquare(coords)
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

function handleSquareRightClick(event) {
  event.preventDefault()

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('square')) {
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
        win()
      }
    }
  }
}


function uncoverSquare({ x, y }) {
  document.getElementById(x + '-' + y).textContent = playfield[x][y].content
  playfield[x][y].state = 'visible'
}

function uncoverPartOfTheField({ x, y }) {
  uncoverSquare({ x, y })
  let neighbours = getNeighboursCoords(x, y, true)
  for (let neighbour of Object.values(neighbours)) {
    if (neighbour === null) continue

    let field = getField(neighbour);
    if (field.state === 'hidden') {
      if (field.content === 0) {
        uncoverPartOfTheField(neighbour)
      }
      else if (field.content !== 'mine' && field.state !== 'flagged') {
        uncoverSquare(neighbour)
      }
    }
  }
}

function endGame({ x, y }) {
  console.log('looser')
  showPlayfield()
  gameEnded = true
}

function win() {
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


(() => {
  document.getElementById('confirm-parameters')?.addEventListener('click', saveSettings)
  getSettings()
  startGame()
})()
