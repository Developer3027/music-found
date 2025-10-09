import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { songs: String }

  initialize() {
    this.songsArray = []
  }

  connect() {
    try {
      // Parse JSON and validate
      const parsed = JSON.parse(this.songsValue)
      
      // Ensure we have an array
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed data is not an array")
      }
      
      // Filter valid songs
      this.songsArray = parsed.filter(song =>
        song?.id && song?.url && song?.title
      )
      
      console.log("🎵📋 QUEUE FIX: Song list initialized with", this.songsArray.length, "songs")
      console.log("🎵📋 QUEUE FIX: Songs array:", this.songsArray)
      
      this.updatePlayerQueue() // Initial update
      this.setupEventListeners() // CRITICAL FIX: Call setupEventListeners!
      
    } catch (error) {
      console.error("Song list initialization failed:", error)
      this.songsArray = [] // Fallback to empty array
    }
  }

  setupEventListeners() {
    
    // Update queue when any song is played
    document.addEventListener("player:play-requested", () => {
      this.updatePlayerQueue()
    })
  }

  updatePlayerQueue() {
    // Double-check array before sending
    if (!Array.isArray(this.songsArray)) {
      console.error("Invalid songsArray - resetting")
      this.songsArray = []
    }
    
    console.log("🎵📋 QUEUE FIX: Updating player queue with", this.songsArray.length, "songs")
    console.log("🎵📋 QUEUE FIX: Queue contents:", this.songsArray.map(s => s.title))
    
    document.dispatchEvent(new CustomEvent("player:queue:updated", {
      detail: { queue: [...this.songsArray] } // Spread operator clones array
    }))
    
    console.log("🎵📋 QUEUE FIX: player:queue:updated event dispatched successfully")
  }
}
