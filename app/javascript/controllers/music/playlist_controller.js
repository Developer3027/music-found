// app/javascript/controllers/music/playlist_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list"]
  static values = { 
    currentSongId: Number,
    banner: String,
  }

  connect() {
    window.addEventListener("audio:changed", this.handleSongChange.bind(this))
    document.addEventListener("playlist:play-next", this.playNext.bind(this))
    document.addEventListener("playlist:play-previous", this.playPrevious.bind(this))
  }

  disconnect() {
    window.removeEventListener("audio:changed", this.handleSongChange)
    document.removeEventListener("playlist:play-next", this.playNext)
    document.removeEventListener("playlist:play-previous", this.playPrevious)
  }

  selectSong(e) {
    e.preventDefault()
    const autoplay = localStorage.getItem("audioAutoplay") === "true"
    const item = e.currentTarget

    const currentBanner = this.bannerValue || "music_files/home-banner.jpg"
    const newBanner = e.target.dataset.banner || "music_files/home-banner.jpg"
    const updateBanner = currentBanner !== newBanner

    const songData = {
      url: item.dataset.musicPlaylistUrlValue,
      title: item.dataset.musicPlaylistTitleValue,
      artist: item.dataset.musicPlaylistArtistValue,
      banner: this.bannerValue,
      id: item.dataset.musicPlaylistSongIdValue,
      autoplay: autoplay,
      updateBanner: updateBanner
    }

    //this.highlightSong(item)

    this.currentSongIdValue = parseInt(songData.id)

    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: { 
        ...songData, 
        autoplay: autoplay,
        //updateBanner: true // Explicitly set this
      }
    }))
  }

  handleSongChange(e) {
    const url = e.detail.url
    this.listTarget.querySelectorAll('.playlist-item').forEach(item => {
      if (item.dataset.musicPlaylistUrlParam === url) {
        item.classList.add('bg-gray-700', 'text-white')
        this.currentSongIdValue = parseInt(item.dataset.musicPlaylistSongIdParam)
      } else {
        item.classList.remove('bg-gray-700', 'text-white')
      }
    })
  }

  // highlightSong(element) {
  //   this.listTarget.querySelectorAll('.playlist-item').forEach(el => {
  //     el.classList.remove('bg-gray-700', 'text-white')
  //   })
  //   element.classList.add('bg-gray-700', 'text-white')
  // }

  playNext() {
    const items = Array.from(this.listTarget.querySelectorAll('.playlist-item'))
    if (items.length === 0) return
    
    const currentIndex = items.findIndex(item => 
      parseInt(item.dataset.musicPlaylistSongIdParam) === this.currentSongIdValue
    )
    
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
    items[nextIndex].click()
  }

  playPrevious() {
    const items = Array.from(this.listTarget.querySelectorAll('.playlist-item'))
    if (items.length === 0) return
    
    const currentIndex = items.findIndex(item => 
      parseInt(item.dataset.musicPlaylistSongIdParam) === this.currentSongIdValue
    )
    
    const prevIndex = currentIndex === -1 ? 0 : 
                     (currentIndex - 1 + items.length) % items.length
    items[prevIndex].click()
  }
}