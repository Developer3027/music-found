// app/javascript/controllers/music/banner_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["image", "title", "subtitle"]

  connect() {
    document.addEventListener("music:banner:update", this.updateBanner.bind(this))
  }

  disconnect() {
    document.removeEventListener("music:banner:update", this.updateBanner.bind(this))
  }

  updateBanner(event) {
    const { image, title, subtitle } = event.detail
    const newImage = image || "music_files/home-banner.jpg"
    
    if (image && !this.imageTarget.src.endsWith(newImage)) {
      // Start transition to fade out
      this.imageTarget.style.opacity = 0;
      
      const handleTransitionEnd = () => {
        this.imageTarget.src = image;
        
        // Show loading state if image takes time to load
        this.imageTarget.onload = () => {
          // Force reflow and fade in
          void this.imageTarget.offsetWidth;
          this.imageTarget.style.opacity = 1;
          this.imageTarget.onload = null; // Clean up
        };
        
        // Fallback in case onload doesn't fire
        setTimeout(() => {
          if (this.imageTarget.complete) {
            void this.imageTarget.offsetWidth;
            this.imageTarget.style.opacity = 1;
          }
        }, 500);
        
        this.imageTarget.removeEventListener('transitionend', handleTransitionEnd);
      };
      
      this.imageTarget.addEventListener('transitionend', handleTransitionEnd);
    }
    
    if (title) this.titleTarget.textContent = title;
    if (subtitle) this.subtitleTarget.textContent = subtitle;
  }
}