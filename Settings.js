export default class Settings {
  constructor () {
    this.x = 10
    this.y = 10
    this.mines = 10

    document.querySelectorAll('input[name="sizeSelector"]').forEach(el => {
      el.addEventListener('change', event => {
        if (event.target.value !== 'custom') {
          this.#getByName('x-size').disabled = true
          this.#getByName('y-size').disabled = true
          this.#getByName('no-of-mines').disabled = true
        }
        else {
          this.#getByName('x-size').disabled = false
          this.#getByName('y-size').disabled = false
          this.#getByName('no-of-mines').disabled = false
        }
      })
    })
  }
  
  
  #getByName(name) {
    return document.querySelector(`input[name="${name}"]`)
  }


  #get(name) {
    return parseInt(this.#getByName(name).value, 10)
  }


  #update({ x, y, mines }) {
    this.x = x
    this.y = y
    this.mines = mines
  }


  #updateControls(selected) {
    const event = new MouseEvent('change', {
      view: window,
      bubbles: true,
      cancelable: true
    })

    let radio = document.querySelector(`input[name="sizeSelector"][value="${selected}"]`)
    radio.dispatchEvent(event)
    radio.checked = true
  }


  getSettings() {
    settings = JSON.parse(localStorage.getItem('settings') || '""')
    if (settings) {
      this.#update(settings)
      this.#updateControls(settings.selected)
    }
  }
  

  saveSettings() {
    let params = this.#getParameters()
    
    if (params.x * params.y <= params.mines) {
      return alert('Too many mines')
    }

    this.#update(params)
    localStorage.setItem('settings', JSON.stringify({
      x: params.x,
      y: params.y,
      mines: params.mines,
      selected: [params.selected]
    }))
  }

  
  #getParameters() {
    let selected = document.querySelector('input[name="sizeSelector"]:checked').value

    let result = {}
    switch(selected) {
      case 'beginner':
        result = { x: 9, y: 9, mines: 10 }
        break
      case 'advanced':
        result = { x: 16, y: 16, mines: 40 }
        break
      case 'expert':
        result = { x: 16, y: 30, mines: 99 }
        break
      case 'custom':
        result = { x: this.#get('x-size'), y: this.#get('y-size'), mines: this.#get('no-of-mines')}
        break
      default:
        result = { x: 9, y: 9, mines: 10 }
    }

    result = Object.assign(result, { selected: selected })

    return result
  }

}
