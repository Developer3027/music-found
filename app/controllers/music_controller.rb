class MusicController < ApplicationController
  def index
    @songs = Song.all
  end

  def artists
    @artists = Artist.all
    render partial: "artists", formats: [ :html ]
  end

  def audio_player
    @song = Song.find(params[:song_id])
  end

  def playlists
    @playlists = Playlist.where(is_public: true)

    respond_to do |format|
      format.html { render partial: "playlists", formats: [ :html ] }
      format.json do
        if params[:id] # For single playlist JSON response
          playlist = Playlist.find(params[:id])
          render json: {
            id: playlist.id,
            name: playlist.name,
            songs: playlist.songs.order("playlist_songs.position").map do |song|
              {
                id: song.id,
                title: song.title,
                artist: song.artist.name,
                song_file_url: song.song_file_url,
                song_image_url: song.song_image_url
                # duration: song.duration
              }
            end
          }
        else # For all playlists JSON response
          render json: @playlists
        end
      end
    end
  end

  def about
    render partial: "about", formats: [ :html ]
  end
end
