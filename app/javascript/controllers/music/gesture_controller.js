import GestureController from "controllers/gesture_controller"

/**
 * Music-Specific Gesture Controller
 * 
 * Extends the base gesture controller with music player functionality including:
 * - Music player gesture zones and regions
 * - Integration with existing player controller methods
 * - Music-specific gesture mappings (swipe for track navigation)
 * - Event system compatibility with current music player events
 * - Gesture threshold configuration optimized for music interactions
 * - Player state-aware gesture behavior
 */
export default class extends GestureController {
  // ========================
  // Configuration
  // ========================

  /**
   * Music-specific controller values
   */
  static values = {
    ...GestureController.values,
    
    // Music-specific gesture zones
    playerZone: { type: String, default: "full" },        // "full", "controls", "waveform-safe"
    bannerZone: { type: String, default: "enabled" },     // "enabled", "disabled"
    
    // Music gesture mappings
    swipeLeftAction: { type: String, default: "next" },   // "next", "disabled"
    swipeRightAction: { type: String, default: "prev" },  // "prev", "disabled"
    swipeUpAction: { type: String, default: "expand" },   // "expand", "disabled"
    swipeDownAction: { type: String, default: "minimize" }, // "minimize", "disabled"
    tapAction: { type: String, default: "toggle" },       // "toggle", "disabled"
    longPressAction: { type: String, default: "menu" },   // "menu", "disabled"
    
    // Advanced gesture mappings
    pinchInAction: { type: String, default: "volume_down" }, // "volume_down", "disabled"
    pinchOutAction: { type: String, default: "volume_up" },  // "volume_up", "disabled"
    twoFingerSwipeUpAction: { type: String, default: "queue_show" }, // "queue_show", "disabled"
    twoFingerSwipeDownAction: { type: String, default: "queue_hide" }, // "queue_hide", "disabled"
    doubleTapAction: { type: String, default: "favorite" }, // "favorite", "disabled"
    tripleTapAction: { type: String, default: "shuffle" },  // "shuffle", "disabled"
    edgeLeftAction: { type: String, default: "playlists" }, // "playlists", "disabled"
    edgeRightAction: { type: String, default: "settings" }, // "settings", "disabled"
    
    // Music-specific thresholds
    trackChangeThreshold: { type: Number, default: 80 },  // Distance required for track change
    playerExpandThreshold: { type: Number, default: 60 }, // Distance for expand/minimize
    volumeChangeThreshold: { type: Number, default: 15 }, // Minimum pinch distance for volume
    fastSwipeVelocity: { type: Number, default: 0.8 },   // Velocity threshold for fast actions
    slowSwipeVelocity: { type: Number, default: 0.2 }    // Velocity threshold for precise control
  }

  /**
   * Music player state tracking
   */
  musicState = {
    isPlaying: false,
    currentTrack: null,
    hasQueue: false,
    playerExpanded: false,
    bannerHeight: 'default',
    volume: 1.0,
    isShuffle: false,
    queueVisible: false,
    currentFavorites: [],
    gesturePreferences: {
      volumeSensitivity: 1.0,
      swipeVelocitySensitivity: 1.0,
      enableAdvancedGestures: true
    }
  }

  /**
   * Gesture zones configuration
   */
  gestureZones = {
    player: null,
    banner: null,
    controls: null,
    waveform: null
  }

  // ========================
  // Lifecycle Methods
  // ========================

  /**
   * Initialize music gesture controller
   */
  connect() {
    // Call parent connect first
    super.connect()
    
    // Set up music-specific configuration
    this.setupMusicGestures()
    this.setupMusicEventListeners()
    this.identifyGestureZones()
    
    // Load gesture preferences and initialize advanced features
    this.loadGesturePreferences()
    this.initializeAdvancedFeatures()
    
    // DEBUG: Initialize queue state - assume queue exists for testing
    console.log("🎵✋ MUSIC GESTURE DEBUG: Initializing queue state")
    this.musicState.hasQueue = true // Enable gestures for testing
    console.log("🎵✋ MUSIC GESTURE DEBUG: musicState.hasQueue set to:", this.musicState.hasQueue)
    
    console.log("🎵✋ MUSIC GESTURE: Music gesture controller connected with advanced gestures")
  }

  /**
   * Clean up music-specific listeners
   */
  disconnect() {
    this.removeMusicEventListeners()
    super.disconnect()
    
    console.log("🎵✋ MUSIC GESTURE: Music gesture controller disconnected")
  }

  // ========================
  // Music-Specific Setup
  // ========================

  /**
   * Configure gestures for music player functionality
   */
  setupMusicGestures() {
    // Override base gesture thresholds with music-optimized values
    this.updateConfig({
      swipeThreshold: this.trackChangeThresholdValue,
      velocityThreshold: 0.4, // Slightly higher for intentional music navigation
      longPressThreshold: 600, // Longer for music context menu
      tapThreshold: 15, // More forgiving for music controls
      pinchThreshold: this.volumeChangeThresholdValue,
      multiTapTimeout: 400, // Slightly longer for music multi-tap
      twoFingerThreshold: this.trackChangeThresholdValue / 2
    })
  }

  /**
   * Initialize advanced gesture features
   */
  initializeAdvancedFeatures() {
    // Set up adaptive thresholds based on device
    this.setupAdaptiveThresholds()
    
    // Initialize debounced/throttled functions for performance
    this.setupPerformanceOptimizations()
    
    // Set up gesture conflict resolution
    this.setupGestureConflictResolution()
  }

  /**
   * Setup adaptive thresholds based on device characteristics
   */
  setupAdaptiveThresholds() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const devicePixelRatio = window.devicePixelRatio || 1
    
    // Adjust thresholds based on screen size and pixel density
    const scaleFactor = Math.min(screenWidth / 375, screenHeight / 667) // Base on iPhone 6/7/8 size
    const densityFactor = Math.min(devicePixelRatio / 2, 1.5) // Account for high DPI screens
    
    const adaptiveConfig = {
      swipeThreshold: Math.max(30, this.trackChangeThresholdValue * scaleFactor),
      pinchThreshold: Math.max(8, this.volumeChangeThresholdValue * densityFactor),
      twoFingerThreshold: Math.max(25, this.twoFingerThresholdValue * scaleFactor),
      edgeThreshold: Math.max(20, this.edgeThresholdValue * scaleFactor)
    }
    
    this.updateConfig(adaptiveConfig)
    
    console.log("🎵✋ ADAPTIVE: Adjusted thresholds for device", {
      screenSize: `${screenWidth}x${screenHeight}`,
      pixelRatio: devicePixelRatio,
      scaleFactor,
      densityFactor,
      adaptiveConfig
    })
  }

  /**
   * Setup performance optimizations with debouncing and throttling
   */
  setupPerformanceOptimizations() {
    // Debounce volume adjustments to prevent too frequent changes
    this.debouncedVolumeAdjust = this.debounce(this.adjustVolume.bind(this), 50)
    
    // Throttle visual feedback updates to maintain 60fps
    this.throttledVisualFeedback = this.throttle(this.updateVolumeVisualFeedback.bind(this), 16)
    
    // Throttle preference saves to avoid excessive localStorage writes
    this.throttledPreferenceSave = this.throttle(this.saveGesturePreferences.bind(this), 1000)
  }

  /**
   * Setup gesture conflict resolution
   */
  setupGestureConflictResolution() {
    // Priority order for conflicting gestures (higher number = higher priority)
    this.gesturePriorities = {
      'pinch': 10,          // Highest priority - volume control
      'twoFingerSwipe': 8,  // High priority - advanced navigation
      'swipe': 6,           // Medium priority - basic navigation
      'longPress': 4,       // Lower priority - context menu
      'multiTap': 3,        // Lower priority - special actions
      'tap': 2,             // Low priority - basic actions
      'edge': 1             // Lowest priority - quick access
    }
  }

  /**
   * Debounce function for performance optimization
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId
    return function(...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }

  /**
   * Throttle function for performance optimization
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * Set up music player event listeners
   */
  setupMusicEventListeners() {
    // Listen for player state changes
    document.addEventListener("player:state:changed", this.handlePlayerStateChange.bind(this))
    document.addEventListener("audio:changed", this.handleTrackChange.bind(this))
    document.addEventListener("player:queue:updated", this.handleQueueUpdate.bind(this))
    
    // Listen for banner state changes
    document.addEventListener("music:banner:update", this.handleBannerUpdate.bind(this))
    document.addEventListener("banner:height:changed", this.handleBannerHeightChange.bind(this))
    
    // Listen for our own gesture events to handle music actions
    this.element.addEventListener("gesture:swipe", this.handleMusicSwipe.bind(this))
    this.element.addEventListener("gesture:tap", this.handleMusicTap.bind(this))
    this.element.addEventListener("gesture:longpress", this.handleMusicLongPress.bind(this))
    
    // Advanced gesture event listeners
    this.element.addEventListener("gesture:pinchstart", this.handlePinchStart.bind(this))
    this.element.addEventListener("gesture:pinchmove", this.handlePinchMove.bind(this))
    this.element.addEventListener("gesture:pinchend", this.handlePinchEnd.bind(this))
    this.element.addEventListener("gesture:twofingerswipe", this.handleTwoFingerSwipe.bind(this))
    this.element.addEventListener("gesture:multitap", this.handleMultiTap.bind(this))
    this.element.addEventListener("gesture:edgetouch", this.handleEdgeGesture.bind(this))
  }

  /**
   * Remove music event listeners
   */
  removeMusicEventListeners() {
    document.removeEventListener("player:state:changed", this.handlePlayerStateChange.bind(this))
    document.removeEventListener("audio:changed", this.handleTrackChange.bind(this))
    document.removeEventListener("player:queue:updated", this.handleQueueUpdate.bind(this))
    document.removeEventListener("music:banner:update", this.handleBannerUpdate.bind(this))
    document.removeEventListener("banner:height:changed", this.handleBannerHeightChange.bind(this))
    
    this.element.removeEventListener("gesture:swipe", this.handleMusicSwipe.bind(this))
    this.element.removeEventListener("gesture:tap", this.handleMusicTap.bind(this))
    this.element.removeEventListener("gesture:longpress", this.handleMusicLongPress.bind(this))
    
    // Remove advanced gesture listeners
    this.element.removeEventListener("gesture:pinchstart", this.handlePinchStart.bind(this))
    this.element.removeEventListener("gesture:pinchmove", this.handlePinchMove.bind(this))
    this.element.removeEventListener("gesture:pinchend", this.handlePinchEnd.bind(this))
    this.element.removeEventListener("gesture:twofingerswipe", this.handleTwoFingerSwipe.bind(this))
    this.element.removeEventListener("gesture:multitap", this.handleMultiTap.bind(this))
    this.element.removeEventListener("gesture:edgetouch", this.handleEdgeGesture.bind(this))
  }

  /**
   * Identify and cache gesture zone elements
   */
  identifyGestureZones() {
    // Find common music player elements
    this.gestureZones.player = this.element.closest('[data-controller*="music--player"]') || this.element
    this.gestureZones.banner = document.querySelector('[data-controller*="music--banner"]')
    this.gestureZones.controls = this.element.querySelector('[data-music-controls]') || 
                                 this.element.querySelector('.player-controls')
    this.gestureZones.waveform = document.querySelector('[data-music--player-target="waveform"]')
  }

  // ========================
  // Music State Management
  // ========================

  /**
   * Handle player state changes
   * @param {CustomEvent} event - Player state change event
   */
  handlePlayerStateChange(event) {
    const { playing, url } = event.detail
    
    this.musicState.isPlaying = playing
    this.musicState.currentTrack = url
    
    // Adjust gesture sensitivity based on play state
    if (playing) {
      this.updateConfig({
        velocityThreshold: 0.3 // More sensitive when playing
      })
    } else {
      this.updateConfig({
        velocityThreshold: 0.4 // Less sensitive when paused
      })
    }
  }

  /**
   * Handle track changes
   * @param {CustomEvent} event - Track change event
   */
  handleTrackChange(event) {
    const { url } = event.detail
    this.musicState.currentTrack = url
  }

  /**
   * Handle queue updates
   * @param {CustomEvent} event - Queue update event
   */
  handleQueueUpdate(event) {
    const { queue } = event.detail
    const hasQueue = Array.isArray(queue) && queue.length > 0
    this.musicState.hasQueue = hasQueue
    
    console.log("🎵✋ MUSIC GESTURE DEBUG: Queue updated - hasQueue:", hasQueue, "queue length:", queue?.length)
    
    // Enable/disable navigation gestures based on queue availability
    if (!this.musicState.hasQueue) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Disabling swipe gestures - no queue")
      this.swipeLeftActionValue = "disabled"
      this.swipeRightActionValue = "disabled"
    } else {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Enabling swipe gestures - queue available")
      // Restore default actions
      this.swipeLeftActionValue = "next"
      this.swipeRightActionValue = "prev"
    }
  }

  /**
   * Handle banner updates
   * @param {CustomEvent} event - Banner update event
   */
  handleBannerUpdate(event) {
    const { image, video, title, subtitle } = event.detail
    // Banner state tracking for gesture context
  }

  /**
   * Handle banner height changes
   * @param {CustomEvent} event - Banner height change event
   */
  handleBannerHeightChange(event) {
    const { height } = event.detail
    this.musicState.bannerHeight = height
    this.musicState.playerExpanded = height === 'expanded'
  }

  // ========================
  // Enhanced Gesture Prevention
  // ========================

  /**
   * Enhanced gesture prevention for music-specific elements
   * @param {Element} element - Target element
   * @returns {boolean} True if gestures should be prevented
   */
  shouldPreventGesture(element) {
    // Call parent method first
    if (super.shouldPreventGesture(element)) {
      return true
    }

    // Music-specific prevention rules
    
    // Always prevent on waveform if player zone is set to waveform-safe
    if (this.playerZoneValue === "waveform-safe" && this.isWaveSurferElement(element)) {
      return true
    }

    // Prevent on control buttons unless specifically allowed
    if (this.isControlElement(element) && this.playerZoneValue === "banner-only") {
      return true
    }

    // Check banner zone settings
    if (this.bannerZoneValue === "disabled" && this.isBannerElement(element)) {
      return true
    }

    return false
  }

  /**
   * Check if element is a music control element
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is a control
   */
  isControlElement(element) {
    // Check for control-specific attributes and classes
    const controlSelectors = [
      '[data-music-control]',
      '[data-controller*="play-pause"]',
      '[data-controller*="music"]',
      '.player-control',
      '.music-button'
    ]

    return controlSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    )
  }

  /**
   * Check if element is part of the banner
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is part of banner
   */
  isBannerElement(element) {
    return element.closest('[data-controller*="banner"]') !== null
  }

  /**
   * Enhanced banner element detection for debugging
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is banner-related
   */
  isBannerRelatedElement(element) {
    // Check for banner controller
    if (element.closest('[data-controller*="banner"]')) return true
    
    // Check for banner target attributes
    if (element.hasAttribute('data-music--banner-target')) return true
    
    // Check for banner-specific classes or IDs
    const bannerSelectors = [
      '[data-music--banner-target]',
      '.banner',
      '#banner-height-toggle',
      'video[data-music--banner-target="video"]',
      'img[data-music--banner-target="image"]',
      '[data-music--banner-target="overlay"]',
      '[data-music--banner-target="container"]'
    ]
    
    return bannerSelectors.some(selector =>
      element.matches(selector) || element.closest(selector)
    )
  }

  // ========================
  // Music Gesture Handlers
  // ========================

  /**
   * Handle swipe gestures with music-specific actions
   * @param {CustomEvent} event - Swipe gesture event
   */
  handleMusicSwipe(event) {
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleMusicSwipe called with:", event.detail)
    
    const { direction, distance, velocity, edgeDetected } = event.detail
    
    console.log("🎵✋ MUSIC GESTURE DEBUG: Extracted values:", { direction, distance, velocity, edgeDetected })
    
    // PRIORITY FIX: Check if this is an edge gesture that should be prevented for track navigation
    if (edgeDetected && (direction === 'left' || direction === 'right')) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Edge detected - checking if we should prioritize track navigation")
      
      // Prioritize track navigation over edge gestures if we have a queue and sufficient distance
      const hasTrackNavigation = this.musicState.hasQueue &&
                                 ((direction === 'left' && this.swipeLeftActionValue === 'next') ||
                                  (direction === 'right' && this.swipeRightActionValue === 'prev'))
      
      const sufficientDistance = distance >= (this.trackChangeThresholdValue * 1.2) // 20% higher threshold for edge conflicts
      
      if (hasTrackNavigation && sufficientDistance) {
        console.log("🎵✋ MUSIC GESTURE DEBUG: OVERRIDE: Track navigation takes priority over edge gesture")
        // Continue with track navigation - don't return early
      } else {
        console.log("🎵✋ MUSIC GESTURE DEBUG: Edge gesture takes priority - blocking track navigation")
        return // Let edge gesture handler take over
      }
    }
    
    // Check if gesture meets music-specific thresholds
    const isValid = this.isValidMusicGesture(direction, distance, velocity)
    console.log("🎵✋ MUSIC GESTURE DEBUG: Is valid music gesture:", isValid)
    
    if (!isValid) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Gesture REJECTED - doesn't meet thresholds")
      return
    }

    // VELOCITY FIX: Determine gesture type based on velocity - but prioritize track navigation
    const isFastSwipe = velocity >= this.fastSwipeVelocityValue
    const isSlowSwipe = velocity <= this.slowSwipeVelocityValue
    const isMediumSwipe = !isFastSwipe && !isSlowSwipe
    
    console.log("🎵✋ MUSIC GESTURE DEBUG: Processing direction:", direction, {
      isFastSwipe,
      isSlowSwipe,
      isMediumSwipe,
      velocity,
      fastThreshold: this.fastSwipeVelocityValue
    })

    // PRIORITY: Always handle track navigation first for horizontal swipes if queue exists
    const canNavigateTracks = this.musicState.hasQueue && (direction === 'left' || direction === 'right')
    
    if (canNavigateTracks) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Track navigation available - processing as priority")
    }

    switch (direction) {
      case 'left':
        console.log("🎵✋ MUSIC GESTURE DEBUG: Calling handleSwipeLeft")
        this.handleSwipeLeft(event, { isFastSwipe, isSlowSwipe, isMediumSwipe })
        break
      case 'right':
        console.log("🎵✋ MUSIC GESTURE DEBUG: Calling handleSwipeRight")
        this.handleSwipeRight(event, { isFastSwipe, isSlowSwipe, isMediumSwipe })
        break
      case 'up':
        this.handleSwipeUp(event, { isFastSwipe, isSlowSwipe, isMediumSwipe })
        break
      case 'down':
        this.handleSwipeDown(event, { isFastSwipe, isSlowSwipe, isMediumSwipe })
        break
    }
  }

  /**
   * Handle left swipe (next track)
   * @param {CustomEvent} event - Swipe event
   */
  handleSwipeLeft(event, { isFastSwipe, isSlowSwipe, isMediumSwipe } = {}) {
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleSwipeLeft - swipeLeftActionValue:", this.swipeLeftActionValue)
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleSwipeLeft - musicState.hasQueue:", this.musicState.hasQueue)
    
    if (this.swipeLeftActionValue === "disabled") {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Swipe left is DISABLED")
      return
    }

    if (this.swipeLeftActionValue === "next" && this.musicState.hasQueue) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Dispatching NEXT track request")
      
      this.showGestureVisualFeedback('next', isFastSwipe)
      
      this.dispatchMusicAction('music:gesture:next', {
        gestureType: 'swipe',
        direction: 'left',
        velocity: event.detail.velocity,
        isFastSwipe,
        isSlowSwipe,
        isMediumSwipe,
        originalEvent: event.detail
      })
      
      // MOBILE FIX: Enhanced event dispatching with multiple fallbacks
      console.log("🎵✋ MUSIC GESTURE DEBUG: About to dispatch player:next:requested")
      
      // Primary dispatch
      document.dispatchEvent(new CustomEvent("player:next:requested", {
        bubbles: true,
        cancelable: true,
        detail: { source: 'gesture', velocity: event.detail.velocity, timestamp: Date.now() }
      }))
      
      // Alternative dispatch patterns for better mobile compatibility
      document.dispatchEvent(new CustomEvent("player:next", {
        bubbles: true,
        detail: { source: 'gesture', velocity: event.detail.velocity }
      }))
      
      // Try dispatching on player element directly
      const playerElement = document.querySelector('[data-controller*="music--player"]')
      if (playerElement) {
        console.log("🎵✋ MOBILE FIX: Also dispatching on player element")
        playerElement.dispatchEvent(new CustomEvent("player:next:requested", {
          bubbles: true,
          detail: { source: 'gesture', velocity: event.detail.velocity }
        }))
      }
      
      console.log("🎵✋ MUSIC GESTURE DEBUG: All next track events dispatched")
    } else {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Swipe left not processed - action:", this.swipeLeftActionValue, "hasQueue:", this.musicState.hasQueue)
    }
  }

  /**
   * Handle right swipe (previous track)
   * @param {CustomEvent} event - Swipe event
   */
  handleSwipeRight(event, { isFastSwipe, isSlowSwipe, isMediumSwipe } = {}) {
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleSwipeRight - swipeRightActionValue:", this.swipeRightActionValue)
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleSwipeRight - musicState.hasQueue:", this.musicState.hasQueue)
    
    if (this.swipeRightActionValue === "disabled") {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Swipe right is DISABLED")
      return
    }

    if (this.swipeRightActionValue === "prev" && this.musicState.hasQueue) {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Dispatching PREVIOUS track request")
      
      this.showGestureVisualFeedback('previous', isFastSwipe)
      
      this.dispatchMusicAction('music:gesture:prev', {
        gestureType: 'swipe',
        direction: 'right',
        velocity: event.detail.velocity,
        isFastSwipe,
        isSlowSwipe,
        isMediumSwipe,
        originalEvent: event.detail
      })
      
      // MOBILE FIX: Enhanced event dispatching with multiple fallbacks
      console.log("🎵✋ MUSIC GESTURE DEBUG: About to dispatch player:prev:requested")
      
      // Primary dispatch
      document.dispatchEvent(new CustomEvent("player:prev:requested", {
        bubbles: true,
        cancelable: true,
        detail: { source: 'gesture', velocity: event.detail.velocity, timestamp: Date.now() }
      }))
      
      // Alternative dispatch patterns for better mobile compatibility
      document.dispatchEvent(new CustomEvent("player:prev", {
        bubbles: true,
        detail: { source: 'gesture', velocity: event.detail.velocity }
      }))
      
      // Try dispatching on player element directly
      const playerElement = document.querySelector('[data-controller*="music--player"]')
      if (playerElement) {
        console.log("🎵✋ MOBILE FIX: Also dispatching on player element")
        playerElement.dispatchEvent(new CustomEvent("player:prev:requested", {
          bubbles: true,
          detail: { source: 'gesture', velocity: event.detail.velocity }
        }))
      }
      
      console.log("🎵✋ MUSIC GESTURE DEBUG: All previous track events dispatched")
    } else {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Swipe right not processed - action:", this.swipeRightActionValue, "hasQueue:", this.musicState.hasQueue)
    }
  }

  /**
   * Handle up swipe (expand player)
   * @param {CustomEvent} event - Swipe event
   */
  handleSwipeUp(event) {
    if (this.swipeUpActionValue === "disabled") return

    if (this.swipeUpActionValue === "expand" && !this.musicState.playerExpanded) {
      this.dispatchMusicAction('music:gesture:expand', {
        gestureType: 'swipe',
        direction: 'up',
        originalEvent: event.detail
      })
      
      // Dispatch banner height change event
      document.dispatchEvent(new CustomEvent("banner:height:toggle:requested", {
        detail: { 
          action: 'expand',
          source: 'gesture'
        }
      }))
    }
  }

  /**
   * Handle down swipe (minimize player)
   * @param {CustomEvent} event - Swipe event
   */
  handleSwipeDown(event) {
    if (this.swipeDownActionValue === "disabled") return

    if (this.swipeDownActionValue === "minimize" && this.musicState.playerExpanded) {
      this.dispatchMusicAction('music:gesture:minimize', {
        gestureType: 'swipe',
        direction: 'down',
        originalEvent: event.detail
      })
      
      // Dispatch banner height change event
      document.dispatchEvent(new CustomEvent("banner:height:toggle:requested", {
        detail: { 
          action: 'minimize',
          source: 'gesture'
        }
      }))
    }
  }

  /**
   * Handle tap gestures with music actions
   * @param {CustomEvent} event - Tap gesture event
   */
  handleMusicTap(event) {
    console.log("🎵✋ MUSIC GESTURE DEBUG: handleMusicTap called", {
      tapActionValue: this.tapActionValue,
      isPlaying: this.musicState.isPlaying,
      event: event.detail
    })
    
    if (this.tapActionValue === "disabled") {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Tap is DISABLED")
      return
    }

    if (this.tapActionValue === "toggle") {
      console.log("🎵✋ MUSIC GESTURE DEBUG: Processing tap toggle")
      
      this.dispatchMusicAction('music:gesture:toggle', {
        gestureType: 'tap',
        originalEvent: event.detail
      })
      
      // DESKTOP FIX: Get actual playing state from DOM instead of relying on musicState
      const playerElement = document.querySelector('[data-controller*="music--player"]')
      const waveformElement = document.querySelector('[data-music--player-target="waveform"]')
      
      // Try to get actual playing state from WaveSurfer if available
      let actuallyPlaying = this.musicState.isPlaying
      if (waveformElement?.wavesurfer) {
        actuallyPlaying = waveformElement.wavesurfer.isPlaying()
        console.log("🎵✋ DESKTOP FIX: Got actual playing state from WaveSurfer:", actuallyPlaying)
      }
      
      // FIXED: Use the exact events the player controller listens for (lines 164-165)
      const toggleEvent = actuallyPlaying ? "player:pause" : "player:play"
      console.log("🎵✋ MUSIC GESTURE DEBUG: Dispatching primary event:", toggleEvent)
      
      // PRIMARY: Dispatch the events the player controller actually listens for
      document.dispatchEvent(new CustomEvent(toggleEvent, {
        bubbles: true,
        cancelable: true,
        detail: { source: 'gesture', timestamp: Date.now() }
      }))
      
      console.log("🎵✋ MUSIC GESTURE DEBUG: Primary toggle event dispatched successfully")
      
      // MOBILE BACKUP: Also try dispatching on the player element directly
      if (playerElement) {
        console.log("🎵✋ MOBILE BACKUP: Also dispatching on player element")
        playerElement.dispatchEvent(new CustomEvent(toggleEvent, {
          bubbles: true,
          cancelable: true,
          detail: { source: 'gesture', timestamp: Date.now() }
        }))
      }
      
      // Update our internal state to match
      this.musicState.isPlaying = !actuallyPlaying
    }
  }

  /**
   * Handle long press gestures
   * @param {CustomEvent} event - Long press gesture event
   */
  handleMusicLongPress(event) {
    if (this.longPressActionValue === "disabled") return

    if (this.longPressActionValue === "menu") {
      this.dispatchMusicAction('music:gesture:menu', {
        gestureType: 'longpress',
        originalEvent: event.detail
      })
      
      // Could trigger context menu, song options, etc.
      document.dispatchEvent(new CustomEvent("player:menu:requested", {
        detail: { 
          x: event.detail.x,
          y: event.detail.y,
          source: 'gesture'
        }
      }))
    }
  }

  // ========================
  // Music Gesture Validation
  // ========================

  /**
   * Validate if gesture meets music-specific requirements
   * @param {string} direction - Gesture direction
   * @param {number} distance - Gesture distance
   * @param {number} velocity - Gesture velocity
   * @returns {boolean} True if gesture is valid for music actions
   */
  isValidMusicGesture(direction, distance, velocity) {
    // Different thresholds for different directions
    const thresholds = {
      'left': this.trackChangeThresholdValue,
      'right': this.trackChangeThresholdValue,
      'up': this.playerExpandThresholdValue,
      'down': this.playerExpandThresholdValue
    }

    const requiredDistance = thresholds[direction] || this.swipeThresholdValue
    
    return distance >= requiredDistance && velocity >= this.velocityThresholdValue
  }

  // ========================
  // Music Event Dispatching
  // ========================

  /**
   * Dispatch music-specific gesture events
   * @param {string} eventType - Event type
   * @param {Object} detail - Event detail
   */
  dispatchMusicAction(eventType, detail = {}) {
    const musicEvent = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: true,
      detail: {
        ...detail,
        musicState: { ...this.musicState },
        timestamp: Date.now()
      }
    })

    this.element.dispatchEvent(musicEvent)
    
    // Also dispatch on document for global listening
    document.dispatchEvent(new CustomEvent(eventType, {
      detail: musicEvent.detail
    }))
  }

  // ========================
  // Public API Methods
  // ========================

  /**
   * Update music-specific configuration
   * @param {Object} config - Music configuration options
   */
  updateMusicConfig(config = {}) {
    // Update music-specific values
    const musicKeys = [
      'playerZone', 'bannerZone', 'swipeLeftAction', 'swipeRightAction',
      'swipeUpAction', 'swipeDownAction', 'tapAction', 'longPressAction',
      'trackChangeThreshold', 'playerExpandThreshold'
    ]

    musicKeys.forEach(key => {
      const valueKey = `${key}Value`
      if (config.hasOwnProperty(key) && this.hasOwnProperty(valueKey)) {
        this[valueKey] = config[key]
      }
    })

    // Update base gesture config
    super.updateConfig(config)
  }

  /**
   * Enable music gesture actions
   * @param {Array} actions - Array of actions to enable
   */
  enableMusicActions(actions = []) {
    const actionMap = {
      'next': 'swipeLeftActionValue',
      'prev': 'swipeRightActionValue',
      'expand': 'swipeUpActionValue',
      'minimize': 'swipeDownActionValue',
      'toggle': 'tapActionValue',
      'menu': 'longPressActionValue'
    }

    actions.forEach(action => {
      if (actionMap[action]) {
        this[actionMap[action]] = action
      }
    })
  }

  /**
   * Disable music gesture actions
   * @param {Array} actions - Array of actions to disable
   */
  disableMusicActions(actions = []) {
    const actionMap = {
      'next': 'swipeLeftActionValue',
      'prev': 'swipeRightActionValue',
      'expand': 'swipeUpActionValue',
      'minimize': 'swipeDownActionValue',
      'toggle': 'tapActionValue',
      'menu': 'longPressActionValue'
    }

    actions.forEach(action => {
      if (actionMap[action]) {
        this[actionMap[action]] = "disabled"
      }
    })
  }

  /**
   * Get current music state
   * @returns {Object} Current music state
   */
  getMusicState() {
    return { ...this.musicState }
  }

  // ========================
  // Advanced Gesture Handlers
  // ========================

  /**
   * Handle pinch start for volume control
   * @param {CustomEvent} event - Pinch start event
   */
  handlePinchStart(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { scale, centerX, centerY } = event.detail
    
    this.dispatchMusicAction('music:gesture:volume_start', {
      gestureType: 'pinch',
      initialScale: scale,
      centerX,
      centerY,
      originalEvent: event.detail
    })

    this.showGestureVisualFeedback('volume_adjust', true)
  }

  /**
   * Handle pinch movement for volume control
   * @param {CustomEvent} event - Pinch move event
   */
  handlePinchMove(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { scale, direction, velocity } = event.detail
    const scaleDiff = scale - 1 // Get difference from initial scale
    
    // Only adjust volume if pinch meets threshold
    if (Math.abs(scaleDiff) > (this.volumeChangeThresholdValue / 100)) {
      let volumeChange = 0
      
      if (direction === 'out' && this.pinchOutActionValue === "volume_up") {
        volumeChange = scaleDiff * this.musicState.gesturePreferences.volumeSensitivity * 0.1
      } else if (direction === 'in' && this.pinchInActionValue === "volume_down") {
        volumeChange = scaleDiff * this.musicState.gesturePreferences.volumeSensitivity * 0.1
      }

      if (volumeChange !== 0) {
        // Use debounced volume adjustment for better performance
        this.debouncedVolumeAdjust(volumeChange)
        // Use throttled visual feedback updates
        this.throttledVisualFeedback(this.musicState.volume)
      }

      this.dispatchMusicAction('music:gesture:volume_change', {
        gestureType: 'pinch',
        direction,
        scale,
        velocity,
        volumeChange,
        currentVolume: this.musicState.volume,
        originalEvent: event.detail
      })
    }
  }

  /**
   * Handle pinch end
   * @param {CustomEvent} event - Pinch end event
   */
  handlePinchEnd(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { scale, velocity } = event.detail
    
    this.dispatchMusicAction('music:gesture:volume_end', {
      gestureType: 'pinch',
      finalScale: scale,
      finalVelocity: velocity,
      finalVolume: this.musicState.volume,
      originalEvent: event.detail
    })

    this.hideGestureVisualFeedback('volume_adjust')
  }

  /**
   * Handle two-finger swipe gestures
   * @param {CustomEvent} event - Two-finger swipe event
   */
  handleTwoFingerSwipe(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { direction, distance, velocity } = event.detail

    switch (direction) {
      case 'up':
        if (this.twoFingerSwipeUpActionValue === "queue_show") {
          this.showQueue()
        }
        break
      case 'down':
        if (this.twoFingerSwipeDownActionValue === "queue_hide") {
          this.hideQueue()
        }
        break
      case 'left':
        // Could be used for playlist navigation
        this.handleTwoFingerHorizontalSwipe('left', event)
        break
      case 'right':
        // Could be used for playlist navigation
        this.handleTwoFingerHorizontalSwipe('right', event)
        break
    }

    this.dispatchMusicAction('music:gesture:two_finger_swipe', {
      gestureType: 'twoFingerSwipe',
      direction,
      distance,
      velocity,
      originalEvent: event.detail
    })
  }

  /**
   * Handle multi-tap gestures (double-tap, triple-tap)
   * @param {CustomEvent} event - Multi-tap event
   */
  handleMultiTap(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { tapCount, x, y, duration } = event.detail

    if (tapCount === 2 && this.doubleTapActionValue === "favorite") {
      this.toggleFavorite()
      this.showGestureVisualFeedback('favorite', true)
    } else if (tapCount === 3 && this.tripleTapActionValue === "shuffle") {
      this.toggleShuffle()
      this.showGestureVisualFeedback('shuffle', true)
    }

    this.dispatchMusicAction('music:gesture:multi_tap', {
      gestureType: 'multiTap',
      tapCount,
      x,
      y,
      duration,
      originalEvent: event.detail
    })
  }

  /**
   * Handle edge gestures for quick actions
   * @param {CustomEvent} event - Edge gesture event
   */
  handleEdgeGesture(event) {
    if (!this.musicState.gesturePreferences.enableAdvancedGestures) return

    const { edge, x, y } = event.detail

    switch (edge) {
      case 'left':
        if (this.edgeLeftActionValue === "playlists") {
          this.showPlaylists()
          this.showGestureVisualFeedback('playlists', true)
        }
        break
      case 'right':
        if (this.edgeRightActionValue === "settings") {
          this.showSettings()
          this.showGestureVisualFeedback('settings', true)
        }
        break
    }

    this.dispatchMusicAction('music:gesture:edge', {
      gestureType: 'edge',
      edge,
      x,
      y,
      originalEvent: event.detail
    })
  }

  // ========================
  // Music Control Actions
  // ========================

  /**
   * Adjust audio volume
   * @param {number} change - Volume change amount (-1 to 1)
   */
  adjustVolume(change) {
    // Get audio element through player controller integration
    const audioElement = document.querySelector('audio') ||
                        document.querySelector('[data-music--player-target="waveform"]')?.wavesurfer?.getMediaElement()

    if (audioElement) {
      const newVolume = Math.max(0, Math.min(1, this.musicState.volume + change))
      audioElement.volume = newVolume
      this.musicState.volume = newVolume

      // Persist volume preference
      localStorage.setItem('musicPlayerVolume', newVolume.toString())

      // Dispatch volume change event
      document.dispatchEvent(new CustomEvent("player:volume:changed", {
        detail: { volume: newVolume, source: 'gesture' }
      }))
    }
  }

  /**
   * Toggle favorite status for current track
   */
  toggleFavorite() {
    if (!this.musicState.currentTrack) return

    const isFavorited = this.musicState.currentFavorites.includes(this.musicState.currentTrack)
    
    if (isFavorited) {
      this.musicState.currentFavorites = this.musicState.currentFavorites.filter(
        track => track !== this.musicState.currentTrack
      )
    } else {
      this.musicState.currentFavorites.push(this.musicState.currentTrack)
    }

    // Dispatch favorite toggle event
    document.dispatchEvent(new CustomEvent("player:favorite:toggle", {
      detail: {
        url: this.musicState.currentTrack,
        favorited: !isFavorited,
        source: 'gesture'
      }
    }))
  }

  /**
   * Toggle shuffle mode
   */
  toggleShuffle() {
    this.musicState.isShuffle = !this.musicState.isShuffle

    // Dispatch shuffle toggle event
    document.dispatchEvent(new CustomEvent("player:shuffle:toggle", {
      detail: {
        enabled: this.musicState.isShuffle,
        source: 'gesture'
      }
    }))
  }

  /**
   * Show queue/playlist interface
   */
  showQueue() {
    this.musicState.queueVisible = true
    
    document.dispatchEvent(new CustomEvent("player:queue:show", {
      detail: { source: 'gesture' }
    }))
  }

  /**
   * Hide queue/playlist interface
   */
  hideQueue() {
    this.musicState.queueVisible = false
    
    document.dispatchEvent(new CustomEvent("player:queue:hide", {
      detail: { source: 'gesture' }
    }))
  }

  /**
   * Handle two-finger horizontal swipe for playlist navigation
   * @param {string} direction - Swipe direction ('left' or 'right')
   * @param {CustomEvent} event - Original event
   */
  handleTwoFingerHorizontalSwipe(direction, event) {
    // This could be used for navigating between playlists or queue items
    document.dispatchEvent(new CustomEvent("player:playlist:navigate", {
      detail: {
        direction,
        source: 'gesture',
        originalEvent: event.detail
      }
    }))
  }

  /**
   * Show playlists interface
   */
  showPlaylists() {
    document.dispatchEvent(new CustomEvent("ui:playlists:show", {
      detail: { source: 'gesture' }
    }))
  }

  /**
   * Show settings interface
   */
  showSettings() {
    document.dispatchEvent(new CustomEvent("ui:settings:show", {
      detail: { source: 'gesture' }
    }))
  }

  // ========================
  // Visual Feedback System
  // ========================

  /**
   * Show visual feedback for gesture recognition
   * @param {string} gestureType - Type of gesture
   * @param {boolean} isQuick - Whether this is a quick feedback
   */
  showGestureVisualFeedback(gestureType, isQuick = false) {
    const feedbackClass = `gesture-feedback-${gestureType}`
    const duration = isQuick ? 1000 : 2000

    // Create or update feedback element
    let feedback = document.querySelector(`.${feedbackClass}`)
    if (!feedback) {
      feedback = document.createElement('div')
      feedback.className = `gesture-feedback ${feedbackClass}`
      document.body.appendChild(feedback)
    }

    // Add CSS classes for animation
    feedback.classList.add('gesture-active', 'gesture-visible')
    
    // Set content based on gesture type
    feedback.textContent = this.getGestureFeedbackText(gestureType)

    // Auto-hide after duration
    setTimeout(() => {
      feedback.classList.remove('gesture-active')
      setTimeout(() => {
        feedback.classList.remove('gesture-visible')
      }, 300) // Fade out duration
    }, duration)

    // Dispatch feedback event for custom styling
    document.dispatchEvent(new CustomEvent("gesture:feedback:show", {
      detail: { gestureType, isQuick, element: feedback }
    }))
  }

  /**
   * Hide specific gesture visual feedback
   * @param {string} gestureType - Type of gesture
   */
  hideGestureVisualFeedback(gestureType) {
    const feedback = document.querySelector(`.gesture-feedback-${gestureType}`)
    if (feedback) {
      feedback.classList.remove('gesture-active', 'gesture-visible')
    }
  }

  /**
   * Update volume visual feedback
   * @param {number} volume - Current volume (0-1)
   */
  updateVolumeVisualFeedback(volume) {
    const volumePercentage = Math.round(volume * 100)
    
    // Update any existing volume feedback
    const volumeFeedback = document.querySelector('.gesture-feedback-volume_adjust')
    if (volumeFeedback) {
      volumeFeedback.textContent = `Volume: ${volumePercentage}%`
      volumeFeedback.style.width = `${volumePercentage}%`
    }

    // Dispatch volume feedback event
    document.dispatchEvent(new CustomEvent("gesture:feedback:volume", {
      detail: { volume, percentage: volumePercentage }
    }))
  }

  /**
   * Get feedback text for gesture type
   * @param {string} gestureType - Type of gesture
   * @returns {string} Feedback text
   */
  getGestureFeedbackText(gestureType) {
    const feedbackTexts = {
      'next': '⏭️ Next Track',
      'previous': '⏮️ Previous Track',
      'favorite': '❤️ Favorite',
      'shuffle': '🔀 Shuffle',
      'volume_adjust': `🔊 Volume: ${Math.round(this.musicState.volume * 100)}%`,
      'playlists': '📋 Playlists',
      'settings': '⚙️ Settings'
    }
    
    return feedbackTexts[gestureType] || `✋ ${gestureType}`
  }

  // ========================
  // Gesture Preferences & Persistence
  // ========================

  /**
   * Load gesture preferences from storage
   */
  loadGesturePreferences() {
    try {
      const stored = localStorage.getItem('musicGesturePreferences')
      if (stored) {
        const preferences = JSON.parse(stored)
        this.musicState.gesturePreferences = {
          ...this.musicState.gesturePreferences,
          ...preferences
        }
      }

      // Load volume from storage
      const storedVolume = localStorage.getItem('musicPlayerVolume')
      if (storedVolume) {
        this.musicState.volume = parseFloat(storedVolume)
      }
    } catch (error) {
      console.warn('Failed to load gesture preferences:', error)
    }
  }

  /**
   * Save gesture preferences to storage
   */
  saveGesturePreferences() {
    try {
      localStorage.setItem('musicGesturePreferences',
        JSON.stringify(this.musicState.gesturePreferences)
      )
    } catch (error) {
      console.warn('Failed to save gesture preferences:', error)
    }
  }

  /**
   * Update gesture preferences
   * @param {Object} preferences - New preferences
   */
  updateGesturePreferences(preferences) {
    this.musicState.gesturePreferences = {
      ...this.musicState.gesturePreferences,
      ...preferences
    }
    this.saveGesturePreferences()
  }
}