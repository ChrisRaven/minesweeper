import { useState, useEffect } from 'react'
import Square from './Square'


export default function Field({ dimensions, handleClick }) {
  const [squares, setSquares] = useState([])

  useEffect(() => {
    let squares = []

    for (let i = 0; i < dimensions.x; i++) {
      for (let j = 0; j < dimensions.y; j++) {
        squares.push(<Square key={`${i}-${j}`} coords={{x: i, y: j}} />)
      }
      squares.push(<br key={`${i}br`} />)
    }

    setSquares(squares)
  }, []) // eslint-disable-line

  return (
    <div className="field" onClick={ event => handleClick(event) }>
      {squares}
    </div>
  )
}
