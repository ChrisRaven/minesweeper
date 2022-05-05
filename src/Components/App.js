import { useState, useEffect } from 'react'
import Status from './Status'
import Settings from './Settings'
import Field from './Field'

export let playfield = []


function placeMines(x, y, mines) {
  const size = x * y;

  while (mines) {
    let position = Math.floor(Math.random() * size)
    let px = Math.floor(position / y);
    let py = position % y
    if (playfield[px][py] === 'mine') {
      continue
    }
    else {
      playfield[px][py] = 'mine'
      mines--
    }
  }
}

function calculateNeighbours(x, y, mines) {
  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      let pos = playfield[i][j]
      if (pos === 'mine') continue

      /*
      p = plus
      m = minus

      pm1my pmy pp1my
      pm1    x    pp1
      pm1py ppy pp1py
      */

      let pm1 =   i > 0                  ? playfield[i - 1][j]     : null
      let pp1 =   i < x - 1              ? playfield[i + 1][j]     : null
      let pmy =   j > 0                  ? playfield[i][j - 1]     : null
      let ppy =   j < y - 1              ? playfield[i][j + 1]     : null
      let pm1my = i > 0     && j > 0     ? playfield[i - 1][j - 1] : null
      let pm1py = i > 0     && j < y - 1 ? playfield[i - 1][j + 1] : null
      let pp1my = i < x - 1 && j > 0     ? playfield[i + 1][j - 1] : null
      let pp1py = i < x - 1 && j < y - 1 ? playfield[i + 1][j + 1] : null

      let neighbours = { pm1, pp1, pmy, ppy, pm1my, pm1py, pp1my, pp1py }
      let counter = 0;

      for (const value of Object.values(neighbours)) {
        if (value === 'mine') {
          counter++
        }
      }
      playfield[i][j] = counter
    }
  }
}

// temporary to look for any errors
function showPlayfield(x, y) {
  for (let i = 0; i < x; i++) {
    for (let j = 0; j < y; j++) {
      let text = playfield[i][j] === 'mine' ? 'M' : playfield[i][j]
      document.getElementById(i + '-' + j).textContent = text
    }
  }
}

function preparePlayfield({ x, y, mines }) {
  // source: https://stackoverflow.com/a/49201210
  playfield = Array(x).fill(null).map(() => Array(y))

  placeMines(x, y, mines)
  calculateNeighbours(x, y, mines)
  showPlayfield(x, y) // TEMP
}


function App() {
  const [parameters, setParameters] = useState({ x: 10, y: 10, mines: 10 })

  // TEMPorary to dismiss warning message
  useEffect(() => {
    setParameters({ x: 10, y: 10, mines: 10 })
    setTimeout(() => preparePlayfield(parameters), 100)
  }, []) // eslint-disable-line


  function handleSquareClick(event) {
    let clicked = event.target
    if (clicked.classList.contains('square')) {
      let x = clicked.dataset.x
      let y = clicked.dataset.y
      console.log(x, y)
    }
  }


  function changeParameters(parameters) {
    setParameters(parameters)
  }


  return (
    <>
      <Status />
      <Settings parameters={parameters} changeParameters={changeParameters} />
      <Field dimensions={parameters} handleClick={handleSquareClick} />
    </>
  )
}

export default App
