export default class Time {
  constructor () {
    this.timerStarted = false
    this.startTime = 0
    this.timer = null
    this.timerElement = document.getElementById('time')
  }

  
  startTimer() {
    if (this.timerStarted) return

    this.timerStarted = true
    this.startTime = Date.now()
    this.timer = setInterval(() => {
      let currentTime = (Date.now() - this.startTime) / 1000
      currentTime = this.convertTimeToMinutesAndSeconds(currentTime)
      this.timerElement.textContent = currentTime.minutes + ':' + currentTime.seconds
    }, 100)
  }

  stopTimer() {
    this.timerStarted = false
    clearInterval(this.timer)
  }

  resetTimer() {
    this.timerStarted = false
    this.timerElement.textContent = '00:00'
  }
    
  convertTimeToMinutesAndSeconds(time) {
    let minutes = Math.floor(time / 60)
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    let seconds = Math.floor(time % 60)
    if (seconds < 10) {
      seconds = '0' + seconds
    }

    return { minutes, seconds }
  }
}
