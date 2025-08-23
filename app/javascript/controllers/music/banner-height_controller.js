import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static classes = ["active", "inactive"]
  static values = {
    dynamicHeight: { type: Boolean, default: false }
  }

  connect() {
    // Load from localStorage
    const savedState = localStorage.getItem('bannerDynamicHeight')
    this.dynamicHeightValue = savedState !== null ? savedState === 'true' : false
    this.updateClass()
    
    // Initialize banner state
    this.dispatchState()
  }

  toggle() {
    this.dynamicHeightValue = !this.dynamicHeightValue
    localStorage.setItem('bannerDynamicHeight', this.dynamicHeightValue)
    this.dispatchState()
  }

  dispatchState() {
    document.dispatchEvent(new CustomEvent("banner:heightModeChanged", {
      detail: { dynamicHeight: this.dynamicHeightValue }
    }))
  }

  dynamicHeightValueChanged() {
    this.updateClass()
    this.dispatchState()
  }

  updateClass() {
    this.element.classList.toggle(this.activeClass, this.dynamicHeightValue)
    this.element.classList.toggle(this.inactiveClass, !this.dynamicHeightValue)
  }
}