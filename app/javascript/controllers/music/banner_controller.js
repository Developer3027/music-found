// app/javascript/controllers/music/banner_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["image", "title", "subtitle"]

  connect() {
    console.log('banner controller connected')
    document.addEventListener("music:banner:update", this.updateBanner.bind(this))
  }

  disconnect() {
    document.removeEventListener("music:banner:update", this.updateBanner.bind(this))
  }

  updateBanner(event) {
    const { image, title, subtitle } = event.detail
  
    // Only update if the image actually changed
    if (image && this.imageTarget.src !== image) {
      this.imageTarget.style.opacity = 0
      setTimeout(() => {
        this.imageTarget.src = image
        this.imageTarget.style.opacity = 1
      }, 500)
    }
    
    if (title) this.titleTarget.textContent = title
    if (subtitle) this.subtitleTarget.textContent = subtitle
  }
}