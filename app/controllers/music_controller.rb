class MusicController < ApplicationController
  def index
    @songs = Song.all
  end

  def audio_player
    @song = Song.find(params[:song_id])
    # respond_to do |format|
    #   format.turbo_stream do
    #     render turbo_stream: turbo_stream.replace("audio-player", partial: "music/audio_player", locals: { song: @song })
    #   end
    # end
  end
end
