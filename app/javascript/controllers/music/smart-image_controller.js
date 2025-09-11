// app/javascript/controllers/smart_image_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["playButton"]
  static values = {
    id: String,
    url: String,
    title: String,
    artist: String,
    banner: String,
    bannerVideo: String,
    animatedBannersEnabled: Boolean
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

    // DEBUG: Log raw banner value from stimulus before any processing
    // console.log("🎵 SMART-IMAGE: Raw this.bannerValue:", this.bannerValue)
    // console.log("🎵 SMART-IMAGE: Banner value type:", typeof this.bannerValue)
    // console.log("🎵 SMART-IMAGE: Banner value empty check:", this.bannerValue === "")

    // Get current global banner state from localStorage or default
    const currentBanner = localStorage.getItem("currentBanner") || "music_files/home-banner.jpg"
    const newBanner = this.bannerValue || "music_files/home-banner.jpg"
    // console.log("🎵 SMART-IMAGE: currentBanner:", currentBanner, "newBanner:", newBanner)
    // console.log("🎵 SMART-IMAGE: Banner fallback triggered:", !this.bannerValue)
    
    // FIXED: Always update banner to ensure song metadata (title, artist) is updated
    // even if background image doesn't change
    // const updateBanner = true // Always update banner with current song info
    
    // Store the new banner as current for future comparisons
    localStorage.setItem("currentBanner", newBanner)

    // DEBUG: Log all values before dispatching event
    // console.log("🎵 SMART-IMAGE: Preparing to dispatch player:play-requested")
    // console.log("🎵 SMART-IMAGE: Controller Values:", {
    //  id: this.idValue,
    //  url: this.urlValue,
    //  title: this.titleValue,
    //  artist: this.artistValue,
    //  banner: this.bannerValue,
    //  bannerResolved: newBanner
    // })
    
    const eventDetail = {
      id: this.idValue,
      url: this.urlValue,
      title: this.titleValue,
      artist: this.artistValue,
      banner: this.bannerValue,
      bannerVideo: this.bannerVideoValue,
      playOnLoad: playOnLoad,
      animatedBannersEnabled: this.animatedBannersEnabledValue
    }
    
    // console.log("🎵 SMART-IMAGE: Event detail being dispatched:", eventDetail)
    // console.log("🎵 SMART-IMAGE: updateBanner set to:", updateBanner)

    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: eventDetail
    }))

    this.currentUrl = this.urlValue
  }


  handleSongChange(e) {
    // Only highlight if this is the current song
    if (e.detail.url === this.urlValue) {
      this.playButtonTarget.classList.add("border-[#00B1D1]/30", "bg-[#00B1D1]/10")
    } else {
      this.playButtonTarget.classList.remove("border-[#00B1D1]/30", "bg-[#00B1D1]/10")
    }
  }
}