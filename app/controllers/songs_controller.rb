class SongsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_song, only: [ :show, :edit, :update, :destroy, :destroy_image, :destroy_file ]

  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }
  load_and_authorize_resource

  def new
    @song = current_user.songs.build

    if turbo_frame_request?
      render partial: "songs/form", locals: { song: @song }
    end
  end

  def create
    # 1. Separate the association attributes from the main song attributes.
    song_attributes = song_params
    artist_name = params[:song][:artist_name]&.strip
    album_name = params[:song][:album_title]&.strip

    # 2. Find or create the associated records.
    artist = current_user.artists.find_or_create_by(name: artist_name)
    album = current_user.albums.find_or_create_by(title: album_name, artist: artist)

    # 3. Build the song with its own attributes.
    @song = Song.new(song_attributes)

    # 4. Assign the records and the user.
    @song.artist = artist
    @song.album = album
    @song.user = current_user

    respond_to do |format|
      if @song.save

        # 1. This block handles standard browser requests.
        format.html { redirect_to my_music_path, notice: "Song was successfully uploaded." }

        # 2. This block handles Turbo Stream requests.
        format.turbo_stream do
          flash.now[:notice] = "Song was successfully uploaded."
          @my_songs = current_user.songs.includes(:artist, :album, :genres)
          @my_playlists = current_user.playlists.includes(:songs)
          render turbo_stream: turbo_stream.replace("music-frame", partial: "music/turbo_frames/my_music")
        end

        format.json { render json: @song }
      else
        Rails.logger.debug @song.errors.full_messages.inspect
        # This logic needs the same separation for the failure case.
        format.html { render :new, status: :unprocessable_entity }

        format.turbo_stream do
          @my_songs = current_user.songs.includes(:artist, :album, :genres)
          @my_playlists = current_user.playlists.includes(:songs)
          render turbo_stream: turbo_stream.replace("music-frame", partial: "music/turbo_frames/my_music"), status: :unprocessable_entity
        end

        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def show
    # Authorization handled by load_and_authorize_resource
  end

  def edit
    # Authorization handled by load_and_authorize_resource
  end

  def update
    respond_to do |format|
      if @song.update(song_params)
        format.html { redirect_to my_music_path, notice: "Song was successfully updated." }
        format.json { render json: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    # Use perform_now for immediate S3 deletion instead of background jobs
    S3DeleteJob.perform_now(@song.song_image_url) if @song.song_image_url.present?
    S3DeleteJob.perform_now(@song.song_file_url) if @song.song_file_url.present?

    respond_to do |format|
      if @song.destroy
        format.html { redirect_to my_music_path, notice: "Song was successfully deleted." }

        format.turbo_stream do
          flash.now[:notice] = "Song was successfully deleted."
          @my_songs = current_user.songs.includes(:artist, :album, :genres)
          @my_playlists = current_user.playlists.includes(:songs)
          render turbo_stream: turbo_stream.replace("music-frame", partial: "music/turbo_frames/my_music")
        end

        format.json { head :no_content }
      else
        format.html { redirect_to my_music_path, alert: "Failed to delete the song." }

        format.turbo_stream do
          flash.now[:alert] = "Failed to delete the song."
          @my_songs = current_user.songs.includes(:artist, :album, :genres)
          @my_playlists = current_user.playlists.includes(:songs)
          render turbo_stream: turbo_stream.replace("music-frame", partial: "music/turbo_frames/my_music"), status: :unprocessable_entity
        end

        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy_image
    if @song.song_image_url.present?
      S3DeleteJob.perform_now(@song.song_image_url) # Delete from S3 immediately
      @song.update(song_image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_image")) }
      end
    else
      redirect_to edit_song_path(@song), alert: "No image to remove."
    end
  end

  def destroy_file
    if @song.song_file_url.present?
      S3DeleteJob.perform_now(@song.song_file_url) # Delete from S3 immediately
      @song.update(song_file_url: nil) # Clear the URL

      respond_to do |format|
        format.html { redirect_to edit_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_file")) }
      end
    else
      redirect_to edit_song_path(@song), alert: "No file to remove."
    end
  end

  private

  def set_song
    @song = current_user.songs.find(params[:id])
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

  def song_params
    params.require(:song).permit(:title, :song_image_url, :song_file_url, :artist_name, :album_title, genre_ids: [])
  end
end
