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
    this.updatePosition()

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
    this.updatePosition()
    this.dispatchState()
  }

  updatePosition() {
    if (this.dynamicHeightValue) {
      // When expanded, position fixed at top right
      this.element.style.position = 'fixed'
      this.element.style.bottom = '8px'
      this.element.style.right = '8px'
    } else {
      // When minimized, position absolute in music player
      this.element.style.position = 'absolute'
      this.element.style.top = '16px'
      this.element.style.right = '16px'
    }
  }

  updateClass() {
    this.element.classList.toggle(this.activeClass, this.dynamicHeightValue)
    this.element.classList.toggle(this.inactiveClass, !this.dynamicHeightValue)
  }
}