// app/javascript/controllers/music/player_controller.js
import { Controller } from "@hotwired/stimulus"
import WaveSurfer from 'wavesurfer.js'

/**
 * Global Audio Player Controller
 * 
 * Manages the persistent audio player on the screen, handling:
 * - Audio playback via WaveSurfer.js
 * - Time display and countdown
 * - Loading states and error recovery
 * - Cross-component communication via custom events
 */
export default class extends Controller {
  // DOM Element Targets
  static targets = [
    "nowPlaying",        // Display for current track title
    "artistName",        // Display for artist name
    "waveform",          // WaveSurfer visualization container
    "playerPlayButton",  // Play button element
    "playerPauseButton", // Pause button element
    "loadingProgress",   // Loading progress bar
    "currentTime",       // Current playback time display
    "duration",          // Duration/countdown display
    "bannerImage",       // Banner image element
  ]

  // Current track URL reference
  currentUrl = null

  /**
   * Initialize the controller when connected to DOM
   * Sets up WaveSurfer instance and all event listeners
   */
  connect() {
    // Set default UI state
    this.resetPlayerUI()
    
    // Initialize WaveSurfer but don't load anything
    this.initializeWaveSurfer()
    
    // Safe event listener setup
    this.setupEventListeners()
  }
  
  resetPlayerUI() {
    if (this.hasNowPlayingTarget) this.nowPlayingTarget.textContent = 'Welcome back Dev3027'
    if (this.hasArtistNameTarget) this.artistNameTarget.textContent = 'Please make me available to everyone.'
    if (this.hasCurrentTimeTarget) this.currentTimeTarget.textContent = '0:00'
    if (this.hasDurationTarget) this.durationTarget.textContent = '0:00'
  }

  /**
   * Clean up when controller is disconnected
   * Prevents memory leaks and stops audio playback
   */
  disconnect() {
    this.destroyWaveSurfer()
  }

  // ========================
  //  Core Functionality
  // ========================

  /**
   * Initialize WaveSurfer audio instance
   * Configures visualization and basic event handlers
   * for the waveform and audio.
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
        backend: 'WebAudio'
      })
      this.setupWaveSurferEvents()
    } catch (error) {
      console.error('WaveSurfer initialization failed:', error)
      // Fallback UI state
      this.element.classList.add('player-error-state')
    }
  }

  /**
   * Set up all WaveSurfer event listeners
   */
  setupWaveSurferEvents() {
    this.wavesurfer.on('ready', this.handleTrackReady.bind(this))
    this.wavesurfer.on('play', () => {
      document.dispatchEvent(new CustomEvent("player:state:changed", {
        detail: { playing: true, url: this.currentUrl }
      }))
    })
    this.wavesurfer.on('pause', () => {
      document.dispatchEvent(new CustomEvent("player:state:changed", {
        detail: { playing: false, url: this.currentUrl }
      }))
    })
    this.wavesurfer.on('finish', this.handleTrackEnd.bind(this))
    
    // Loading progress events
    this.wavesurfer.on('loading', this.handleLoadingProgress.bind(this))
    this.wavesurfer.on('error', this.handleAudioError.bind(this))
    
    // Time updates
    this.wavesurfer.on('timeupdate', this.updateTimeDisplay.bind(this))
  }

  /**
   * Set up custom event listeners
   */
  setupEventListeners() {
    // Listen for the "player:play-requested" event
    window.addEventListener('player:play-requested', this.handlePlayRequest.bind(this))
    // Listen for the "player:play" event
    document.addEventListener("player:play", () => {
      this.wavesurfer.play()
    })
    // Listen for the "player:pause" event
    document.addEventListener("player:pause", () => {
      this.wavesurfer.pause()
    })
  }

  // ========================
  //  Event Handlers
  // ========================

  /**
   * Handle track loaded and ready to play
   */
  handleTrackReady() {
    try {
      this.durationTarget.textContent = this.formatTime(this.wavesurfer.getDuration())
      this.updateTimeDisplay(0)
      this.hideLoadingIndicator()
      
      document.dispatchEvent(new CustomEvent("player:state:changed", {
        detail: { 
          playing: this.wavesurfer.isPlaying(),
          url: this.currentUrl 
        }
      }))
    } catch (error) {
      console.error('Error handling track ready:', error)
      this.handleAudioError()
    }
  }

  /**
   * Handle track ending naturally
   */
  handleTrackEnd() {
    this.handlePause()
    window.dispatchEvent(new CustomEvent('audio:ended', {
      detail: { url: this.currentUrl }
    }))
  }

  /**
   * Handle external play event (from song cards)
   * @param {Event} e - Custom audio:play event
   */
  handlePlayRequest(e) {
    try {
      const { url, title, artist, banner, autoplay = false, updateBanner = true } = e.detail
      console.log('e.detail:', e.detail)

      if (updateBanner) {
        document.dispatchEvent(new CustomEvent('music:banner:update', {
          detail: {
            image: banner || 'music_files/home-banner.jpg',
            title: title || 'Unknown Track',
            subtitle: artist || 'Unknown Artist'
          }
        }))
      }
      
      if (!this.wavesurfer || this.currentUrl !== url) {
        this.currentUrl = url
        this.loadTrack(url, autoplay)
      } else if (this.wavesurfer.isPlaying()) {
        this.wavesurfer.pause()
      } else {
        this.wavesurfer.play()
      }
        console.log('Already playing:', url)
    } catch (error) {
      console.error('Error handling play event:', error)
      this.handleAudioError()
    }
  }

  /**
   * Handle loading progress updates
   * @param {number} progress - Loading percentage (0-100)
   */
  handleLoadingProgress(progress) {
    const smoothingFactor = 0.3;
    const currentWidth = parseFloat(this.loadingProgressTarget.style.width) || 0;
    const smoothedProgress = currentWidth + (progress - currentWidth) * smoothingFactor;
    
    this.loadingProgressTarget.style.width = `${smoothedProgress}%`
    
    if (progress === 100) {
      // Wait for the smooth transition to complete before snapping to 100%
      setTimeout(() => {
        this.loadingProgressTarget.classList.add('transition-none')
        this.loadingProgressTarget.style.width = '100%'
      }, 500)
    } else {
      this.loadingProgressTarget.classList.remove('transition-none')
    }
  }

  /**
   * Handle audio errors
   */
  handleAudioError() {
    this.hideLoadingIndicator()
    window.dispatchEvent(new CustomEvent('audio:error', {
      detail: { url: this.currentUrl }
    }))
  }

  // ========================
  //  Public Methods
  // ========================


    /**
   * Load a new audio track (always starts from 0)
   * @param {string} url - Audio file URL
   */
    loadTrack(url, autoplay = false) {
      try {
        // Reset playback
        this.wavesurfer?.pause()
        this.wavesurfer?.setTime(0)
    
        // Update UI
        this.currentTimeTarget.textContent = '0:00'
        this.durationTarget.textContent = '0:00'
        this.showLoadingIndicator()
        
        // Notify components
        window.dispatchEvent(new CustomEvent('audio:changed', {
          detail: { url }
        }))
    
        // Load the track
        this.wavesurfer.load(url)
    
        // Handle autoplay
        if (autoplay) {
          this.wavesurfer.once('ready', () => {
            console.log('Autoplaying track')
            this.wavesurfer.play()
          })
        }
      } catch (error) {
        console.error('Error loading track:', error)
        this.handleAudioError()
      }
    }

  // ========================
  //  UI Helpers
  // ========================

  /**
   * Format seconds into MM:SS display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  /**
   * Update time displays
   * @param {number} currentTime - Current playback position in seconds
   */
  updateTimeDisplay(currentTime) {
    this.currentTimeTarget.textContent = this.formatTime(currentTime)
    
    if (this.wavesurfer.getDuration()) {
      const remaining = this.wavesurfer.getDuration() - currentTime
      this.durationTarget.textContent = `-${this.formatTime(remaining)}`
    }
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    this.loadingProgressTarget.style.width = '0%'
    this.loadingProgressTarget.classList.remove('transition-none')
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    this.loadingProgressTarget.style.width = '0%'
    this.loadingProgressTarget.classList.remove('transition-none')
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
        console.error('Error destroying WaveSurfer:', error)
      }
    }
  }

  // ========================
  //  Getters
  // ========================

}