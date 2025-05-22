// app/javascript/controllers/smart_image_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["playButton"]
  static values = {
    id: String,
    url: String,
    title: String,
    artist: String,
    banner: String
  }

  connect() {
    // Only keep track of current song
    window.addEventListener("audio:changed", this.handleSongChange.bind(this))
  }

  disconnect() {
    window.removeEventListener("audio:changed", this.handleSongChange)
  }

  playRequest(e) {
    e.preventDefault()
    const playOnLoad = localStorage.getItem("audioPlayOnLoad") === "true"

    const currentBanner = this.bannerValue || "music_files/home-banner.jpg"
    const newBanner = e.target.dataset.banner || "music_files/home-banner.jpg"
    const updateBanner = currentBanner !== newBanner

    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: {
        id: this.idValue,
        url: this.urlValue,
        title: this.titleValue,
        artist: this.artistValue,
        banner: this.bannerValue,
        playOnLoad: playOnLoad,
        updateBanner: updateBanner
      }
    }))

    this.currentUrl = this.urlValue
  }


  handleSongChange(e) {
    // Only highlight if this is the current song
    if (e.detail.url === this.urlValue) {
      this.playButtonTarget.classList.add("border-lime-500")
    } else {
      this.playButtonTarget.classList.remove("border-lime-500")
    }
  }
}