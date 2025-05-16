// app/javascript/controllers/waveform_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "progressBar"]

  connect() {
    console.log("Waveform controller connected - container ready")
    this.initializeLoadingState()
    this.dispatchReadyEvent()
  }

  dispatchReadyEvent() {
    this.dispatch("ready", { detail: { hasContainer: this.hasContainerTarget } })
  }

  containerTargetConnected() {
    console.log("Waveform container target connected")
    this.dispatchReadyEvent()
  }

  initializeLoadingState() {
    this.progressBarTarget.style.width = '0%'
    this.progressBarTarget.classList.remove('loading-complete')
  }

  setupEventListeners() {
    // Waveform initialization
    document.addEventListener("player:waveform:init", (event) => {
      this.handleWaveformInit(event.detail.wavesurfer)
    })

    // Loading progress
    document.addEventListener("player:loading:progress", (event) => {
      this.updateLoadingProgress(event.detail)
    })

    document.addEventListener("player:loading:complete", () => {
      this.completeLoading()
    })
  }

  handleWaveformInit(wavesurfer) {
    if (this.hasContainerTarget) {
      console.log("Initializing waveform container")
      wavesurfer.setOptions({ container: this.containerTarget })
      this.setupWaveSurferEvents(wavesurfer)
    }
  }

  setupWaveSurferEvents(wavesurfer) {
    wavesurfer.on('loading', (progress) => {
      document.dispatchEvent(new CustomEvent("player:loading:progress", {
        detail: progress
      }))
    })

    wavesurfer.on('ready', () => {
      document.dispatchEvent(new CustomEvent("player:loading:complete"))
    })
  }

  updateLoadingProgress(progress) {
    const smoothedProgress = this.calculateSmoothedProgress(progress)
    this.progressBarTarget.style.width = `${smoothedProgress}%`
    
    if (progress === 100) {
      setTimeout(() => this.completeLoading(), 500)
    }
  }

  calculateSmoothedProgress(newProgress) {
    const currentWidth = parseFloat(this.progressBarTarget.style.width) || 0
    const smoothingFactor = 0.3
    return currentWidth + (newProgress - currentWidth) * smoothingFactor
  }

  completeLoading() {
    this.progressBarTarget.style.width = '100%'
    this.progressBarTarget.classList.add('loading-complete')
    setTimeout(() => {
      this.progressBarTarget.style.width = '0%'
    }, 300)
  }
}