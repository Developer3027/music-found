import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static classes = ["active", "inactive"]
  static values = { 
    active: { type: Boolean, default: false } 
  }
  
  connect() {
    // Load from localStorage
    const savedState = localStorage.getItem("audioPlayOnLoad") === 'true'
    this.activeValue = savedState
    this.updateClass()
    
    // Initialize player state
    this.dispatchPlayOnLoadState()
  }

  toggle() {
    this.activeValue = !this.activeValue
    localStorage.setItem("audioPlayOnLoad", this.activeValue)
    this.dispatchPlayOnLoadState()
  }

  dispatchPlayOnLoadState() {
    document.dispatchEvent(new CustomEvent("player:play-on-load:changed", {
      detail: { enabled: this.activeValue }
    }))
  }

  activeValueChanged() {
    this.updateClass()
    this.dispatchPlayOnLoadState()
  }

  updateClass() {
    this.element.classList.toggle(this.activeClass, this.activeValue)
    this.element.classList.toggle(this.inactiveClass, !this.activeValue)
  }
}