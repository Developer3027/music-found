class MusicController < ApplicationController
  def index
    @songs = Song.all
    @songs_data = @songs.map do |song|
      {
        id: song.id,
        url: song.song_file_url,
        title: song.title,
        artist: song.artist.name,
        banner: song.artist.image_url
      }
    end.to_json
  end

  def artists
    @artists = Artist.includes(:songs).order(:name)
    @grouped_artists = @artists.group_by { |a| a.name.first.upcase }

    render partial: "music/turbo_frames/artists", formats: [ :html ]
  end

# app/controllers/music_controller.rb
def genres
  # Group songs by genre, including songs without a genre
  @grouped_genres = Genre.left_joins(:songs)
                         .where.not(songs: { id: nil })
                         .distinct
                         .sort_by(&:name)
                         .map { |genre| [ genre, genre.songs.includes(:artist, :album).limit(20) ] }
                         .to_h

  # For songs without a genre (if needed)
  # songs_without_genre = Song.where(genre_id: nil)
  # @grouped_genres["Unknown"] = songs_without_genre if songs_without_genre.any?
  render partial: "music/turbo_frames/genres", formats: [ :html ]
end

  def audio_player
  @song = Song.find(params[:song_id])
    # respond_to do |format|
    #   format.turbo_stream do
    #     render turbo_stream: turbo_stream.replace("audio-player", partial: "music/audio_player", locals: { song: @song })
    #   end
    # end
  end

# app/controllers/music_controller.rb
def playlists
  @playlists = Playlist.where(is_public: true).includes(:songs)
  render partial: "music/turbo_frames/playlists"
end

def playlist
  @playlist = Playlist.find(params[:id])
  @songs = @playlist.songs.order("playlist_songs.position").includes(:artist, :album)
  render partial: "music/turbo_frames/playlist"
end

  def about
    render partial: "music/turbo_frames/about", formats: [ :html ]
  end
end
