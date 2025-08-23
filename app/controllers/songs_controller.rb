class SongsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_song, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file ]
  before_action :set_turbo_frame_headers, if: :turbo_frame_request?
  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }
  load_and_authorize_resource

  def new
    @song = current_user.songs.build

    if turbo_frame_request?
      render partial: "songs/form", locals: { song: @song }
    end
  end

  def create
    @song = current_user.songs.build(song_params)

    respond_to do |format|
      if @song.save
        set_image_url(@song)
        set_file_url(@song)
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Song was successfully uploaded."
            render partial: "music/turbo_frames/my_music"
          else
            redirect_to my_music_path, notice: "Song was successfully uploaded."
          end
        end
        format.json { render json: @song }
      else
        format.html do
          if turbo_frame_request?
            render partial: "songs/form", locals: { song: @song }, status: :unprocessable_entity
          else
            render :new, status: :unprocessable_entity
          end
        end
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    # Authorization handled by load_and_authorize_resource
  end

  def update
    respond_to do |format|
      if @song.update(song_params)
        set_image_url(@song) if @song.song_image.attached?
        set_file_url(@song) if @song.song_file.attached?
        format.html { redirect_to my_music_path, notice: "Song was successfully updated." }
        format.json { render json: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @song.destroy
        format.html { redirect_to my_music_path, notice: "Song was successfully deleted." }
        format.json { head :no_content }
      else
        format.html { redirect_to my_music_path, alert: "Failed to delete the song." }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy_image
    @song.song_image.purge_later

    respond_to do |format|
      if @song.song_image.attached?
        @song.update(song_image_url: nil)
        format.html { redirect_to edit_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(dom_id(@song, "song_image")) }
      else
        format.html { redirect_to edit_song_path(@song), alert: "No image to remove." }
      end
    end
  end

  def destroy_file
    @song.song_file.purge_later

    respond_to do |format|
      if @song.song_file.attached?
        @song.update(song_file_url: nil)
        format.html { redirect_to edit_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(dom_id(@song, "song_file")) }
      else
        format.html { redirect_to edit_song_path(@song), alert: "No file to remove." }
      end
    end
  end

  private

  def set_song
    @song = current_user.songs.find(params[:id])
  end

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

  def song_params
    params.require(:song).permit(:song_image, :song_file, :artist, :album, :title, :song_image_url, :song_file_url, genre_ids: [])
  end

  def set_image_url(song)
    if song.song_image.attached?
      song.update(song_image_url: Rails.application.routes.url_helpers.url_for(song.song_image))
    end
  end

  def set_file_url(song)
    if song.song_file.attached?
      song.update(song_file_url: Rails.application.routes.url_helpers.url_for(song.song_file))
    end
  end
end
