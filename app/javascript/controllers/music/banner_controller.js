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
    // Recalculate after layout settles, since repositioning banner affects player height
    setTimeout(() => this.setHeight(), 10)
  }

  setHeight() {
    const isMobile = window.innerWidth < 768
    const img = this.imageTarget

    if (isMobile) {
      if (this.dynamicHeightMode) {
        // MOBILE BANNER EXPANSION FIX: Banner fills screen except for controls at bottom
        const player = document.querySelector('[data-controller*="music--player"]')
        const controlsSection = player?.querySelector('.bg-gray-900') // The exact controls section
        
        let controlsHeight = 120 // Safe fallback
        if (controlsSection) {
          // Get actual height of controls section (waveform + playback controls)
          controlsHeight = controlsSection.offsetHeight
          console.log("🎨 MOBILE BANNER FIX: Controls section actual height:", controlsHeight)
        }
        
        // MOBILE ANIMATION FIX: Position from bottom to enable upward expansion
        this.containerTarget.style.position = 'fixed'
        this.containerTarget.style.bottom = controlsHeight + 'px'  // ANIMATION FIX: Anchor at bottom
        this.containerTarget.style.left = '0'       // Full width
        this.containerTarget.style.right = '0'      // Full width
        this.containerTarget.style.top = 'auto'     // Let it expand upward naturally
        this.containerTarget.style.zIndex = '30'    // Below controls (z-50) but above content
        this.containerTarget.style.height = `calc(100vh - ${controlsHeight}px)` // Fill available space
        this.containerTarget.style.transformOrigin = 'bottom center' // CRITICAL: Expand upward from bottom
        this.containerTarget.style.overflow = 'hidden' // Prevent content overflow
        
        // Ensure controls stay on top
        if (controlsSection) {
          controlsSection.style.position = 'fixed'
          controlsSection.style.bottom = '0'
          controlsSection.style.left = '0'
          controlsSection.style.right = '0'
          controlsSection.style.zIndex = '50' // Above banner
          controlsSection.style.backgroundColor = 'rgb(17 24 39)' // Ensure solid background
        }
        
        console.log("🎨 MOBILE BANNER FIX: Banner positioned to fill viewport except controls")
      } else {
        // MOBILE MINIMIZED: Reset to normal flow within player container
        this.containerTarget.style.position = 'relative'
        this.containerTarget.style.zIndex = 'auto'
        this.containerTarget.style.overflow = 'hidden'
        
        // Reset all expanded state properties
        this.containerTarget.style.bottom = 'auto'
        this.containerTarget.style.top = 'auto'
        this.containerTarget.style.left = 'auto'
        this.containerTarget.style.right = 'auto'
        this.containerTarget.style.transformOrigin = 'center'
        
        // CRITICAL: Reset controls back to normal flow
        const player = document.querySelector('[data-controller*="music--player"]')
        const controlsSection = player?.querySelector('.bg-gray-900')
        if (controlsSection) {
          controlsSection.style.position = 'relative'
          controlsSection.style.bottom = 'auto'
          controlsSection.style.left = 'auto'
          controlsSection.style.right = 'auto'
          controlsSection.style.zIndex = 'auto'
          console.log("🎨 MOBILE BANNER FIX: Controls reset to normal flow")
        }

        if (img.complete && img.naturalWidth && img.naturalHeight) {
          const containerWidth = this.containerTarget.offsetWidth
          const aspectRatio = img.naturalHeight / img.naturalWidth
          const calculatedHeight = containerWidth * aspectRatio
          // Set minimum height to prevent too small banners
          const minHeight = 120
          const newHeight = Math.max(minHeight, calculatedHeight)
          this.containerTarget.style.height = `${newHeight}px`
        } else {
          // Fallback if image not loaded yet
          this.containerTarget.style.height = '150px'
          img.onload = () => this.setHeight()
        }
        
        console.log("🎨 MOBILE BANNER FIX: Banner minimized - normal flex flow restored")
      }
    } else {
      // Desktop logic
      if (!this.dynamicHeightMode) {
        this.containerTarget.style.height = '160px'
        this.containerTarget.style.position = 'relative'
        this.containerTarget.style.zIndex = 'auto'
        return
      }
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        const containerWidth = this.containerTarget.offsetWidth
        const aspectRatio = img.naturalHeight / img.naturalWidth
        const newHeight = Math.max(160, containerWidth * aspectRatio)
        this.containerTarget.style.height = `${newHeight}px`
        this.containerTarget.style.position = 'relative'
        this.containerTarget.style.zIndex = 'auto'
      } else {
        img.onload = () => this.setHeight()
      }
    }
  }

  setDynamicHeight() { this.setHeight() }


  // =========== REVISED METHODS BELOW ===========

  /**
   * Shows the image banner, handling transitions and loading.
   * @param {string} imageUrl - The URL of the image to display.
   */
  showImage(imageUrl) {
    console.log("🎨 BANNER DEBUG: showImage called with:", imageUrl)
    
    // CRITICAL: Pause and unload the video to stop playback and free resources.
    if (this.hasVideoTarget) {
      console.log("🎨 BANNER DEBUG: Hiding video target")
      this.videoTarget.style.display = 'none'
      this.videoTarget.pause()
      this.videoTarget.src = '' // Unload the video
    }

    if (!this.hasImageTarget) {
      console.log("🎨 BANNER DEBUG: No image target found!")
      return
    }

    const newImageSrc = imageUrl || "music_files/home-banner.jpg"
    console.log("🎨 BANNER DEBUG: newImageSrc resolved to:", newImageSrc)
    console.log("🎨 BANNER DEBUG: Current imageTarget.src:", this.imageTarget.src)
    console.log("🎨 BANNER DEBUG: Current imageTarget.style.opacity:", this.imageTarget.style.opacity)
    
    // If the image is already the correct one, just ensure it's visible.
    if (this.imageTarget.src.endsWith(newImageSrc) && this.imageTarget.style.opacity == 1) {
      console.log("🎨 BANNER DEBUG: Image already correct and visible, returning early")
      return
    }

    console.log("🎨 BANNER DEBUG: Starting fade-out transition")
    // Start fade-out transition
    this.imageTarget.style.opacity = 0

    const transitionEndHandler = () => {
      console.log("🎨 BANNER DEBUG: Transition ended, updating image source")
      this.imageTarget.removeEventListener('transitionend', transitionEndHandler)

      // Once faded out, update the source
      console.log("🎨 BANNER DEBUG: Setting imageTarget.src to:", newImageSrc)
      this.imageTarget.src = newImageSrc

      // When the new image has loaded, recalculate height and fade it in
      this.imageTarget.onload = () => {
        console.log("🎨 BANNER DEBUG: New image loaded, recalculating height and fading in")
        this.setHeight()
        // Ensure display is 'block' before fading in
        this.imageTarget.style.display = 'block'
        this.imageTarget.style.opacity = 1
        console.log("🎨 BANNER DEBUG: Image should now be visible with opacity:", this.imageTarget.style.opacity)
        this.imageTarget.onload = null // Cleanup listener
      }

      // Add error handler
      this.imageTarget.onerror = () => {
        console.error("🎨 BANNER DEBUG: Failed to load image:", newImageSrc)
        console.log("🎨 BANNER DEBUG: Falling back to default banner")
        this.imageTarget.src = "music_files/home-banner.jpg"
      }
    }

    // If already transparent, change src immediately. Otherwise, wait for transition.
    if (this.imageTarget.style.opacity == 0) {
      console.log("🎨 BANNER DEBUG: Already transparent, changing src immediately")
      transitionEndHandler()
    } else {
      console.log("🎨 BANNER DEBUG: Waiting for fade-out transition to complete")
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
  }

  /**
   * Main banner update handler.
   */
  updateBanner(event) {
    const { image, video, title, subtitle, animatedBannersEnabled } = event.detail
    console.log("🎨 BANNER DEBUG: updateBanner called with:", { image, video, title, subtitle, animatedBannersEnabled })
    const preferVideo = animatedBannersEnabled && video
    console.log("🎨 BANNER DEBUG: preferVideo:", preferVideo)

    if (preferVideo) {
      console.log("🎨 BANNER DEBUG: Showing video:", video)
      this.showVideo(video)
    } else {
      console.log("🎨 BANNER DEBUG: Showing image:", image)
      this.showImage(image)
    }

    // Update titles (this logic was already correct)
    if (title && this.hasTitleTarget) {
      console.log("🎨 BANNER DEBUG: Updating title to:", title)
      this.titleTarget.textContent = title
    }
    if (subtitle && this.hasSubtitleTarget) {
      console.log("🎨 BANNER DEBUG: Updating subtitle to:", subtitle)
      this.subtitleTarget.textContent = subtitle
    }
  }
}