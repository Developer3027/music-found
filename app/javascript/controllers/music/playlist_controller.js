// app/javascript/controllers/music/playlist_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["list"]
  static values = { 
    songs: String,
    playlistId: String,
    banner: String,
    currentSongId: Number
  }

  connect() {
    // Initialize playlist queue
    this.songsArray = this.parseSongs()
    this.updatePlayerQueue()
    
    // Set up event listeners
    window.addEventListener("audio:changed", this.handleSongChange.bind(this))
  }

  disconnect() {
    window.removeEventListener("audio:changed", this.handleSongChange)
  }

  // Parse the songs JSON data
  parseSongs() {
    try {
      const parsed = JSON.parse(this.songsValue)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error("Playlist songs parsing failed:", error)
      return []
    }
  }

  // Update the player's queue with our playlist songs
  updatePlayerQueue() {
    document.dispatchEvent(new CustomEvent("player:queue:set", {
      detail: { 
        queue: [...this.songsArray],
        context: `playlist:${this.playlistIdValue}`
      }
    }))
  }

  // Handle song selection from the playlist
  selectSong(e) {
    e.preventDefault()
    
    const item = e.currentTarget
    const playOnLoad = localStorage.getItem("audioPlayOnLoad") === "true"

    // Find the full song data from our parsed array
    const songId = item.dataset.musicPlaylistSongIdParam
    const songData = this.songsArray.find(song => song.id.toString() === songId.toString())

    if (!songData) {
      console.error("Song data not found for ID:", songId)
      return
    }

    // Update current song ID
    this.currentSongIdValue = parseInt(songId)

    // Dispatch play event with all song data
    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: { 
        ...songData,
        playOnLoad: playOnLoad,
        updateBanner: true
      }
    }))
  }

  // Update UI when song changes
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
}