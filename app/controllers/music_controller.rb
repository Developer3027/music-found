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
    # respond_to do |format|
    #   format.turbo_stream do
    #     render turbo_stream: turbo_stream.replace("audio-player", partial: "music/audio_player", locals: { song: @song })
    #   end
    # end
  end

  def playlists
    @playlists = Playlist.where(is_public: true)
    render partial: "playlists", formats: [ :html ]
  end

  def about
    render partial: "about", formats: [ :html ]
  end
end
