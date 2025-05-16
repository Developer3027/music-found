import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "onIcon", "offIcon"]
  
  connect() {
    this.enabled = localStorage.getItem('audioAutoplay') === 'true'
    this.updateUI()
  }

  toggle() {
    this.enabled = !this.enabled
    localStorage.setItem('audioAutoplay', this.enabled)
    this.updateUI()
  }

  updateUI() {
    console.log('this.enabled', this.enabled)
    this.onIconTarget.classList.toggle('hidden', !this.enabled)
    this.offIconTarget.classList.toggle('hidden', this.enabled)
  }
}