class MusicController < ApplicationController
  before_action :authenticate_user!, only: [ :my_music ]
  before_action :set_turbo_frame_headers, if: :turbo_frame_request?
  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }

  def index
    @songs = Song.accessible_to_user(current_user).includes([ :artist, :genres ])
    @songs_data = @songs.map do |song|
      {
        id: song.id,
        url: song.song_file_url,
        title: song.title,
        artist: song.artist.name,
        banner: song.artist.image_url,
        bannerVideo: song.artist.banner_video_url
      }
    end.to_json

    # Set default banner video for initial page load (use first song's artist if available)
    first_song = @songs.first
    @banner_video = first_song&.artist&.banner_video_url

    # DEBUG: Log banner video setup
    Rails.logger.debug "🎵 MUSIC CONTROLLER: First song: #{first_song&.title} by #{first_song&.artist&.name}"
    Rails.logger.debug "🎵 MUSIC CONTROLLER: Banner video URL: #{@banner_video}"
    Rails.logger.debug "🎵 MUSIC CONTROLLER: User animated banners enabled: #{current_user&.animated_banners_enabled?}"
  end

  def my_music
    # Both turbo frame and direct requests now require authentication
    @my_songs = current_user.songs.includes(:artist, :album, :genres)
    @my_playlists = current_user.playlists.includes(:songs)

    if turbo_frame_request?
      render partial: "music/turbo_frames/my_music"
    else
      render partial: "music/turbo_frames/my_music"
    end
  rescue StandardError => e
    # Handle any errors gracefully for turbo frames
    if turbo_frame_request?
      render partial: "music/turbo_frames/my_music_error", locals: { error_message: "Unable to load your music at this time." }
    else
      raise e
    end
  end

  private

  def set_turbo_frame_headers
    response.headers["Content-Type"] = "text/html; turbo-stream; charset=utf-8"
    response.headers["Vary"] = "Accept"
  end

  # Override authenticate_user! for turbo frame requests to handle authentication failures gracefully
  def authenticate_user!
    if turbo_frame_request?
      unless user_signed_in?
        render partial: "music/turbo_frames/my_music_unauthenticated", status: :unauthorized
        false
      end
    else
      super
    end
  end

  def artists
    @artists = Artist.includes(:songs).order(:name)
    @grouped_artists = @artists.group_by { |a| a.name.first.upcase }

    render partial: "music/turbo_frames/artists", formats: [ :html ]
  end

  # app/controllers/music_controller.rb
  def genres
    # Group songs by genre, including songs without a genre, filtered by accessibility
    @grouped_genres = Genre.left_joins(:songs)
                           .where.not(songs: { id: nil })
                           .distinct
                           .sort_by(&:name)
                           .map { |genre| [ genre, Song.accessible_to_user(current_user).joins(:song_genres).where(song_genres: { genre: genre }).includes(:artist, :album).limit(20) ] }
                           .to_h

    # For songs without a genre (if needed)
    # songs_without_genre = Song.where(genre_id: nil)
    # @grouped_genres["Unknown"] = songs_without_genre if songs_without_genre.any?
    render partial: "music/turbo_frames/genres", formats: [ :html ]
  end

  def audio_player
    @song = Song.accessible_to_user(current_user).find(params[:song_id])
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
