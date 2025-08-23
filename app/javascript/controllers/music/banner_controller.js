// app/javascript/controllers/music/banner_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "image", "title", "subtitle"]

  connect() {
    // Initialize height mode state - default to fixed height (160px)
    this.dynamicHeightMode = false

    document.addEventListener("music:banner:update", this.updateBanner.bind(this))
    document.addEventListener("banner:heightModeChanged", this.handleHeightModeChanged.bind(this))

    // Set initial height when component connects (160px by default)
    this.setHeight()

    // Check for saved state after a brief delay to ensure banner-height controller has initialized
    setTimeout(() => {
      const savedState = localStorage.getItem('bannerDynamicHeight')
      if (savedState !== null) {
        this.dynamicHeightMode = savedState === 'true'
        this.setHeight()
      }
    }, 10)
  }

  disconnect() {
    document.removeEventListener("music:banner:update", this.updateBanner.bind(this))
    document.removeEventListener("banner:heightModeChanged", this.handleHeightModeChanged.bind(this))
  }

  handleHeightModeChanged(event) {
    this.dynamicHeightMode = event.detail.dynamicHeight
    this.setHeight()
  }

  setHeight() {
    const img = this.imageTarget
    
    if (!this.dynamicHeightMode) {
      // Fixed height mode: always 160px
      this.containerTarget.style.height = '160px'
      return
    }

    // Dynamic height mode: calculate based on aspect ratio
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      // Calculate height based on image aspect ratio and container width
      const containerWidth = this.containerTarget.offsetWidth
      const aspectRatio = img.naturalHeight / img.naturalWidth
      const newHeight = Math.max(160, containerWidth * aspectRatio) // Minimum 160px

      // Set the height with smooth transition
      this.containerTarget.style.height = `${newHeight}px`
    } else {
      // If image isn't loaded yet, wait for it
      img.onload = () => this.setHeight()
    }
  }

  // Legacy method name for compatibility
  setDynamicHeight() {
    this.setHeight()
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
          // Update height based on new image dimensions
          this.setHeight();
          // Force reflow and fade in
          void this.imageTarget.offsetWidth;
          this.imageTarget.style.opacity = 1;
          this.imageTarget.onload = null; // Clean up
        };
        
        // Fallback in case onload doesn't fire
        setTimeout(() => {
          if (this.imageTarget.complete) {
            // Update height for fallback case as well
            this.setHeight();
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