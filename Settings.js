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


  getSettings() {
    settings = JSON.parse(localStorage.getItem('settings') || '""')
    if (settings) {
      this.#update(settings)
    }
  }
  

  saveSettings() {
    this.#getParameters()
    localStorage.setItem('settings', JSON.stringify({ x: this.x, y: this.y, mines: this.mines }))
  }

  
  #getParameters() {
    let selected = document.querySelector('input[name="sizeSelector"]:checked').value

    switch(selected) {
      case 'beginner':
        this.#update({ x: 9, y: 9, mines: 10 })
        break
      case 'advanced':
        this.#update({ x: 16, y: 16, mines: 40 })
        break
      case 'expert':
        this.#update({ x: 16, y: 30, mines: 99 })
        break
      case 'custom':
        this.#update({ x: this.#get('x-size'), y: this.#get('y-size'), mines: this.#get('no-of-mines')})
        break
      default:
        this.#update({ x: 9, y: 9, mines: 10 })
    }
  }
}
