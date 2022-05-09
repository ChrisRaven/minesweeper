import Time from './Time.js'
import Settings from './Settings.js'
import Playfield, { STATE } from './Playfield.js'


let gameEnded = false
let firstClick = true
let numberOfFlagsPlaced = 0
let twoButtonsPressed = false
let doublePressedTile = null


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
  if (direction !== undefined) {
    numberOfFlagsPlaced = direction === DIRECTION.ADD ? numberOfFlagsPlaced + 1 : numberOfFlagsPlaced - 1
  } // else effectively set '#number-of-flags' to settings.mines
  document.getElementById('number-of-flags').textContent = settings.mines - numberOfFlagsPlaced
}


export function startGame() {
  gameEnded = false
  firstClick = true
  numberOfFlagsPlaced = 0
  time.resetTimer()
  updateNumberOfFlags()
  playfield.generate()
  addEvents() // to reattach event after each clearing of the playfield
}


function markTile(clicked) {
  if (clicked.classList.contains('tile')) {

    let status = playfield.checkField(clicked)

    if (status === 'flagged') {
      updateNumberOfFlags(DIRECTION.SUBTRACT)
    }

    if (status === 'lost') {
      let coords = clicked.id.split('-').map(coord => parseInt(coord, 10))
      lostGame({ x: coords[0], y: coords[1] })
    }

    if (status === 'won') {
      wonGame()
    }
  }
}


async function handleLeftClickOnTile(event) {
  if (gameEnded) return
  if (!event.target.classList.contains('tile')) return

  time.startTimer()
  const clicked = event.target

  if (firstClick) {
    firstClick = false
    await playfield.placeMines(event.target.id.split('-'))
    await playfield.calculateNeighbours()
    markTile(clicked)
  }
  else {
    markTile(clicked)
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
    if (confirm('Do you want to restart the unfinished game?')) {
      startGame()
    }
  }
  else {
    startGame()
  }
}


function handleMouseDown(event) {
  if (!event.target.classList.contains('tile')) return

  if (event.buttons === 3) {
    twoButtonsPressed = true
    let coords = event.target.id.split('-')
    doublePressedTile = coords
    playfield.highlightNeighbours(coords)
  }
}


function handleMouseUp(event) {
  if (twoButtonsPressed) {
    playfield.unhighlightNeighbours(event.target.id.split('-'))
  }
  if (!event.target.classList.contains('tile')) return

  if (twoButtonsPressed) {
    twoButtonsPressed = false
    doublePressedTile = null
    playfield.uncoverNeighboursIfClear(event.target.id.split('-'))
  }

}

function handleMouseMove(event) {
  if (!twoButtonsPressed) return

  if (!event.target.classList.contains('tile')) {
    twoButtonsPressed = false
    playfield.unhighlightNeighbours(doublePressedTile)
    doublePressedTile = null
    return
  }

  let coords = event.target.id.split('-')
  if (coords[0] !== doublePressedTile[0] || coords[1] !== doublePressedTile[1] ) {
    playfield.unhighlightNeighbours(doublePressedTile)
    doublePressedTile = coords
    playfield.highlightNeighbours(doublePressedTile)
  }
}


function addEvents() {
  playfield.DOMNode.addEventListener('mousedown', handleMouseDown.bind(event))
  playfield.DOMNode.addEventListener('mouseup', handleMouseUp.bind(event))
  playfield.DOMNode.addEventListener('click', handleLeftClickOnTile.bind(event))
  playfield.DOMNode.addEventListener('contextmenu', handleRightClickOnTile.bind(event))
  playfield.DOMNode.addEventListener('mousemove', handleMouseMove.bind(event))

}

(() => {
  document.getElementById('restart-button').addEventListener('click', handleRestartButton)
  settings.getSettings()
  addEvents()
  startGame()
})()


// TODO: styling
// TODO: fix face-icon after winning/loosing previous game
// TODO: find emoji for incorrectly placed flags
// TODO: show a slightly smiling emoji through entire game, maybe changing it, when a left button is pressed
// TODO: change input types to number for custom size
// TODO: status bar isn't visible when the  field is larger than the view window
// TODO: check limits of input[type="number"] via JS
