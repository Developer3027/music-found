import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    title: String,
    artist: String,
    banner: String,
    playlistId: String,
    index: Number
  }

  play() {
    // Dispatch event to play this specific song
    window.dispatchEvent(new CustomEvent('audio:play', {
      detail: {
        url: this.urlValue,
        title: this.titleValue,
        artist: this.artistValue,
        banner: this.bannerValue || '/home-banner.jpg',
        playlistId: this.playlistIdValue,
        index: this.indexValue
      }
    }))
    
    // If you want to load the whole playlist when clicking a song:
    this.loadPlaylist()
  }

  async loadPlaylist() {
    const response = await fetch(`/playlists/${this.playlistIdValue}.json`)
    const playlist = await response.json()
    
    window.dispatchEvent(new CustomEvent('audio:set-playlist', {
      detail: {
        playlist: playlist.songs,
        playlistName: playlist.name
      }
    }))
    
    // Play the specific song immediately
    window.dispatchEvent(new CustomEvent('audio:play-playlist-item', {
      detail: { index: this.indexValue }
    }))
  }
}