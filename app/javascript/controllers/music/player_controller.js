// app/javascript/controllers/music/player_controller.js
import { Controller } from "@hotwired/stimulus"
import WaveSurfer from 'wavesurfer.js'

/**
 * Global Audio Player Controller
 * 
 * Manages the persistent audio player at the bottom of the screen, handling:
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
    //"loadingContainer",  // Loading indicator container
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
        backend: 'WebAudio' // More reliable than MediaElement
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
    
    // Playback state events
    this.wavesurfer.on('ready', this.handleTrackReady.bind(this))
    this.wavesurfer.on('play', this.handlePlay.bind(this))
    this.wavesurfer.on('pause', this.handlePause.bind(this))
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
    // Use passive listeners where possible
    const options = { passive: true }
    
    // Safely add event listeners
    if (typeof this.handlePlayEvent === 'function') {
      window.addEventListener('audio:play', this.handlePlayEvent.bind(this), options)
    }
    
    if (typeof this.handlePauseEvent === 'function') {
      window.addEventListener('audio:pause', this.handlePauseEvent.bind(this), options)
    }
  }

  // ========================
  //  Event Handlers
  // ========================

  /**
   * Handle track loaded and ready to play
   */
  handleTrackReady() {
    try {
      this.playerPlayButtonTarget.classList.add('hidden')
      this.playerPauseButtonTarget.classList.remove('hidden')
      this.durationTarget.textContent = this.formatTime(this.wavesurfer.getDuration())
      this.updateTimeDisplay(0)
      this.hideLoadingIndicator()
      
      // Auto-play only if user has previously interacted
      // Currently not using this feature but tested good.
      this.wavesurfer.play()
      // if (this.canAutoplay) {
      //   this.wavesurfer.play()
      // }
    } catch (error) {
      console.error('Error handling track ready:', error)
      this.handleAudioError()
    }
  }

  /**
   * Handle play event from WaveSurfer
   */
  handlePlay() {
    this.playerPlayButtonTarget.classList.add('hidden')
    this.playerPauseButtonTarget.classList.remove('hidden')
    window.dispatchEvent(new CustomEvent('audio:playing', { 
      detail: { playing: true, url: this.currentUrl }
    }))
  }

  /**
   * Handle pause event from WaveSurfer
   */
  handlePause() {
    this.playerPlayButtonTarget.classList.remove('hidden')
    this.playerPauseButtonTarget.classList.add('hidden')
    window.dispatchEvent(new CustomEvent('audio:playing', { 
      detail: { playing: false, url: this.currentUrl }
    }))
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
  handlePlayEvent(e) {
    console.log('MP: OMG I love this song ', e.detail.title)
    try {
      const { url, title, artist, banner } = e.detail
      this.nowPlayingTarget.textContent = title || 'Unknown Track'
      this.artistNameTarget.textContent = artist || 'Unknown Artist'

      this.updateBanner({
        // title: title || 'Unknown Track',
        // artist: artist || 'Unknown Artist',
        bannerImage: banner || '/home-banner.jpg'
      })

      if (!this.wavesurfer || this.currentUrl !== url) {
        this.currentUrl = url
        this.loadTrack(url)
      } else {
        this.togglePlayback()
      }
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
    //this.loadingContainerTarget.classList.remove('hidden')
    this.loadingProgressTarget.style.width = `${progress}%`
    
    if (progress === 100) {
      this.loadingProgressTarget.classList.add('transition-none')
      setTimeout(() => {
        this.loadingProgressTarget.style.width = '100%'
      }, 10)
    }
  }

  /**
   * Handle audio errors
   */
  handleAudioError() {
    console.error('Audio playback error')
    this.hideLoadingIndicator()
    this.playerPlayButtonTarget.classList.remove('hidden')
    this.playerPauseButtonTarget.classList.add('hidden')
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('audio:error', {
      detail: { url: this.currentUrl }
    }))
  }

  // ========================
  //  Public Methods
  // ========================

  /**
   * Toggle between play and pause states
   */
  togglePlayback() {
    try {
      this.wavesurfer.playPause()
    } catch (error) {
      console.error('Error toggling playback:', error)
      this.handleAudioError()
    }
  }

    /**
   * Load a new audio track (always starts from 0)
   * @param {string} url - Audio file URL
   */
  loadTrack(url) {
    try {
      // 1. Reset playback position before loading
      if (this.wavesurfer) {
        this.wavesurfer.pause()
        this.wavesurfer.setTime(0) // Explicitly reset to start
      }

      // 2. Update UI immediately
      this.currentTimeTarget.textContent = this.formatTime(0)
      this.durationTarget.textContent = '-0:00'
      
      // 3. Notify other components
      window.dispatchEvent(new CustomEvent('audio:changed', {
        detail: { url: url }
      }))
      
      // 4. Show loading state and load
      this.showLoadingIndicator()
      this.wavesurfer.load(url)
      
      // 5. Force-ready state if already cached
      setTimeout(() => {
        if (this.wavesurfer?.isReady) {
          this.handleTrackReady()
        }
      }, 100)
      
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
    //this.loadingContainerTarget.classList.remove('hidden')
    this.loadingProgressTarget.style.width = '0%'
    this.loadingProgressTarget.classList.remove('transition-none')
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    //this.loadingContainerTarget.classList.add('hidden')
    this.loadingProgressTarget.style.width = '0%'
    this.loadingProgressTarget.classList.remove('transition-none')
  }

  // music--player_controller.js
  updateBanner(songData) {
    console.log('MP: Thanks song, got it, showing it.')
    // Image update
    this.bannerImageTarget.src = songData.bannerImage || "/home-banner.jpg";
    
    // Overlay text
    //this.bannerTitleTarget.textContent = songData.title;
    //this.bannerSubtitleTarget.textContent = `${songData.artist} • ${songData.album}`;
    
    // Optional: Fade animation
    if (this.hasBannerImageTarget) {
      this.bannerImageTarget.style.opacity = 0
      setTimeout(() => {
        this.bannerImageTarget.style.opacity = 1
      }, 50)
    }
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

  /**
   * Check if autoplay is permitted
   */
  // get canAutoplay() {
  //   return document.body.dataset.audioAutoplay === 'true'
  // }
}