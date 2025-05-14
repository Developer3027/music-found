module ApplicationHelper
  def playlist_songs_json(playlist)
    playlist.songs.order("playlist_songs.position").map do |song|
      {
        url: song.song_file_url,
        title: song.title,
        artist: song.artist.name,
        banner: song.song_image_url || "music_files/home-banner.jpg"
      }
    end.to_json
  end
end
