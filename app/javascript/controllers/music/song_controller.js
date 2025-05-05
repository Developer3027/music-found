import { Controller } from "@hotwired/stimulus"

/**
 * Song Card Controller
 * 
 * Handles individual song cards in the music library with:
 * - Play/refresh button states
 * - Cross-component communication via custom events
 * - Proper cleanup on disconnect
 */
export default class extends Controller {
  // ========================
  //  Configuration
  // ========================

  static targets = [
    "playButton",    // ▶ Play button (visible by default)
    "refreshButton"  // 🔄 Refresh/loading button (hidden by default)
  ]

  static values = {
    url: String,    // Audio file URL (required)
    id: String,     // Unique song identifier (future-proofing)
    title: String,  // Track title for display
    artist: String  // Artist name for display
  }

  // ========================
  //  Lifecycle Methods
  // ========================

  /**
   * Initialize controller when connected to DOM
   * Sets up event listeners for global player events
   */
  connect() {
    // Bind methods for proper event listener removal
    this.boundResetIcons = this.resetIcons.bind(this)
    this.boundHandleGlobalChange = this.handleGlobalChange.bind(this)

    // Listen for global player changes
    window.addEventListener('audio:changed', this.boundResetIcons)
    window.addEventListener('audio:playing', this.boundHandleGlobalChange)
    window.addEventListener('audio:error', this.boundResetIcons)
  }

  /**
   * Clean up when controller is disconnected
   * Prevents memory leaks from lingering event listeners
   */
  disconnect() {
    window.removeEventListener('audio:changed', this.boundResetIcons)
    window.removeEventListener('audio:playing', this.boundHandleGlobalChange)
    window.removeEventListener('audio:error', this.boundResetIcons)
  }

  // ========================
  //  Action Handlers
  // ========================

  /**
   * Handle play button clicks
   * @param {Event} e - Click event
   */
  play(e) {
    e.preventDefault()

    try {
      // Notify global player to load this track
      window.dispatchEvent(new CustomEvent('audio:play', {
        detail: {
          url: this.urlValue,
          title: this.titleValue || 'Unknown Track',
          artist: this.artistValue || 'Unknown Artist',
          id: this.idValue
        }
      }))

      // Update UI immediately
      this.showRefreshState()
    } catch (error) {
      console.error('Error dispatching play event:', error)
      this.resetIcons()
    }
  }

  // ========================
  //  Event Handlers
  // ========================

  /**
   * Handle global track changes
   * Resets icons unless this is the currently playing track
   * @param {CustomEvent} e - audio:changed event
   */
  handleGlobalChange(e) {
    if (e.detail.url !== this.urlValue) {
      this.resetIcons()
    }
  }

  // ========================
  //  UI State Methods
  // ========================

  /**
   * Show refresh state (loading/playing)
   */
  showRefreshState() {
    this.playButtonTarget.classList.add('hidden')
    this.refreshButtonTarget.classList.remove('hidden')
  }

  /**
   * Reset to default play button state
   */
  resetIcons() {
    this.playButtonTarget.classList.remove('hidden')
    this.refreshButtonTarget.classList.add('hidden')
  }

  // ========================
  //  Safety Checks
  // ========================

  /**
   * Ensure targets exist before manipulation
   */
  get iconsExist() {
    return this.hasPlayButtonTarget && this.hasRefreshButtonTarget
  }
}