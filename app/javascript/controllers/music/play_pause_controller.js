// app/javascript/controllers/play_pause_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["playButton", "pauseButton"]
  
  connect() {
    this.boundToggle = this.toggleButtons.bind(this)
    document.addEventListener("player:state:changed", this.boundToggle)
  }
  
  disconnect() {
    document.removeEventListener("player:state:changed", this.boundToggle)
  }
  
  play() {
    // this.toggleButtons({ detail: { playing: true } })
    document.dispatchEvent(new CustomEvent("player:play"))
  }
  
  pause() {
    // this.toggleButtons({ detail: { playing: false } })
    document.dispatchEvent(new CustomEvent("player:pause"))
  }
  
  toggleButtons(event) {
    const { playing } = event.detail
    this.playButtonTarget.classList.toggle("hidden", playing)
    this.pauseButtonTarget.classList.toggle("hidden", !playing)
  }
}
