import Time from './Time.js'
import Settings from './Settings.js'
import Playfield, { STATE } from './Playfield.js'


let gameEnded = false
let numberOfFlagsPlaced = 0


let time = new Time()
export let settings = new Settings()
let playfield = new Playfield()


export const ICON = {
  WON_FACE: '\u{1F600}',
  LOST_FACE: '\u{1F61E}',
  FLAG: '\u{1F6A9}',
  MINE: '\u{1F4A3}'
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
  playfield.generate()
  playfield.placeMines()
  playfield.calculateNeighbours()
  addEvents()
}


function handleLeftClickOnTile(event) {
  if (gameEnded) return

  time.startTimer()

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))
    let field = playfield.getField(coords)

    if (field.state === STATE.FLAGGED) {
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    switch (field.content) {
      case 'mine':
        return loseGame(coords)
      case 0:
        return playfield.uncoverNeighbours(coords)
      default:
        return playfield.uncoverTile(coords)
    }
  }
}


function handleRightClickOnTile(event) {
  event.preventDefault()
  time.startTimer()

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    const coords = {};

    [coords.x, coords.y] = clicked.id.split('-').map(el => parseInt(el, 10))

    let field = playfield.getField(coords)
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


function loseGame({ x, y }) {
  console.log('loser')
  document.getElementById('result-icon').textContent = ICON.LOST_FACE;
  document.getElementById(x + '-' + y).classList.add('exploded-tile')
  playfield.uncover()
  time.stopTimer()
  gameEnded = true
}


function winGame() {
  document.getElementById('result-icon').textContent = ICON.WON_FACE;
  console.log('winner')
  playfield.uncover()
  time.stopTimer()
  gameEnded = true
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

function addEvents() {
  playfield.DOMNode.addEventListener('click', handleLeftClickOnTile.bind(event))
  playfield.DOMNode.addEventListener('contextmenu', handleRightClickOnTile.bind(event))
}

(() => {
  document.getElementById('confirm-parameters').addEventListener('click', () => { settings.saveSettings(); startGame() })
  document.getElementById('restart-button').addEventListener('click', handleRestartButton)
  addEvents()
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
