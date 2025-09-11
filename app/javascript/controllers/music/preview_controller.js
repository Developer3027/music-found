import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "play", "pause" ]
  static values = { url: String }

  connect() {
    if (!window.audio) {
      window.audio = new Audio();
      window.audioTimeoutId = null; // Initialize a global timeout ID
    }
    // Add event listener for cross-component communication
    window.addEventListener('audio-player-switched', this.audioChanged.bind(this));
  }

  toggle(e) {
    e.preventDefault();

    // Clear the previous timeout if it exists
    if (window.audioTimeoutId) {
      clearTimeout(window.audioTimeoutId);
      window.audioTimeoutId = null;
    }

    if (window.audio.src !== this.urlValue) {
      window.audio.pause();
      window.audio.currentTime = 0; // Reset the current time to the start
      window.audio.src = this.urlValue;
    }

    window.dispatchEvent(new CustomEvent('audio-player-switched', {
      detail: { audio_src: this.urlValue }
    }));

    this.playTarget.classList.toggle("hidden");
    this.pauseTarget.classList.toggle("hidden");

    if (!window.audio.paused) {
      window.audio.pause();
    } else {
      window.audio.currentTime = 0; // Reset the current time to the start
      window.audio.play();

      // Stop playback after the specified duration
      window.audioTimeoutId = setTimeout(() => {
        window.audio.pause();
        this.playTarget.classList.remove("hidden");
        this.pauseTarget.classList.add("hidden");
      }, 30 * 1000); // 30 seconds
    }
  }

  audioChanged(e) {
    let newUrl = e.detail.audio_src;
    if (newUrl !== this.urlValue) {
      if (this.playTarget.classList.contains("hidden")) {
        this.playTarget.classList.remove("hidden");
        this.pauseTarget.classList.add("hidden");
      }
    }
  }
}