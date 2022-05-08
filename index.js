import Time from './Time.js'
import Settings from './Settings.js'
import Playfield, { STATE } from './Playfield.js'


let gameEnded = false
let numberOfFlagsPlaced = 0


export let settings = new Settings()
let time = new Time()
let playfield = new Playfield()


export const DIRECTION = {
  ADD: 0,
  SUBTRACT: 1
}

const ICON = {
  WON_FACE: '\u{1F600}',
  LOST_FACE: '\u{1F61E}'
}

function updateNumberOfFlags(direction) {
  if (direction) {
    numberOfFlagsPlaced = direction === DIRECTION.ADD ? numberOfFlagsPlaced + 1 : numberOfFlagsPlaced - 1
  } // else effectively set '#number-of-flags' to settings.mines
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
  addEvents() // to reattach event after each clearing of the playfield
}


function handleLeftClickOnTile(event) {
  if (gameEnded) return

  time.startTimer()

  const clicked = event.target
  if (clicked.classList.contains('tile')) {

    let status = playfield.checkField(clicked)

    if (status === 'flagged') {
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    if (status === 'lost') {
      updateNumberOfFlags(DIRECTION.SUBTRACT)
      let coords = clicked.id.split('-').map(coord => parseInt(coord, 10))
      lostGame({x: coords[0], y: coords[1]})
    }

    if (status === 'won') {
      wonGame()
    }
  }
}


function handleRightClickOnTile(event) {
  event.preventDefault()
  time.startTimer()

  if (gameEnded) return

  const clicked = event.target
  if (clicked.classList.contains('tile')) {
    updateNumberOfFlags(playfield.flag(clicked))
  }

  if (playfield.checkIfWon()) {
    wonGame()
  }
}


function lostGame({ x, y }) {
  console.log('loser')
  document.getElementById('result-icon').textContent = ICON.LOST_FACE
  document.getElementById(x + '-' + y).classList.add('exploded-tile')
  playfield.uncoverAll()
  time.stopTimer()
  gameEnded = true
}


function wonGame() {
  document.getElementById('result-icon').textContent = ICON.WON_FACE
  console.log('winner')
  playfield.uncoverAll()
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
  settings.getSettings()
  addEvents()
  startGame()
})()


// TODO: styling
// TODO: first element should be always safe
// TODO: add chording (two buttons pressed at the same time) to open all unflagged and unopened neighbours
// TODO: make custom fields disabled, when something else is selected in the settings
