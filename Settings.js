import { startGame, settings } from './index.js'

document.getElementById('confirm-settings-button').addEventListener('click', () => {
  if (!settings.saveSettings()) return

  startGame()
  settings.hideSettings()
})

function setDisplay(value) {
  document.getElementById('settings').style.display = value
}

export default class Settings {
  constructor () {
    this.x = 10
    this.y = 10
    this.mines = 10
    this.dialogVisibility = false

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

    document.getElementById('show-settings-button').addEventListener('click', (event) => {
      if (this.dialogVisibility) {
        this.hideSettings()
      }
      else {
        this.showSettings()
      }
    })

    document.getElementById('close-settings-button').addEventListener('click', () => {
      this.hideSettings()
    })
  }

  showSettings() {
    this.dialogVisibility = true
    setDisplay('block')
  }

  hideSettings() {
    this.dialogVisibility = false
    setDisplay('none')
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
    let storageSettings = JSON.parse(localStorage.getItem('settings') || '""')
    if (storageSettings) {
      this.#update(storageSettings)
      this.#updateControls(storageSettings.selected)
    }
  }
  

  saveSettings() {
    let params = this.#getParameters()

    if (params.x * params.y <= params.mines) {
      alert('Too many mines')
      return false
    }

    this.#update(params)
    localStorage.setItem('settings', JSON.stringify({
      x: params.x,
      y: params.y,
      mines: params.mines,
      selected: [params.selected]
    }))

    return true
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
