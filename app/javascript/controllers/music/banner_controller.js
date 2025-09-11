// app/javascript/controllers/music/banner_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "image", "video", "title", "subtitle"]

  connect() {
    // ... your existing connect() method is fine ...
    this.dynamicHeightMode = false
    document.addEventListener("music:banner:update", this.updateBanner.bind(this))
    document.addEventListener("banner:heightModeChanged", this.handleHeightModeChanged.bind(this))
    this.setHeight()

    if (this.hasImageTarget) {
      this.imageTarget.style.width = '100%'
      this.imageTarget.style.height = '100%'
      this.imageTarget.style.opacity = 1
    }
    if (this.hasVideoTarget) {
      this.videoTarget.style.display = 'none'
    }

    setTimeout(() => {
      const savedState = localStorage.getItem('bannerDynamicHeight')
      if (savedState !== null) {
        this.dynamicHeightMode = savedState === 'true'
        this.setHeight()
      }
    }, 10)
  }

  disconnect() {
    // ... your existing disconnect() method is fine ...
    document.removeEventListener("music:banner:update", this.updateBanner.bind(this))
    document.removeEventListener("banner:heightModeChanged", this.handleHeightModeChanged.bind(this))
  }

  // ... your existing height methods are fine ...
  handleHeightModeChanged(event) {
    this.dynamicHeightMode = event.detail.dynamicHeight
    this.setHeight()
  }

  setHeight() {
    const img = this.imageTarget
    if (!this.dynamicHeightMode) {
      this.containerTarget.style.height = '160px'
      return
    }
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      const containerWidth = this.containerTarget.offsetWidth
      const aspectRatio = img.naturalHeight / img.naturalWidth
      const newHeight = Math.max(160, containerWidth * aspectRatio)
      this.containerTarget.style.height = `${newHeight}px`
    } else {
      img.onload = () => this.setHeight()
    }
  }

  setDynamicHeight() { this.setHeight() }


  // =========== REVISED METHODS BELOW ===========

  /**
   * Shows the image banner, handling transitions and loading.
   * @param {string} imageUrl - The URL of the image to display.
   */
  showImage(imageUrl) {
    // CRITICAL: Pause and unload the video to stop playback and free resources.
    if (this.hasVideoTarget) {
      this.videoTarget.style.display = 'none'
      this.videoTarget.pause()
      this.videoTarget.src = '' // Unload the video
    }

    if (!this.hasImageTarget) return

    const newImageSrc = imageUrl || "music_files/home-banner.jpg"
    
    // If the image is already the correct one, just ensure it's visible.
    if (this.imageTarget.src.endsWith(newImageSrc) && this.imageTarget.style.opacity == 1) {
      return
    }

    // Start fade-out transition
    this.imageTarget.style.opacity = 0

    const transitionEndHandler = () => {
      this.imageTarget.removeEventListener('transitionend', transitionEndHandler)

      // Once faded out, update the source
      this.imageTarget.src = newImageSrc

      // When the new image has loaded, recalculate height and fade it in
      this.imageTarget.onload = () => {
        this.setHeight()
        // Ensure display is 'block' before fading in
        this.imageTarget.style.display = 'block'
        this.imageTarget.style.opacity = 1
        this.imageTarget.style.height = '100%'
        this.imageTarget.style.width = '100%'
        this.imageTarget.onload = null // Cleanup listener
      }
    }

    // If already transparent, change src immediately. Otherwise, wait for transition.
    if (this.imageTarget.style.opacity == 0) {
      transitionEndHandler()
    } else {
      this.imageTarget.addEventListener('transitionend', transitionEndHandler)
    }
  }

  /**
   * Shows the video banner.
   * @param {string} videoUrl - The URL of the video to display.
   */
  showVideo(videoUrl) {
    // Hide the image
    if (this.hasImageTarget) {
      this.imageTarget.style.display = 'none'
      this.imageTarget.style.opacity = 0
    }

    if (!this.hasVideoTarget) return

    // Update video source if it has changed
    if (this.videoTarget.src !== videoUrl) {
      this.videoTarget.src = videoUrl
    }

    // Make the video visible
    this.videoTarget.style.display = 'block'
    this.videoTarget.style.opacity = 1
    this.videoTarget.style.width = '100%'
    this.videoTarget.style.height = '100%'
  }

  /**
   * Main banner update handler.
   */
  updateBanner(event) {
    const { image, video, title, subtitle, animatedBannersEnabled } = event.detail
    console.log("🎵 BANNER: animated boolean: ", animatedBannersEnabled);
    const preferVideo = animatedBannersEnabled && video

    if (preferVideo) {
      this.showVideo(video)
    } else {
      this.showImage(image)
    }

    // Update titles (this logic was already correct)
    if (title && this.hasTitleTarget) {
      this.titleTarget.textContent = title
    }
    if (subtitle && this.hasSubtitleTarget) {
      this.subtitleTarget.textContent = subtitle
    }
  }
}