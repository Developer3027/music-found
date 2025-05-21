import { Controller } from "@hotwired/stimulus"
import WaveSurfer from "wavesurfer.js"

/**
 * Global Audio Player Controller
 * 
 * Manages core audio playback functionality including:
 * - WaveSurfer initialization and management
 * - Track loading and playback control
 * - Event handling and state management
 * - Error handling and recovery
 */
export default class extends Controller {
  // ========================
  //  Configuration
  // ========================

  /**
   * DOM Element Targets
   * @type {string[]}
   */
  static targets = [
    "waveform",          // WaveSurfer visualization container
    "loadingProgress",   // Loading progress bar element
  ]

  /**
   * Current track URL reference
   * @type {?string}
   */
  currentUrl = null

  // ========================
  //  Lifecycle Methods
  // ========================

  /**
   * Initialize controller when connected to DOM
   * Sets up WaveSurfer instance and event listeners
   */
  connect() {
    this.initializeWaveSurfer()
    this.setupEventListeners()
  }

  /**
   * Clean up when controller is disconnected
   * Stops playback and destroys WaveSurfer instance
   */
  disconnect() {
    this.destroyWaveSurfer()
  }

  // ========================
  //  Core Audio Setup
  // ========================

  /**
   * Initialize WaveSurfer audio instance
   * Creates and configures the WaveSurfer player with visualization options
   */
  initializeWaveSurfer() {
    try {
      this.wavesurfer = WaveSurfer.create({
        container: this.waveformTarget,
        waveColor: "#00B1D1",
        progressColor: "#01DFB6",
        height: 50,
        minPxPerSec: 50,
        hideScrollbar: true,
        autoScroll: true,
        autoCenter: true,
        dragToSeek: true,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        responsive: true,
        backend: "WebAudio"
      })
      this.setupWaveSurferEvents()
    } catch (error) {
      console.error("WaveSurfer initialization failed:", error)
      this.element.classList.add("player-error-state")
    }
  }

  /**
   * Set up WaveSurfer event listeners
   * Handles playback state changes, loading progress, and errors
   */
  setupWaveSurferEvents() {
    // Playback state events
    this.wavesurfer.on("ready", this.handleTrackReady.bind(this))
    this.wavesurfer.on("play", this.handlePlay.bind(this))
    this.wavesurfer.on("pause", this.handlePause.bind(this))
    this.wavesurfer.on("finish", this.handleTrackEnd.bind(this))
    
    // Loading events
    this.wavesurfer.on("loading", this.handleLoadingProgress.bind(this))
    this.wavesurfer.on("error", this.handleAudioError.bind(this))
    
    // Time updates
    this.wavesurfer.on("timeupdate", this.updateTimeDisplay.bind(this))
  }

  // ========================
  //  Event Handling
  // ========================

  /**
   * Set up custom DOM event listeners
   * Listens for external playback commands
   */
  setupEventListeners() {
    window.addEventListener("player:play-requested", this.handlePlayRequest.bind(this))
    document.addEventListener("player:play", () => this.wavesurfer.play())
    document.addEventListener("player:pause", () => this.wavesurfer.pause())
  }

  // ========================
  //  Playback State Handlers
  // ========================

  /**
   * Handle track loaded and ready to play
   * Updates UI and dispatches ready state
   */
  handleTrackReady() {
    try {
      this.updateTimeDisplay(0)
      this.hideLoadingIndicator()
      this.dispatchStateChange()
    } catch (error) {
      console.error("Error handling track ready:", error)
      this.handleAudioError()
    }
  }

  /**
   * Handle play state change
   */
  handlePlay() {
    this.dispatchStateChange(true)
  }

  /**
   * Handle pause state change
   */
  handlePause() {
    this.dispatchStateChange(false)
  }

  /**
   * Handle track ending naturally
   */
  handleTrackEnd() {
    this.handlePause()
    window.dispatchEvent(new CustomEvent("audio:ended", {
      detail: { url: this.currentUrl }
    }))
  }

  /**
   * Dispatch player state change event
   * @param {boolean} [playing] - Optional play/pause state
   */
  dispatchStateChange(playing) {
    document.dispatchEvent(new CustomEvent("player:state:changed", {
      detail: { 
        playing: playing ?? this.wavesurfer.isPlaying(),
        url: this.currentUrl 
      }
    }))
  }

  // ========================
  //  Playback Control
  // ========================

  /**
   * Handle external play event (from song cards)
   * @param {Event} e - Custom play event containing track details
   */
  handlePlayRequest(e) {
    console.log("handlePlayRequest: ", e.detail)
    try {
      const { url, title, artist, banner, autoplay = false, updateBanner } = e.detail

      if (updateBanner !== false) {
        this.updateBanner({ banner, title, artist })
      }
      
      if (!this.wavesurfer || this.currentUrl !== url) {
        this.loadTrack(url, autoplay)
      } else {
        this.togglePlayback()
      }
    } catch (error) {
      console.error("Error handling play event:", error)
      this.handleAudioError()
    }
  }

  /**
   * Toggle between play and pause states
   */
  togglePlayback() {
    this.wavesurfer.playPause()
  }

  // ========================
  //  Track Loading
  // ========================

  /**
   * Load a new audio track
   * @param {string} url - Audio file URL
   * @param {boolean} [autoplay=false] - Whether to autoplay when loaded
   */
  loadTrack(url, autoplay = false) {
    console.log("load url: ", url)
    try {
      this.resetPlayback()
      this.showLoadingIndicator()
      this.dispatchTrackChange(url)
      
      this.wavesurfer.load(url)
      this.setupAutoplay(autoplay)
    } catch (error) {
      console.error("Error loading track:", error)
      this.handleAudioError()
    }
  }

  /**
   * Reset playback state before loading new track
   */
  resetPlayback() {
    this.wavesurfer?.pause()
    this.wavesurfer?.setTime(0)
  }

  /**
   * Dispatch track change event
   * @param {string} url - New track URL
   */
  dispatchTrackChange(url) {
    this.currentUrl = url
    window.dispatchEvent(new CustomEvent("audio:changed", { detail: { url } }))
  }

  /**
   * Configure autoplay if requested
   * @param {boolean} autoplay - Whether to autoplay
   */
  setupAutoplay(autoplay) {
    if (autoplay) {
      this.wavesurfer.once("ready", () => {
        this.wavesurfer.play()
      })
    }
  }

  // ========================
  //  UI Updates
  // ========================

  /**
   * Update time display
   * @param {number} currentTime - Current playback position in seconds
   */
  updateTimeDisplay(currentTime) {
    if (this.wavesurfer.getDuration()) {
      document.dispatchEvent(new CustomEvent("player:time:update", {
        detail: {
          current: currentTime,
          duration: this.wavesurfer.getDuration()
        }
      }))
    }
  }

  /**
   * Update banner display
   * @param {Object} details - Banner details
   */
  updateBanner({ banner, title, artist }) {
    document.dispatchEvent(new CustomEvent("music:banner:update", {
      detail: {
        image: banner,
        title: title || "Unknown Track",
        subtitle: artist || "Unknown Artist"
      }
    }))
  }

  // ========================
  //  Loading States
  // ========================

  /**
   * Handle loading progress updates
   * @param {number} progress - Loading percentage (0-100)
   */
  handleLoadingProgress(progress) {
    const smoothedProgress = this.calculateSmoothedProgress(progress)
    this.loadingProgressTarget.style.width = `${smoothedProgress}%`
    
    if (progress === 100) {
      setTimeout(() => this.completeLoading(), 500)
    }
  }

  /**
   * Calculate smoothed loading progress
   */
  calculateSmoothedProgress(progress) {
    const currentWidth = parseFloat(this.loadingProgressTarget.style.width) || 0
    return currentWidth + (progress - currentWidth) * 0.3 // Smoothing factor
  }

  /**
   * Complete loading transition
   */
  completeLoading() {
    this.loadingProgressTarget.classList.add("transition-none")
    this.loadingProgressTarget.style.width = "100%"
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    this.loadingProgressTarget.style.width = "0%"
    this.loadingProgressTarget.classList.remove("transition-none")
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    this.loadingProgressTarget.style.width = "0%"
    this.loadingProgressTarget.classList.remove("transition-none")
  }

  // ========================
  //  Error Handling
  // ========================

  /**
   * Handle audio errors
   */
  handleAudioError() {
    this.hideLoadingIndicator()
    window.dispatchEvent(new CustomEvent("audio:error", {
      detail: { url: this.currentUrl }
    }))
  }

  // ========================
  //  Cleanup
  // ========================

  /**
   * Properly destroy WaveSurfer instance
   */
  destroyWaveSurfer() {
    if (this.wavesurfer) {
      try {
        this.wavesurfer.pause()
        this.wavesurfer.destroy()
        this.wavesurfer = null
      } catch (error) {
        console.error("Error destroying WaveSurfer:", error)
      }
    }
  }
}