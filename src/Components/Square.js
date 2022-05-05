export default function Square({ coords }) {

  return (
    <div className="square" data-x={coords.x} data-y={coords.y} id={coords.x + '-' + coords.y}></div>
  )
}
