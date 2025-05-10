import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    id: String
  }

  async playPlaylist() {
    console.log("hit play playlist...")
    const response = await fetch(`/music/playlists/${this.idValue}.json`)
    const playlist = await response.json()
    
    window.dispatchEvent(new CustomEvent('audio:set-playlist', {
      detail: {
        playlist: playlist.songs,
        playlistName: playlist.name
      }
    }))
  }
}