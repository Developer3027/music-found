// app/javascript/controllers/music/playlist_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    songs: Array
  }

  playAll() {
    this.dispatchPlaylistEvent(this.songsValue)
  }

  playSong(event) {
    console.log('play song event in playlist controller.')
    const index = event.currentTarget.dataset.songIndex
    this.dispatchPlaylistEvent(this.songsValue, parseInt(index))
  }

  dispatchPlaylistEvent(songs, startIndex = 0) {
    window.dispatchEvent(new CustomEvent('audio:set-playlist', {
      detail: {
        playlist: songs,
        startIndex: startIndex,
        playlistName: this.element.querySelector('h3').textContent
      }
    }))
  }
}