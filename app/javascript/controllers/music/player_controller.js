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
   * Controller Values
   * @type {Object}
   */
  static values = {
    autoAdvance: { type: Boolean, default: false },
  }


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
    this.initializeWaveSurfer();
    this.setupEventListeners();
  
    // 1. Initialize playback state from localStorage
    const autoAdvance = localStorage.getItem('playerAutoAdvance') === 'true';
    this.autoAdvanceValue = autoAdvance;

    const playOnLoad = localStorage.getItem('audioPlayOnLoad') === 'true';
    this.playOnLoadValue = playOnLoad;
    
    // 2. Initialize banner state - ensure default banner is set if none exists
    if (!localStorage.getItem('currentBanner')) {
      localStorage.setItem('currentBanner', 'music_files/home-banner.jpg');
    }
    
    // 3. Initialize queue state
    this.currentQueue = [];
    this.currentIndex = -1;
    this.currentUrl = null;
  
    // 4. Sync initial states
    document.dispatchEvent(new CustomEvent("player:auto-advance:changed", {
      detail: { enabled: this.autoAdvanceValue }
    }));

    document.dispatchEvent(new CustomEvent("player:play-on-load:changed", {
      detail: { enabled: this.playOnLoadValue }
    }));
  
    // 5. Queue listener remains important!
    document.addEventListener("player:queue:updated", (event) => {
      
      // Improved queue update with validation
      this.currentQueue = Array.isArray(event.detail.queue) ? event.detail.queue : [];
      
      // More robust index finding
      this.currentIndex = this.currentQueue.findIndex(song => {
        return song?.url === this.currentUrl;
      });
    });
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
    // Existing listeners
    window.addEventListener("player:play-requested", this.handlePlayRequest.bind(this));
    document.addEventListener("player:play", () => this.wavesurfer.play());
    document.addEventListener("player:pause", () => this.wavesurfer.pause());

    document.addEventListener("player:auto-advance:changed", (event) => {
      this.autoAdvanceValue = event.detail.enabled
    })

    document.addEventListener("player:play-on-load:changed", (event) => {
      this.playOnLoadValue = event.detail.enabled
    })
  
    // Add the queue update listener
    document.addEventListener("player:queue:updated", (event) => {
      this.currentQueue = event.detail.queue;
      
      // Sync index if we're already playing a song
      if (this.currentUrl) {
        const currentSong = this.currentQueue.find(song => song.url === this.currentUrl);
        if (currentSong) {
          this.setCurrentIndex(currentSong.id);
        }
      }
    });
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
    this.resetPlayback()
    window.dispatchEvent(new CustomEvent("audio:ended", {
      detail: { url: this.currentUrl }
    }))

    if (this.autoAdvanceValue && this.currentQueue.length > 0) {
      this.playNext()
    }
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
    try {
      const { id, url, title, artist, banner, bannerVideo, animatedBannersEnabled, playOnLoad = false, updateBanner } = e.detail

      // DEBUG: Log received event data
      console.log("🎵 PLAYER: Received player:play-requested event")
      console.log("🎵 PLAYER: Event detail received:", e.detail)
      console.log("🎵 PLAYER: Destructured values:", {
        id, url, title, artist, banner, playOnLoad, updateBanner
      })
      console.log("🎵 PLAYER: Banner value analysis:", {
        bannerRaw: banner,
        bannerType: typeof banner,
        bannerEmpty: banner === "",
        bannerUndefined: banner === undefined,
        bannerNull: banner === null
      })

      this.setCurrentIndex(id)

      if (updateBanner !== false) {
        console.log("🎵 PLAYER: About to call updateBanner with:", { banner, bannerVideo, title, artist })
        console.log("🎵 PLAYER: Banner being passed to updateBanner:", banner)
        console.log("🎵 PLAYER: Banner video being passed to updateBanner:", bannerVideo)
        this.updateBanner({ banner, bannerVideo, title, artist, animatedBannersEnabled })
      } else {
        console.log("🎵 PLAYER: Skipping banner update (updateBanner === false)")
      }
      
      if (!this.wavesurfer || this.currentUrl !== url) {
        this.loadTrack(url, playOnLoad)
      } else {
        this.togglePlayback()
      }
    } catch (error) {
      console.error("Error handling play event:", error)
      this.handleAudioError()
    }
  }

  /**
   * Dispatch play request for a song
   * @param {Object} song - Song object
   */
  dispatchPlayRequest(song) {
    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: {
        url: song.url,
        title: song.title,
        artist: song.artist,
        banner: song.banner,
        bannerVideo: song.bannerVideo,
        autoplay: true,
        updateBanner: true
      }
    }))
  }

  /**
   * Play the next song in queue
   */
  playNext() {
    if (this.currentQueue.length === 0) return
    
    this.currentIndex = (this.currentIndex + 1) % this.currentQueue.length
    const nextSong = this.currentQueue[this.currentIndex]
    this.playSongFromQueue(nextSong)
  }

  playPrevious() {
    if (this.currentQueue.length === 0) return
    
    this.currentIndex = (this.currentIndex - 1 + this.currentQueue.length) % this.currentQueue.length
    const prevSong = this.currentQueue[this.currentIndex]
    this.playSongFromQueue(prevSong)
  }

  playSongFromQueue(song) {
    try {
      // Update banner and global state for auto-advance
      this.updateBanner({
        banner: song.banner,
        bannerVideo: song.bannerVideo,
        title: song.title,
        artist: song.artist
      })
      
      this.loadTrack(song.url, true) // Always autoplay when advancing
    } catch (error) {
      console.error("Error playing from queue:", error)
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
   * @param {boolean} [playOnLoad=false] - Whether to playOnLoad when loaded
   */
  loadTrack(url, playOnLoad = false) {
    try {
      this.resetPlayback()
      this.showLoadingIndicator()
      this.dispatchTrackChange(url)
      
      this.wavesurfer.load(url)
      this.setupPlayOnLoad(playOnLoad)
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
   * Configure playOnLoad if requested
   * @param {boolean} playOnLoad - Whether to playOnLoad
   */
  setupPlayOnLoad(playOnLoad) {
    if (playOnLoad) {
      this.wavesurfer.once("ready", () => {
        this.wavesurfer.play()
      })
    }
  }

  /**
   * Toggle autoAdvance state
   */
  toggleAutoAdvance() {
    this.autoAdvanceValue = !this.autoAdvanceValue
    this.updateAutoAdvanceUI()
    
    // Dispatch event to inform other components
    document.dispatchEvent(new CustomEvent("player:auto-advance:changed", {
      detail: { enabled: this.autoAdvanceValue }
    }))
  }

  // Set the current index in the queue
  // Use selected song ID to relate to position in queue
  setCurrentIndex(songId) {
    if (!this.currentQueue || this.currentQueue.length === 0) {
      console.warn("Cannot set index for empty queue");
      this.currentIndex = -1;
      return;
    };
    
    // Find the index by matching ID
    const index = this.currentQueue.findIndex(song => song.id.toString() === songId.toString());
    
    if (index >= 0) {
      this.currentIndex = index;
    } else {
      console.warn("Song ID not found in queue:", songId);
      this.currentIndex = 0; // Fallback to first song
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
  updateBanner({ banner, bannerVideo, title, artist, animatedBannersEnabled }) {
    // DEBUG: Log input parameters
    console.log("🎵 PLAYER: updateBanner called with:", { banner, bannerVideo, title, artist })
    console.log("🎵 PLAYER: Banner parameter analysis:", {
      bannerRaw: banner,
      bannerVideoRaw: bannerVideo,
      bannerType: typeof banner,
      bannerVideoType: typeof bannerVideo,
      bannerTruthy: !!banner,
      bannerVideoTruthy: !!bannerVideo,
      bannerFallbackTriggered: !banner
    })
    
    // Update global banner state for future comparisons
    const newBanner = banner || "music_files/home-banner.jpg"
    console.log("🎵 PLAYER: newBanner resolved to:", newBanner)
    localStorage.setItem("currentBanner", newBanner)
    
    const bannerEventDetail = {
      image: banner, // Pass the actual banner (could be null for fallback)
      video: bannerVideo, // Pass the banner video URL
      title: title || "Unknown Track",
      subtitle: artist || "Unknown Artist",
      animatedBannersEnabled: animatedBannersEnabled
    }
    
    console.log("🎵 PLAYER: bannerEventDetail.image being sent:", bannerEventDetail.image)
    console.log("🎵 PLAYER: bannerEventDetail.video being sent:", bannerEventDetail.video)
    console.log("🎵 PLAYER: Dispatching music:banner:update with detail:", bannerEventDetail)
    
    document.dispatchEvent(new CustomEvent("music:banner:update", {
      detail: bannerEventDetail
    }))
  }

  /**
   * Update autoplay button UI
   */
  updateAutoAdvanceUI() {
    const btn = this.element.querySelector("#autoAdvance-toggle")
    if (this.autoAdvanceValue) {
      btn.classList.add("text-green-400")
      btn.classList.remove("text-gray-400")
    } else {
      btn.classList.add("text-gray-400")
      btn.classList.remove("text-green-400")
    }
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

  /**
   * Set the current play queue
   * @param {Array} queue - Array of song objects
   */
  setQueue(queue) {
    this.currentQueue = queue
    this.currentIndex = queue.findIndex(song => song.url === this.currentUrl)
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