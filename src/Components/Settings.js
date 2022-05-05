function getParameters() {
  let selected = document.querySelector('input[name="sizeSelector"]:checked').value

  function get(name) {
    return document.querySelector(`input[name=${name}]`).value
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


export default function Settings({ parameters, changeParameters }) {

  return (
    <>
      <input type="radio" name="sizeSelector" defaultChecked value="beginner" />Beginner
      <input type="radio" name="sizeSelector" value="advanced" />Advanced
      <input type="radio" name="sizeSelector" value="expert" />Expert
      <label>
        <input type="radio" name="sizeSelector" value="custom" />
        Custom: X:
          <input
            type="text"
            name="x-size"
            defaultValue={parameters.x}
          />
          , Y:
          <input
            type="text"
            name="y-size"
            defaultValue={parameters.y}
          />
          <input
            type="text"
            name="no-of-mines"
            defaultValue={parameters.mines}
          />
      </label>
      <button onClick={ () => changeParameters(getParameters()) }>OK</button>
    </>
  )
}
