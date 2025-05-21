import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["current", "duration"]

  connect() {
    document.addEventListener("player:time:update", this.updateDisplay.bind(this))
  }

  updateDisplay(event) {
    const { current, duration } = event.detail
    this.currentTarget.textContent = this.formatTime(current)
    this.durationTarget.textContent = `-${this.formatTime(duration - current)}`
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }
}