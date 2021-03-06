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

const FACE = {
  WON: 'π',
  LOST: 'π',
  NORMAL: 'βΊοΈ',
  DANGER: 'π'
}


function setFace(value) {
  document.getElementById('face-icon').textContent = value
}


function updateNumberOfFlags(direction) {
  if (direction !== undefined) {
    numberOfFlagsPlaced = direction === DIRECTION.ADD ? numberOfFlagsPlaced + 1 : numberOfFlagsPlaced - 1
  } // else effectively set '#number-of-flags' to settings.mines
  document.getElementById('number-of-flags').textContent = settings.mines - numberOfFlagsPlaced
}


// for cases, where height of the playfield is bigger than the height of the viewport
function correctHeight() {
  let container = document.getElementById('main-container')
  let state = container.getBoundingClientRect()

  if (state.top < 0) {
    container.style.top = 0
    container.style.transform = 'translate(-50%, 0)'
  }
  else {
    container.style.top = '50%'
    container.style.transform = 'translate(-50%, -50%)'
  }
}


export function startGame() {
  gameEnded = false
  firstClick = true
  numberOfFlagsPlaced = 0
  time.resetTimer()
  updateNumberOfFlags()
  playfield.generate()
  correctHeight()
  addEvents() // to reattach event after each clearing of the playfield
  setFace(FACE.NORMAL)
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
  setFace(FACE.LOST)
  document.getElementById(x + '-' + y).classList.add('exploded-tile')
  playfield.uncoverAll()
  time.stopTimer()
  gameEnded = true
}


function wonGame() {
  console.log('winner')
  setFace(FACE.WON)
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

  if (event.buttons === 1 || event.buttons === 3) {
    setFace(FACE.DANGER)
  }

  if (event.buttons === 3) {
    twoButtonsPressed = true
    let coords = event.target.id.split('-')
    doublePressedTile = coords
    playfield.highlightNeighbours(coords)
  }
}


function handleMouseUp(event) {
  setFace(FACE.NORMAL)

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
  document.getElementById('face-icon').addEventListener('click', startGame)

}

(() => {
  document.getElementById('restart-button').addEventListener('click', handleRestartButton)
  settings.getSettings()
  addEvents()
  startGame()
})()
