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

    this.xInput = this.#getById('x-size')
    this.yInput = this.#getById('y-size')
    this.minesInput = this.#getById('no-of-mines')

    document.querySelectorAll('input[name="sizeSelector"]').forEach(el => {
      el.addEventListener('change', event => {
        if (event.target.value !== 'custom') {
          this.xInput.disabled = true
          this.yInput.disabled = true
          this.minesInput.disabled = true
        }
        else {
          this.xInput.disabled = false
          this.yInput.disabled = false
          this.minesInput.disabled = false
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

    this.xInput.addEventListener('change', () => {
      this.#checkLimits(true)
    })

    this.yInput.addEventListener('change', () => {
      this.#checkLimits(true)
    })

    this.minesInput.addEventListener('change', () => {
      this.#checkLimits(true)
    })
  }

  
  #checkLimits(showMessage = true) {
    let x = parseInt(this.xInput.value, 10)
    let y = parseInt(this.yInput.value, 10)
    let mines = parseInt(this.minesInput.value, 10)

    if (!Number.isInteger(x)) return !!(showMessage && alert('Incorrect value of X'))
    if (!Number.isInteger(y)) return !!(showMessage && alert('Incorrect value of Y'))
    if (!Number.isInteger(mines)) return !!(showMessage && alert('Incorrect value in the "Mines" field'))

    if (x > this.xInput.max) return !!(showMessage && alert('X value is too big'))
    if (y > this.yInput.max) return !!(showMessage && alert('Y value is too big'))
    if (mines > this.minesInput.max) return !!(showMessage && alert('Number of mines is too big'))

    if (x < this.xInput.min) return !!(showMessage && alert('X value is too small'))
    if (y < this.yInput.min) return !!(showMessage && alert('Y value is too small'))
    if (mines < this.minesInput.min) return !!(showMessage && alert('Number of mines is too small'))

    return true
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

  #getById(id) {
    return document.getElementById(id)
  }


  #getInt(name) {
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
    let def = { x: 9, y: 9, mines: 10 }

    let result = {}
    switch(selected) {
      case 'beginner':
        result = def
        break
      case 'advanced':
        result = { x: 16, y: 16, mines: 40 }
        break
      case 'expert':
        result = { x: 16, y: 30, mines: 99 }
        break
      case 'custom':
        if (!this.#checkLimits(false)) {
          result = def
        }
        else {
          result = { x: this.#getInt('x-size'), y: this.#getInt('y-size'), mines: this.#getInt('no-of-mines')}
        }
        break
      default:
        result = def
    }

    result = Object.assign(result, { selected: selected })

    return result
  }

}
