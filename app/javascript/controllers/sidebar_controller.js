// app/javascript/controllers/sidebar_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "link", "menu" ]

  connect() {
    // Set the initial active link (Home in this case)
    this.setActive(this.linkTargets[0])
  }

  setActive(event) {
    // If event is a mouse event, get the target element
    const element = event.currentTarget || event
    
    // Remove active class from all links
    this.linkTargets.forEach(link => {
      link.classList.remove("bg-[#FFC9A4]")
    })
    
    // Add active class to clicked link
    element.classList.add("bg-[#FFC9A4]")
  }

  toggleMenu() {
    this.menuTarget.classList.toggle("hidden")
  }

  closeMenu(e) {
    if (!this.element.contains(e.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}