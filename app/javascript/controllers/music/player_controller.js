import { Controller } from "@hotwired/stimulus"
import WaveSurfer from 'wavesurfer.js'


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
    "playlistNextButton",
    "playlistPrevButton",
    "playlistName"
  ]

  // Current track URL reference
  currentUrl = null
  currentPlaylist = null
  currentPlaylistIndex = -1
  isShuffleOn = false
  isRepeatOn = false
  userInteracted = false
  pendingAutoplay = false
  hasUiTargets = false

  /**
   * Initialize the controller when connected to DOM
   * Sets up WaveSurfer instance and all event listeners
   */
  connect() {
    // Verify UI targets
    this.hasUiTargets = this.hasNowPlayingTarget && this.hasArtistNameTarget && this.hasCurrentTimeTarget && this.hasDurationTarget
    // Set default UI state for data targets
    this.setPlayerUiDefaults()
    // Initialize WaveSurfer but don't load anything
    this.initializeWaveSurfer()
    
    // Safe event listener setup
    this.setupEventListeners()

    //this.setupAutoplayHandling()
  }
  
  setPlayerUiDefaults() {
    if (this.hasUiTargets) {
      this.nowPlayingTarget.textContent = 'Welcome back Dev3027',
      this.artistNameTarget.textContent = 'Please make me available to everyone.',
      this.currentTimeTarget.textContent = '0:00',
      this.durationTarget.textContent = '0:00'
    }
  }

  // setupAutoplayHandling() {
  //   document.addEventListener('click', () => {
  //     this.userInteracted = true
  //     if (this.pendingAutoplay && this.wavesurfer?.isReady) {
  //       this.wavesurfer.play()
  //       this.pendingAutoplay = false
  //     }
  //   }, { once: true })
  // }

  /**
   * Clean up when controller is disconnected
   * Prevents memory leaks and stops audio playback
   */
  disconnect() {
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
        backend: 'WebAudio',
        interact: true,
        cursorWidth: 1,
        plugins: []
      })
      this.setupWaveSurferEvents()
      
      // Add this to track initialization state
      this.wavesurferInitialized = true
    } catch (error) {
      console.error('WaveSurfer initialization failed:', error)
      this.wavesurferInitialized = false
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
    
    if (typeof this.handlePause === 'function') {
      window.addEventListener('audio:pause', this.handlePause.bind(this), options)
    }

    window.addEventListener('audio:set-playlist', this.handlePlaylistEvent.bind(this))
  }

  // ========================
  //  Event Handlers
  // ========================

  /**
   * Handle track loaded and ready to play
   */
  handleTrackReady() {
    try {
      // if (!this.wavesurfer || !this.wavesurfer.isReady) {
      //   console.warn('WaveSurfer not ready when handleTrackReady called')
      //   return
      // }
  
      //this.playerPlayButtonTarget.classList.add('hidden')
      //this.playerPauseButtonTarget.classList.remove('hidden')
      this.durationTarget.textContent = this.formatTime(this.wavesurfer.getDuration())
      this.updateTimeDisplay(0)
      this.hideLoadingIndicator()
      
      // Only autoplay if permitted
      // if (this.canAutoplay()) {
      //   setTimeout(() => {
      //     try {
      //       console.log('handleTrackReady, autoplay - calling play on wavesurfer.')
      //       this.wavesurfer.play()
      //     } catch (playError) {
      //       console.error('Error in autoplay:', playError)
      //       this.pendingAutoplay = true
      //     }
      //   }, 50) // Small delay to ensure everything is ready
      // } else {
      //   this.pendingAutoplay = true
      // }
    } catch (error) {
      console.error('Error handling track ready:', error)
      this.handleAudioError(error)
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
   * Play next song in playlist
   */
  playNext() {
    if (!this.currentPlaylist || this.currentPlaylist.length === 0) return
    
    let nextIndex = this.currentPlaylistIndex + 1
    
    if (this.isShuffleOn) {
      nextIndex = Math.floor(Math.random() * this.currentPlaylist.length)
    }
    
    if (nextIndex < this.currentPlaylist.length) {
      this.playPlaylistItem(nextIndex)
    } else if (this.isRepeatOn) {
      // Loop back to start if repeat is on
      this.playPlaylistItem(0)
    } else {
      // End of playlist
      this.handlePlaylistEnd()
    }
  }

  /**
   * Set the current playlist
   * @param {Array} playlist - Array of song objects
   * @param {string} playlistName - Name of the playlist
   */
  setPlaylist(playlist, playlistName) {
    this.currentPlaylist = playlist
    this.currentPlaylistIndex = -1
    if (this.hasPlaylistNameTarget) {
      this.playlistNameTarget.textContent = playlistName || 'Playlist'
    }
    this.playNext() // Start playing first song
  }

  /**
   * Play previous song in playlist
   */
  playPrevious() {
    if (!this.currentPlaylist || this.currentPlaylist.length === 0) return
    
    const prevIndex = this.currentPlaylistIndex - 1
    if (prevIndex >= 0) {
      this.playPlaylistItem(prevIndex)
    } else if (this.isRepeatOn) {
      // Loop to end if repeat is on
      this.playPlaylistItem(this.currentPlaylist.length - 1)
    }
  }

  /**
   * Play specific item from playlist
   * @param {number} index - Index in playlist array
   */
  playPlaylistItem(index) {
    if (!this.currentPlaylist || index >= this.currentPlaylist.length) return
    
    const song = this.currentPlaylist[index]
    this.currentPlaylistIndex = index
  
    // Ensure we have all required fields with defaults
    const playDetails = {
      url: song.url || '',
      title: song.title || 'Unknown Track',
      artist: song.artist || 'Unknown Artist',
      banner: song.banner || '/home-banner.jpg'
    }
  
    // Validate URL
    if (!playDetails.url) {
      console.error('No URL provided for track', song)
      this.playNext() // Skip to next track
      return
    }

    
    // Dispatch the play event
    window.dispatchEvent(new CustomEvent('audio:play', {
      detail: playDetails
    }))
  }

  /**
   * Toggle shuffle mode
   */
  toggleShuffle() {
    this.isShuffleOn = !this.isShuffleOn
    // Update UI to reflect shuffle state
  }

  /**
   * Toggle repeat mode
   */
  toggleRepeat() {
    this.isRepeatOn = !this.isRepeatOn
    // Update UI to reflect repeat state
  }

  /**
   * Handle track ending naturally
   */
  handleTrackEnd() {
    this.handlePause()
    window.dispatchEvent(new CustomEvent('audio:ended', {
      detail: { url: this.currentUrl }
    }))
    
    // Add small delay before next track to avoid race conditions
    setTimeout(() => {
      if (this.currentPlaylist) {
        this.playNext()
      }
    }, 300)
  }

  /**
 * Handle playlist completion
 */
handlePlaylistEnd() {
  
  // Reset playlist state
  this.currentPlaylist = null
  this.currentPlaylistIndex = -1
  
  // Update UI
  if (this.hasPlaylistNameTarget) {
    this.playlistNameTarget.textContent = 'Playlist completed'
  }
  
  // Notify other components
  window.dispatchEvent(new CustomEvent('audio:playlist-ended'))
  
  // Optional: Auto-hide player after delay
  setTimeout(() => {
    this.resetPlayerUI()
  }, 3000)
}

playTrack(details) {
  console.log('play track event in player controller.')
  try {
    const { url, title, artist, banner, id } = details
    this.nowPlayingTarget.textContent = title || 'Unknown Track'
    this.artistNameTarget.textContent = artist || 'Unknown Artist'
    this.currentUrl = url
    this.currentId = id
    this.updateBanner({
      bannerImage: banner || 'music_files/home-banner.jpg'
    })
    this.playerPlayButtonTarget.classList.remove('hidden')
    this.playerPauseButtonTarget.classList.add('hidden')
    window.dispatchEvent(new CustomEvent('audio:playing', { 
      detail: { playing: true, url: this.currentUrl }
    }))
  } catch (error) {
    console.error('Error handling play event:', error)
  //     this.handleAudioError()
  }
}
  /**
   * Handle external play event (from song cards)
   * @param {Event} e - Custom audio:play event
   */
  //handlePlayEvent(e) {
    // console.log('Play event received:', e.detail)
    // console.log('WaveSurfer state:', {
    //   initialized: !!this.wavesurfer,
    //   ready: this.wavesurfer?.isReady,
    //   playing: this.wavesurfer?.isPlaying()
    // })
  //   try {
  //     const { url, title, artist, banner } = e.detail
  //     this.nowPlayingTarget.textContent = title || 'Unknown Track'
  //     this.artistNameTarget.textContent = artist || 'Unknown Artist'

  //     this.updateBanner({
  //       bannerImage: banner || 'music_files/home-banner.jpg'
  //     })

  //     if (!this.wavesurfer || this.currentUrl !== url) {
  //       this.currentUrl = url
  //       this.loadTrack(url)
  //     } else {
  //       this.togglePlayback()
  //     }
  //   } catch (error) {
  //     console.error('Error handling play event:', error)
  //     this.handleAudioError()
  //   }
  // }

  // In your controller
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
    }, 500) // Match this with your CSS transition duration
  } else {
    this.loadingProgressTarget.classList.remove('transition-none')
  }
}

  /**
   * Handle playlist events
   */
  handlePlaylistEvent(e) {
    const { playlist, startIndex = 0, playlistName } = e.detail
    this.currentPlaylist = playlist
    this.currentPlaylistIndex = startIndex - 1 // Will be incremented in playNext
    
    if (this.hasPlaylistNameTarget) {
      this.playlistNameTarget.textContent = playlistName || 'Playlist'
    }
    
    // Ensure WaveSurfer is ready before proceeding
    if (!this.wavesurferInitialized) {
      setTimeout(() => this.playNext(), 100) // Retry after short delay
    } else {
      this.playNext()
    }
  }

  retryLoad() {
    if (this.currentUrl) {
      this.loadTrack(this.currentUrl)
    } else if (this.currentPlaylist && this.currentPlaylistIndex >= 0) {
      this.playPlaylistItem(this.currentPlaylistIndex)
    }
  }

  /**
   * Handle audio errors
   */
  handleAudioError(error) {
    console.error('Audio playback error:', error)
    this.hideLoadingIndicator()
    this.playerPlayButtonTarget.classList.remove('hidden')
    this.playerPauseButtonTarget.classList.add('hidden')
    
    // If we're in a playlist, try to skip to next track
    if (this.currentPlaylist) {
      setTimeout(() => {
        console.log('Attempting to skip to next track due to error')
        this.playNext()
      }, 500)
    }
    
    window.dispatchEvent(new CustomEvent('audio:error', {
      detail: { url: this.currentUrl }
    }))
  }

  // ========================
  //  Public Methods
  // ========================

  canAutoplay() {
    // Check if we've already had user interaction
    if (this.userInteracted) return true
    
    // Try to determine autoplay permission
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      return audioContext.state === 'running'
    } catch (e) {
      return false
    }
  }

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
        this.wavesurfer.setTime(0)
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
      
      // 5. Clear any previous ready handlers to prevent duplicates
      this.wavesurfer?.un('ready')
      
      // 6. Load the track with proper ready handler
      this.wavesurfer.load(url)
      
      // 7. Set up a one-time ready handler
      this.wavesurfer.once('ready', () => {
        this.handleTrackReady()
        
        // Only autoplay if user has interacted or we have permission
        if (this.canAutoplay()) {
          this.wavesurfer.play()
        } else {
          // Store that we want to autoplay when interaction occurs
          this.pendingAutoplay = true
        }
      })
      
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
    // Image update
    this.bannerImageTarget.src = songData.bannerImage || "music_files/home-banner.jpg";
    
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
  //  Getters
  // ========================

  get verifyUiTargets() {
    if (
      this.hasNowPlayingTarget &&
      this.hasArtistNameTarget &&
      this.hasCurrentTimeTarget &&
      this.hasDurationTarget
      ) { hasUiTargets = true }
  }

  /**
   * Check if autoplay is permitted
   */
  // get canAutoplay() {
  //   return document.body.dataset.audioAutoplay === 'true'
  // }
}