import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["backdrop", "menu", "button"]
  static values = { isOpen: Boolean }

  connect() {
    this.isOpenValue = false
  }

  toggle() {
    this.isOpenValue = !this.isOpenValue
    this.updateUI()
  }

  close() {
    if (this.isOpenValue) {
      this.isOpenValue = false
      this.updateUI()
    }
  }

  keydown(event) {
    if (event.key === 'Escape' && this.isOpenValue) {
      this.close()
    }
  }

  updateUI() {
    const isOpen = this.isOpenValue
    this.backdropTarget.classList.toggle("hidden", !isOpen)
    this.menuTarget.classList.toggle("hidden", !isOpen)

    // Update button icons
    const hamburgerIcon = this.buttonTarget.querySelector('.hamburger')
    const closeIcon = this.buttonTarget.querySelector('.close')
    if (hamburgerIcon && closeIcon) {
      hamburgerIcon.classList.toggle("hidden", isOpen)
      closeIcon.classList.toggle("hidden", !isOpen)
    }

    // Ensure button is on top when menu is open
    this.buttonTarget.classList.toggle("z-[60]", isOpen)
  }
}