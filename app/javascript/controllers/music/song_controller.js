import { Controller } from "@hotwired/stimulus"

/**
 * Song Image Controller
 * 
 * Handles individual song album covers in the music library with:
 * - Play button state
 * - Cross-component communication via custom events
 * - Proper cleanup on disconnect
 */
export default class extends Controller {
  // ========================
  //  Configuration
  // ========================
  // Connect the player controller
  static outlets = [ "player" ]
  static targets = [
    "albumBorder",    // ▶ Play button (visible by default)
  ]

  static values = {
    url: String,      // Audio file URL (required)
    id: String,       // Unique song identifier (future-proofing)
    title: String,    // Track title for display
    artist: String,   // Artist name for display
    banner: String    // Banner art for artist - Banner art is not the album art
  }

  // ========================
  //  Lifecycle Methods
  // ========================

  /**
   * Initialize controller when connected to DOM
   * Sets up event listeners for global player events
   */
  connect() {
    if (!this.hasAlbumBorderTarget) {
      console.error('No albumBorderTarget found')
    }
    // Bind methods for proper event listener removal
    this.boundResetAlbumBorder = this.resetAlbumBorder.bind(this)
    this.boundHandleGlobalChange = this.handleGlobalChange.bind(this)

    // Listen for global player changes
    // window.addEventListener('audio:changed', this.boundResetAlbumBorder)
    // window.addEventListener('audio:playing', this.boundHandleGlobalChange)
    // window.addEventListener('audio:error', this.boundResetAlbumBorder)
  }

  /**
   * Clean up when controller is disconnected
   * Prevents memory leaks from lingering event listeners
   */
  disconnect() {
    // window.removeEventListener('audio:changed', this.boundResetAlbumBorder)
    // window.removeEventListener('audio:playing', this.boundHandleGlobalChange)
    // window.removeEventListener('audio:error', this.boundResetAlbumBorder)
  }

  // ========================
  //  Action Handlers
  // ========================

  /**
   * Handle album image clicks
   * @param {Event} e - Click event
   */
  playSong(e) {
    e.preventDefault()
    // const player = this.application.controllers.find(controller => controller.identifier === 'player')
    try {
      if (this.playerOutlet) {
        this.playerOutlet.playTrack({
          url: this.urlValue,
          title: this.titleValue || 'Unknown Track',
          artist: this.artistValue || 'Unknown Artist',
          banner: this.bannerValue || 'music_files/home-banner.jpg',
          id: this.idValue
        })
      }
      // Notify global player to load this track
      // window.dispatchEvent(new CustomEvent('audio:play', {
      //   detail: {
      //     url: this.urlValue,
      //     title: this.titleValue || 'Unknown Track',
      //     artist: this.artistValue || 'Unknown Artist',
      //     banner: this.bannerValue || 'music_files/home-banner.jpg'
      //   }
      // }))

      // Update UI immediately
      this.showRefreshState()
    } catch (error) {
      console.error('Error dispatching play event:', error)
      this.resetAlbumBorder()
    }
  }

  // ========================
  //  Event Handlers
  // ========================

  /**
   * Handle global track changes
   * Resets album border unless this is the currently playing track
   * @param {CustomEvent} e - audio:changed event
   */
  handleGlobalChange(e) {
    if (e.detail.url !== this.urlValue) {
      this.resetAlbumBorder()
    }
  }

  // ========================
  //  UI State Methods
  // ========================

  /**
   * Show refresh state (playing)
   */
  showRefreshState() {
    this.albumBorderTarget.classList.add('border-lime-500')
    this.albumBorderTarget.classList.remove('border-gray-200')
  }

  /**
   * Reset to default album border state
   */
  resetAlbumBorder() {
    this.albumBorderTarget.classList.remove('border-lime-500')
    this.albumBorderTarget.classList.add('border-gray-200')
  }

  // ========================
  //  Safety Checks
  // ========================

  /**
   * Ensure target exist before manipulation
   */
  get albumExist() {
    return this.hasAlbumBorderTarget
  }
}