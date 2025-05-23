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
    @artists = Artist.all
    render partial: "music/turbo_frames/artists", formats: [ :html ]
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
  @songs_data = @songs.map do |song|
    {
      id: song.id,
      url: song.song_file_url,
      title: song.title,
      artist: song.artist.name,
      banner: song.artist.image_url,
      # Add playlist context if needed
      playlist_id: @playlist.id
    }
  end.to_json
  render partial: "music/turbo_frames/playlist",
         locals: {
           playlist: @playlist,
           songs: @songs,
           songs_data: @songs_data
         },
         formats: [ :html ]
end

  def about
    render partial: "music/turbo_frames/about", formats: [ :html ]
  end
end
