import { Controller } from "@hotwired/stimulus"

/**
 * Base Gesture Detection Controller
 * 
 * Provides foundational touch gesture recognition for mobile devices including:
 * - Native touch event handling (touchstart, touchmove, touchend)
 * - WaveSurfer conflict prevention system
 * - Core gesture detection algorithms (swipe, tap, long press)
 * - Event dispatching system for controller integration
 * - Performance optimizations for mobile devices
 * - Cross-platform touch handling (iOS/Android differences)
 */
export default class extends Controller {
  // ========================
  // Configuration
  // ========================

  /**
   * Controller Values - Configuration options
   */
  static values = {
    // Gesture thresholds
    swipeThreshold: { type: Number, default: 50 },      // Minimum distance for swipe
    velocityThreshold: { type: Number, default: 0.3 },  // Minimum velocity for swipe
    longPressThreshold: { type: Number, default: 500 }, // Long press duration (ms)
    tapThreshold: { type: Number, default: 10 },        // Maximum movement for tap
    
    // Multi-touch thresholds
    pinchThreshold: { type: Number, default: 10 },      // Minimum distance change for pinch
    edgeThreshold: { type: Number, default: 30 },       // Distance from edge for edge gestures
    multiTapTimeout: { type: Number, default: 300 },    // Time window for multi-tap detection
    twoFingerThreshold: { type: Number, default: 40 },  // Minimum distance for two-finger swipe
    
    // Performance settings
    enabled: { type: Boolean, default: true },
    preventWaveSurfer: { type: Boolean, default: true }
  }

  /**
   * Touch state tracking
   */
  touchState = {
    isActive: false,
    startTime: null,
    startX: null,
    startY: null,
    currentX: null,
    currentY: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: null,
    longPressTimer: null,
    isLongPress: false,
    preventNextTap: false,
    
    // Multi-touch state
    touches: new Map(),          // Store multiple touch points
    touchCount: 0,               // Current number of touches
    initialDistance: 0,          // Initial distance between two touches
    currentDistance: 0,          // Current distance between touches
    pinchScale: 1,              // Current pinch scale
    pinchVelocity: 0,           // Pinch velocity
    edgeDetected: null,         // Which edge was touched ('left', 'right', 'top', 'bottom')
    
    // Multi-tap detection
    lastTapTime: 0,
    tapCount: 0,
    lastTapX: 0,
    lastTapY: 0
  }

  /**
   * Gesture detection flags
   */
  gestureFlags = {
    swipeDetected: false,
    tapDetected: false,
    longPressDetected: false,
    pinchDetected: false,
    twoFingerSwipeDetected: false,
    edgeGestureDetected: false,
    multiTapDetected: false
  }

  // ========================
  // Lifecycle Methods
  // ========================

  /**
   * Initialize gesture controller when connected to DOM
   */
  connect() {
    // Initialize mouse state tracking for desktop testing
    this.isMouseDown = false
    
    // Bind methods to preserve context FIRST
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.handleTouchCancel = this.handleTouchCancel.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)

    // Then setup listeners and configuration
    this.setupTouchEventListeners()
    this.setupGestureConfiguration()

    console.log("✋ GESTURE: Base gesture controller connected")
  }

  /**
   * Clean up when controller is disconnected
   */
  disconnect() {
    this.removeTouchEventListeners()
    this.clearLongPressTimer()
    console.log("✋ GESTURE: Base gesture controller disconnected")
  }

  // ========================
  // Touch Event Setup
  // ========================

  /**
   * Set up native touch event listeners with optimal performance
   */
  setupTouchEventListeners() {
    if (!this.enabledValue) return

    // Use passive listeners for better scrolling performance
    const options = {
      passive: false, // We need to prevent default for some cases
      capture: true   // Capture phase for better control
    }

    this.element.addEventListener('touchstart', this.handleTouchStart, options)
    this.element.addEventListener('touchmove', this.handleTouchMove, options)
    this.element.addEventListener('touchend', this.handleTouchEnd, options)
    this.element.addEventListener('touchcancel', this.handleTouchCancel, options)
    
    // DEBUG: Add mouse event support for desktop testing
    console.log("🤚 GESTURE DEBUG: Adding mouse event listeners for testing")
    this.element.addEventListener('mousedown', this.handleMouseDown, options)
    this.element.addEventListener('mousemove', this.handleMouseMove, options)
    this.element.addEventListener('mouseup', this.handleMouseUp, options)
  }

  /**
   * Remove touch event listeners
   */
  removeTouchEventListeners() {
    this.element.removeEventListener('touchstart', this.handleTouchStart, true)
    this.element.removeEventListener('touchmove', this.handleTouchMove, true)
    this.element.removeEventListener('touchend', this.handleTouchEnd, true)
    this.element.removeEventListener('touchcancel', this.handleTouchCancel, true)
    
    // Remove mouse event listeners
    this.element.removeEventListener('mousedown', this.handleMouseDown, true)
    this.element.removeEventListener('mousemove', this.handleMouseMove, true)
    this.element.removeEventListener('mouseup', this.handleMouseUp, true)
  }

  /**
   * Configure gesture detection parameters
   */
  setupGestureConfiguration() {
    // Store original values for reset capability
    this.originalConfig = {
      swipeThreshold: this.swipeThresholdValue,
      velocityThreshold: this.velocityThresholdValue,
      longPressThreshold: this.longPressThresholdValue,
      tapThreshold: this.tapThresholdValue
    }
  }

  // ========================
  // WaveSurfer Conflict Prevention
  // ========================

  /**
   * Check if touch target is a WaveSurfer element
   * Prevents gesture detection on waveform to preserve drag-to-seek functionality
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is part of WaveSurfer
   */
  isWaveSurferElement(element) {
    if (!this.preventWaveSurferValue) return false

    // Check for waveform target attribute (from player controller analysis)
    if (element.hasAttribute('data-music--player-target') && 
        element.getAttribute('data-music--player-target') === 'waveform') {
      return true
    }

    // Check if element is within waveform container
    const waveformContainer = element.closest('[data-music--player-target="waveform"]')
    if (waveformContainer) {
      return true
    }

    // Check for WaveSurfer-specific classes
    const wavesurferClasses = ['wavesurfer', 'wave', 'progress', 'cursor']
    const elementClasses = element.className.toString().toLowerCase()
    
    for (const wsClass of wavesurferClasses) {
      if (elementClasses.includes(wsClass)) {
        return true
      }
    }

    // Check parent elements up to 3 levels
    let parent = element.parentElement
    let depth = 0
    while (parent && depth < 3) {
      const parentClasses = parent.className.toString().toLowerCase()
      for (const wsClass of wavesurferClasses) {
        if (parentClasses.includes(wsClass)) {
          return true
        }
      }
      parent = parent.parentElement
      depth++
    }

    return false
  }

  /**
   * Check if gesture should be prevented on this element
   * @param {Element} element - Target element
   * @returns {boolean} True if gestures should be prevented
   */
  shouldPreventGesture(element) {
    // Always prevent on WaveSurfer elements
    if (this.isWaveSurferElement(element)) {
      return true
    }

    // Prevent on form inputs
    const preventedTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']
    if (preventedTags.includes(element.tagName)) {
      return true
    }

    // Prevent on elements with explicit no-gesture attribute
    if (element.hasAttribute('data-no-gesture') || 
        element.closest('[data-no-gesture]')) {
      return true
    }

    return false
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
  // Touch Event Handlers
  // ========================

  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch start event
   */
  handleTouchStart(event) {
    if (!this.enabledValue) return

    // DEBUG: Enhanced logging for banner expansion issue
    console.log("🤚 GESTURE DEBUG: === TOUCH START EVENT ===")
    console.log("🤚 GESTURE DEBUG: Touch start on element:", event.target)
    console.log("🤚 GESTURE DEBUG: Element tag:", event.target.tagName)
    console.log("🤚 GESTURE DEBUG: Element classes:", event.target.className)
    console.log("🤚 GESTURE DEBUG: Element data attributes:", event.target.dataset)
    
    // BANNER DIAGNOSTIC: Check if touch is on banner elements
    const isBannerElement = this.isBannerRelatedElement(event.target)
    const bannerContainer = document.querySelector('[data-controller*="music--banner"]')
    const bannerExpanded = bannerContainer?.style.height && bannerContainer.style.height !== '160px'
    
    console.log("🤚 GESTURE DEBUG: Is banner element:", isBannerElement)
    console.log("🤚 GESTURE DEBUG: Banner expanded:", bannerExpanded)
    console.log("🤚 GESTURE DEBUG: Banner container height:", bannerContainer?.style.height || 'default')
    
    // Log element hierarchy for banner conflict detection
    let element = event.target
    let depth = 0
    console.log("🤚 GESTURE DEBUG: Element hierarchy:")
    while (element && depth < 5) {
      console.log(`🤚 GESTURE DEBUG:   [${depth}] ${element.tagName}.${element.className} - z-index: ${window.getComputedStyle(element).zIndex}`)
      element = element.parentElement
      depth++
    }

    // Check if we should prevent gestures on this element
    const shouldPrevent = this.shouldPreventGesture(event.target)
    console.log("🤚 GESTURE DEBUG: Should prevent gesture:", shouldPrevent)
    
    if (shouldPrevent) {
      console.log("🤚 GESTURE DEBUG: Gestures BLOCKED on this element")
      this.resetTouchState()
      return
    }

    console.log("🤚 GESTURE DEBUG: Gestures ALLOWED - proceeding with touch start")

    const touches = event.touches
    const touch = touches[0]
    
    // Update touch count and store touch data
    this.touchState.touchCount = touches.length
    this.storeTouchData(touches)

    // Handle single touch initialization
    if (touches.length === 1) {
      this.handleSingleTouchStart(touch, event.target)
    }
    // Handle multi-touch initialization
    else if (touches.length === 2) {
      this.handleMultiTouchStart(touches)
    }

    // Reset gesture flags for new gesture sequence
    this.resetGestureFlags()

    // Dispatch touch start event
    this.dispatchGestureEvent('gesture:touchstart', {
      x: touch.clientX,
      y: touch.clientY,
      touchCount: touches.length,
      target: event.target
    })
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch move event
   */
  handleTouchMove(event) {
    if (!this.enabledValue || !this.touchState.isActive) return

    const touches = event.touches
    const touch = touches[0]
    if (!touch) return

    // Update touch count and store current touch data
    this.touchState.touchCount = touches.length
    this.storeTouchData(touches)

    // Handle single touch movement
    if (touches.length === 1) {
      this.handleSingleTouchMove(touch)
    }
    // Handle multi-touch movement (pinch, two-finger swipe)
    else if (touches.length === 2) {
      this.handleMultiTouchMove(touches)
    }

    // Dispatch touch move event
    this.dispatchGestureEvent('gesture:touchmove', {
      x: touch.clientX,
      y: touch.clientY,
      deltaX: this.touchState.deltaX,
      deltaY: this.touchState.deltaY,
      touchCount: touches.length,
      target: event.target
    })
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch end event
   */
  handleTouchEnd(event) {
    if (!this.enabledValue || !this.touchState.isActive) return

    // Clear long press timer
    this.clearLongPressTimer()

    // Update touch count
    this.touchState.touchCount = event.touches.length

    // Detect final gestures based on touch count
    if (event.touches.length === 0) {
      this.detectFinalGestures(event)
      this.resetTouchState()
    } else if (event.touches.length === 1 && this.touchState.touchCount === 2) {
      // Transition from two fingers to one
      this.handleMultiTouchEnd()
    }
  }

  /**
   * Handle touch cancel event
   * @param {TouchEvent} event - Touch cancel event
   */
  handleTouchCancel(event) {
    if (!this.enabledValue) return

    this.clearLongPressTimer()
    this.resetTouchState()
    
    this.dispatchGestureEvent('gesture:cancel', {
      target: event.target
    })
  }

  // ========================
  // Mouse Event Handlers (for desktop testing)
  // ========================

  /**
   * Handle mouse down event (simulates touchstart)
   * @param {MouseEvent} event - Mouse down event
   */
  handleMouseDown(event) {
    console.log("🖱️ GESTURE DEBUG: Mouse down detected, converting to touch event")
    
    // Convert mouse event to touch-like structure
    const mockTouch = {
      clientX: event.clientX,
      clientY: event.clientY,
      identifier: 0
    }
    
    const mockTouchEvent = {
      target: event.target,
      touches: [mockTouch],
      preventDefault: event.preventDefault.bind(event)
    }
    
    this.isMouseDown = true
    this.handleTouchStart(mockTouchEvent)
  }

  /**
   * Handle mouse move event (simulates touchmove)
   * @param {MouseEvent} event - Mouse move event
   */
  handleMouseMove(event) {
    if (!this.isMouseDown) return
    
    // Convert mouse event to touch-like structure
    const mockTouch = {
      clientX: event.clientX,
      clientY: event.clientY,
      identifier: 0
    }
    
    const mockTouchEvent = {
      target: event.target,
      touches: [mockTouch],
      preventDefault: event.preventDefault.bind(event)
    }
    
    this.handleTouchMove(mockTouchEvent)
  }

  /**
   * Handle mouse up event (simulates touchend)
   * @param {MouseEvent} event - Mouse up event
   */
  handleMouseUp(event) {
    if (!this.isMouseDown) return
    
    const mockTouchEvent = {
      target: event.target,
      touches: [],
      preventDefault: event.preventDefault.bind(event)
    }
    
    this.isMouseDown = false
    this.handleTouchEnd(mockTouchEvent)
  }

  // ========================
  // Gesture Recognition Algorithms
  // ========================

  /**
   * Detect swipe gestures during touch movement
   */
  detectSwipeGesture() {
    if (this.gestureFlags.swipeDetected) return

    const distance = this.getMovementDistance()
    const velocity = this.touchState.velocity

    // Check if movement meets swipe criteria
    if (distance >= this.swipeThresholdValue && velocity >= this.velocityThresholdValue) {
      const direction = this.getSwipeDirection()
      
      if (direction) {
        this.gestureFlags.swipeDetected = true
        
        this.dispatchGestureEvent('gesture:swipe', {
          direction,
          distance,
          velocity,
          deltaX: this.touchState.deltaX,
          deltaY: this.touchState.deltaY,
          startX: this.touchState.startX,
          startY: this.touchState.startY,
          endX: this.touchState.currentX,
          endY: this.touchState.currentY
        })
      }
    }
  }

  /**
   * Detect final gestures when touch ends
   * @param {TouchEvent} event - Touch end event
   */
  detectFinalGestures(event) {
    const distance = this.getMovementDistance()
    const duration = Date.now() - this.touchState.startTime

    // Detect multi-tap gestures first
    if (this.touchState.tapCount > 1 && distance <= this.tapThresholdValue) {
      this.gestureFlags.multiTapDetected = true
      
      this.dispatchGestureEvent('gesture:multitap', {
        x: this.touchState.startX,
        y: this.touchState.startY,
        tapCount: this.touchState.tapCount,
        duration,
        target: event.target
      })
      return // Don't process other gestures if multi-tap detected
    }

    // Detect tap gesture if no other gestures were detected
    if (!this.gestureFlags.swipeDetected &&
        !this.gestureFlags.longPressDetected &&
        !this.gestureFlags.pinchDetected &&
        !this.gestureFlags.twoFingerSwipeDetected &&
        !this.touchState.preventNextTap &&
        distance <= this.tapThresholdValue) {
      
      this.gestureFlags.tapDetected = true
      
      this.dispatchGestureEvent('gesture:tap', {
        x: this.touchState.startX,
        y: this.touchState.startY,
        duration,
        target: event.target,
        edgeDetected: this.touchState.edgeDetected
      })
    }

    // Final swipe detection if not already detected
    if (!this.gestureFlags.swipeDetected && distance >= this.swipeThresholdValue) {
      const direction = this.getSwipeDirection()
      
      if (direction) {
        this.gestureFlags.swipeDetected = true
        
        console.log("🤚 GESTURE DEBUG: SWIPE DETECTED!", {
          direction,
          distance,
          velocity: this.touchState.velocity,
          threshold: this.swipeThresholdValue
        })
        
        this.dispatchGestureEvent('gesture:swipe', {
          direction,
          distance,
          velocity: this.touchState.velocity,
          deltaX: this.touchState.deltaX,
          deltaY: this.touchState.deltaY,
          startX: this.touchState.startX,
          startY: this.touchState.startY,
          endX: this.touchState.currentX,
          endY: this.touchState.currentY,
          edgeDetected: this.touchState.edgeDetected
        })
      }
    }
  }

  // ========================
  // Gesture Calculation Utilities
  // ========================

  /**
   * Calculate movement distance from start point
   * @returns {number} Distance in pixels
   */
  getMovementDistance() {
    return Math.sqrt(
      Math.pow(this.touchState.deltaX, 2) + 
      Math.pow(this.touchState.deltaY, 2)
    )
  }

  /**
   * Update velocity and direction calculations
   */
  updateVelocityAndDirection() {
    const currentTime = Date.now()
    const timeDiff = currentTime - this.touchState.startTime
    
    if (timeDiff > 0) {
      const distance = this.getMovementDistance()
      this.touchState.velocity = distance / timeDiff
    }

    this.touchState.direction = this.getSwipeDirection()
  }

  /**
   * Determine swipe direction based on movement
   * @returns {string|null} Direction ('left', 'right', 'up', 'down') or null
   */
  getSwipeDirection() {
    const { deltaX, deltaY } = this.touchState
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Require minimum movement
    if (absX < 10 && absY < 10) return null

    // Determine primary direction
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left'
    } else {
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  // ========================
  // Multi-Touch Handling
  // ========================

  /**
   * Store touch data for all current touches
   * @param {TouchList} touches - Current touch list
   */
  storeTouchData(touches) {
    this.touchState.touches.clear()
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      this.touchState.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        identifier: touch.identifier
      })
    }
  }

  /**
   * Handle single touch start
   * @param {Touch} touch - Touch object
   * @param {Element} target - Target element
   */
  handleSingleTouchStart(touch, target) {
    // Initialize single touch state
    this.touchState.isActive = true
    this.touchState.startTime = Date.now()
    this.touchState.startX = touch.clientX
    this.touchState.startY = touch.clientY
    this.touchState.currentX = touch.clientX
    this.touchState.currentY = touch.clientY
    this.touchState.deltaX = 0
    this.touchState.deltaY = 0
    this.touchState.velocity = 0
    this.touchState.direction = null
    this.touchState.isLongPress = false
    this.touchState.preventNextTap = false

    // Detect edge gestures
    this.detectEdgeGesture(touch)

    // Check for multi-tap sequences
    this.detectMultiTap(touch)

    // Start long press timer
    this.startLongPressTimer()
  }

  /**
   * Handle multi-touch start (2+ fingers)
   * @param {TouchList} touches - Touch list
   */
  handleMultiTouchStart(touches) {
    if (touches.length === 2) {
      // Initialize pinch gesture tracking
      const touch1 = touches[0]
      const touch2 = touches[1]
      
      this.touchState.initialDistance = this.calculateDistance(touch1, touch2)
      this.touchState.currentDistance = this.touchState.initialDistance
      this.touchState.pinchScale = 1
      this.touchState.pinchVelocity = 0
      
      // Clear single touch timers
      this.clearLongPressTimer()
    }
  }

  /**
   * Handle single touch movement
   * @param {Touch} touch - Touch object
   */
  handleSingleTouchMove(touch) {
    // Update current position
    this.touchState.currentX = touch.clientX
    this.touchState.currentY = touch.clientY

    // Calculate movement deltas
    this.touchState.deltaX = this.touchState.currentX - this.touchState.startX
    this.touchState.deltaY = this.touchState.currentY - this.touchState.startY

    // Calculate velocity and direction
    this.updateVelocityAndDirection()

    // Cancel long press if movement exceeds threshold
    if (this.getMovementDistance() > this.tapThresholdValue) {
      this.clearLongPressTimer()
    }

    // Detect swipe gestures during movement
    this.detectSwipeGesture()
  }

  /**
   * Handle multi-touch movement (pinch, two-finger swipe)
   * @param {TouchList} touches - Touch list
   */
  handleMultiTouchMove(touches) {
    if (touches.length === 2) {
      const touch1 = touches[0]
      const touch2 = touches[1]
      
      // Update pinch gesture
      this.updatePinchGesture(touch1, touch2)
      
      // Check for two-finger swipe
      this.detectTwoFingerSwipe(touch1, touch2)
    }
  }

  /**
   * Handle multi-touch end
   */
  handleMultiTouchEnd() {
    // Finalize pinch gesture if it was in progress
    if (this.touchState.pinchScale !== 1) {
      this.dispatchGestureEvent('gesture:pinchend', {
        scale: this.touchState.pinchScale,
        velocity: this.touchState.pinchVelocity,
        initialDistance: this.touchState.initialDistance,
        finalDistance: this.touchState.currentDistance
      })
    }
  }

  // ========================
  // Advanced Gesture Detection
  // ========================

  /**
   * Calculate distance between two touch points
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   * @returns {number} Distance in pixels
   */
  calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Update pinch gesture tracking
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   */
  updatePinchGesture(touch1, touch2) {
    const currentDistance = this.calculateDistance(touch1, touch2)
    const previousDistance = this.touchState.currentDistance
    const distanceChange = Math.abs(currentDistance - this.touchState.initialDistance)
    
    // Only detect pinch if movement exceeds threshold
    if (distanceChange > this.pinchThresholdValue) {
      const previousScale = this.touchState.pinchScale
      const newScale = currentDistance / this.touchState.initialDistance
      
      // Calculate pinch velocity (scale change over time)
      const currentTime = Date.now()
      const timeDiff = currentTime - (this.touchState.lastPinchTime || this.touchState.startTime)
      this.touchState.pinchVelocity = Math.abs(newScale - previousScale) / (timeDiff / 1000)
      
      this.touchState.currentDistance = currentDistance
      this.touchState.pinchScale = newScale
      this.touchState.lastPinchTime = currentTime

      if (!this.gestureFlags.pinchDetected) {
        this.gestureFlags.pinchDetected = true
        
        this.dispatchGestureEvent('gesture:pinchstart', {
          scale: newScale,
          distance: currentDistance,
          initialDistance: this.touchState.initialDistance,
          centerX: (touch1.clientX + touch2.clientX) / 2,
          centerY: (touch1.clientY + touch2.clientY) / 2
        })
      }
      
      this.dispatchGestureEvent('gesture:pinchmove', {
        scale: newScale,
        velocity: this.touchState.pinchVelocity,
        distance: currentDistance,
        initialDistance: this.touchState.initialDistance,
        centerX: (touch1.clientX + touch2.clientX) / 2,
        centerY: (touch1.clientY + touch2.clientY) / 2,
        direction: newScale > previousScale ? 'out' : 'in'
      })
    }
  }

  /**
   * Detect two-finger swipe gestures
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   */
  detectTwoFingerSwipe(touch1, touch2) {
    if (this.gestureFlags.twoFingerSwipeDetected || this.gestureFlags.pinchDetected) return

    // Calculate average movement of both fingers
    const stored1 = this.touchState.touches.get(touch1.identifier)
    const stored2 = this.touchState.touches.get(touch2.identifier)
    
    if (!stored1 || !stored2) return

    const avgDeltaX = ((touch1.clientX - stored1.startX) + (touch2.clientX - stored2.startX)) / 2
    const avgDeltaY = ((touch1.clientY - stored1.startY) + (touch2.clientY - stored2.startY)) / 2
    const avgDistance = Math.sqrt(avgDeltaX * avgDeltaX + avgDeltaY * avgDeltaY)

    if (avgDistance >= this.twoFingerThresholdValue) {
      const direction = Math.abs(avgDeltaX) > Math.abs(avgDeltaY)
        ? (avgDeltaX > 0 ? 'right' : 'left')
        : (avgDeltaY > 0 ? 'down' : 'up')

      this.gestureFlags.twoFingerSwipeDetected = true
      
      this.dispatchGestureEvent('gesture:twofingerswipe', {
        direction,
        distance: avgDistance,
        deltaX: avgDeltaX,
        deltaY: avgDeltaY,
        centerX: (touch1.clientX + touch2.clientX) / 2,
        centerY: (touch1.clientY + touch2.clientY) / 2,
        touch1: { x: touch1.clientX, y: touch1.clientY },
        touch2: { x: touch2.clientX, y: touch2.clientY }
      })
    }
  }

  /**
   * Detect edge gestures
   * @param {Touch} touch - Touch object
   */
  detectEdgeGesture(touch) {
    const { clientWidth, clientHeight } = document.documentElement
    const { clientX, clientY } = touch
    
    let edge = null
    if (clientX <= this.edgeThresholdValue) {
      edge = 'left'
    } else if (clientX >= clientWidth - this.edgeThresholdValue) {
      edge = 'right'
    } else if (clientY <= this.edgeThresholdValue) {
      edge = 'top'
    } else if (clientY >= clientHeight - this.edgeThresholdValue) {
      edge = 'bottom'
    }
    
    if (edge) {
      this.touchState.edgeDetected = edge
      
      this.dispatchGestureEvent('gesture:edgetouch', {
        edge,
        x: clientX,
        y: clientY,
        screenWidth: clientWidth,
        screenHeight: clientHeight
      })
    }
  }

  /**
   * Detect multi-tap gestures (double-tap, triple-tap)
   * @param {Touch} touch - Touch object
   */
  detectMultiTap(touch) {
    const currentTime = Date.now()
    const timeSinceLastTap = currentTime - this.touchState.lastTapTime
    const distance = Math.sqrt(
      Math.pow(touch.clientX - this.touchState.lastTapX, 2) +
      Math.pow(touch.clientY - this.touchState.lastTapY, 2)
    )

    // Check if this could be part of a multi-tap sequence
    if (timeSinceLastTap < this.multiTapTimeoutValue && distance < this.tapThresholdValue * 2) {
      this.touchState.tapCount++
    } else {
      this.touchState.tapCount = 1
    }

    this.touchState.lastTapTime = currentTime
    this.touchState.lastTapX = touch.clientX
    this.touchState.lastTapY = touch.clientY
  }

  // ========================
  // Long Press Handling
  // ========================

  /**
   * Start long press timer
   */
  startLongPressTimer() {
    this.clearLongPressTimer()
    
    this.touchState.longPressTimer = setTimeout(() => {
      if (this.touchState.isActive && !this.gestureFlags.swipeDetected) {
        this.touchState.isLongPress = true
        this.gestureFlags.longPressDetected = true
        this.touchState.preventNextTap = true

        this.dispatchGestureEvent('gesture:longpress', {
          x: this.touchState.startX,
          y: this.touchState.startY,
          duration: this.longPressThresholdValue
        })
      }
    }, this.longPressThresholdValue)
  }

  /**
   * Clear long press timer
   */
  clearLongPressTimer() {
    if (this.touchState.longPressTimer) {
      clearTimeout(this.touchState.longPressTimer)
      this.touchState.longPressTimer = null
    }
  }

  // ========================
  // Event Dispatching System
  // ========================

  /**
   * Dispatch gesture event with consistent structure
   * @param {string} eventType - Event type name
   * @param {Object} detail - Event detail data
   */
  dispatchGestureEvent(eventType, detail = {}) {
    console.log("🤚 GESTURE DEBUG: Dispatching event:", eventType, detail)
    
    const event = new CustomEvent(eventType, {
      bubbles: true,
      cancelable: true,
      detail: {
        ...detail,
        timestamp: Date.now(),
        touchState: { ...this.touchState },
        gestureFlags: { ...this.gestureFlags }
      }
    })

    this.element.dispatchEvent(event)
    
    // Also dispatch on document for global listening
    document.dispatchEvent(new CustomEvent(eventType, {
      detail: event.detail
    }))
  }

  // ========================
  // State Management
  // ========================

  /**
   * Reset touch state to initial values
   */
  resetTouchState() {
    this.touchState = {
      isActive: false,
      startTime: null,
      startX: null,
      startY: null,
      currentX: null,
      currentY: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      direction: null,
      longPressTimer: null,
      isLongPress: false,
      preventNextTap: false,
      
      // Multi-touch state
      touches: new Map(),
      touchCount: 0,
      initialDistance: 0,
      currentDistance: 0,
      pinchScale: 1,
      pinchVelocity: 0,
      edgeDetected: null,
      
      // Multi-tap detection
      lastTapTime: 0,
      tapCount: 0,
      lastTapX: 0,
      lastTapY: 0
    }
  }

  /**
   * Reset gesture detection flags
   */
  resetGestureFlags() {
    this.gestureFlags = {
      swipeDetected: false,
      tapDetected: false,
      longPressDetected: false,
      pinchDetected: false,
      twoFingerSwipeDetected: false,
      edgeGestureDetected: false,
      multiTapDetected: false
    }
  }

  // ========================
  // Public API Methods
  // ========================

  /**
   * Enable gesture detection
   */
  enable() {
    this.enabledValue = true
    this.setupTouchEventListeners()
  }

  /**
   * Disable gesture detection
   */
  disable() {
    this.enabledValue = false
    this.removeTouchEventListeners()
    this.resetTouchState()
  }

  /**
   * Update gesture configuration
   * @param {Object} config - Configuration options
   */
  updateConfig(config = {}) {
    Object.keys(config).forEach(key => {
      const valueKey = `${key}Value`
      if (this.hasOwnProperty(valueKey)) {
        this[valueKey] = config[key]
      }
    })
  }

  /**
   * Reset configuration to original values
   */
  resetConfig() {
    this.updateConfig(this.originalConfig)
  }
}