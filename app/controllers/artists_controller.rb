class ArtistsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_artist, only: [ :show, :edit, :update, :destroy, :destroy_image, :destroy_banner_video ]
  before_action :set_turbo_frame_headers, if: :turbo_frame_request?
  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }
  load_and_authorize_resource

  def index
    @artists = current_user.artists.includes(:songs, :albums)

    if turbo_frame_request?
      render partial: "artists/index", locals: { artists: @artists }
    end
  end

  def show
    # Authorization handled by load_and_authorize_resource
  end

  def new
    @artist = current_user.artists.build

    if turbo_frame_request?
      render partial: "artists/form", locals: { artist: @artist }
    end
  end

  def create
    @artist = current_user.artists.build(artist_params)

    respond_to do |format|
      if @artist.save
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Artist was successfully created."
            render partial: "artists/index", locals: { artists: current_user.artists.includes(:songs, :albums) }
          else
            redirect_to @artist, notice: "Artist was successfully created."
          end
        end
        format.json { render json: @artist }
      else
        format.html do
          if turbo_frame_request?
            render partial: "artists/form", locals: { artist: @artist }, status: :unprocessable_entity
          else
            render :new, status: :unprocessable_entity
          end
        end
        format.json { render json: @artist.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    # Authorization handled by load_and_authorize_resource
  end

  def update
    respond_to do |format|
      if @artist.update(artist_params)
        format.html { redirect_to @artist, notice: "Artist was successfully updated." }
        format.json { render json: @artist }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @artist.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @artist.destroy
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Artist was successfully deleted."
            render partial: "artists/index", locals: { artists: current_user.artists.includes(:songs, :albums) }
          else
            redirect_to artists_path, notice: "Artist was successfully deleted."
          end
        end
        format.json { head :no_content }
      else
        format.html do
          if turbo_frame_request?
            flash.now[:alert] = "Failed to delete the artist."
            render partial: "artists/index", locals: { artists: current_user.artists.includes(:songs, :albums) }
          else
            redirect_to artists_path, alert: "Failed to delete the artist."
          end
        end
        format.json { render json: @artist.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy_image
    if @artist.image_url.present?
      S3DeleteJob.perform_now(@artist.image_url) # Delete from S3 immediately
      @artist.update(image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_artist_path(@artist) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@artist, "artist_image")) }
      end
    else
      redirect_to edit_artist_path(@artist), alert: "No image to remove."
    end
  end

  def destroy_banner_video
    if @artist.banner_video_url.present?
      S3DeleteJob.perform_now(@artist.banner_video_url) # Delete from S3 immediately
      @artist.update(banner_video_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_artist_path(@artist) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@artist, "artist_banner_video")) }
      end
    else
      redirect_to edit_artist_path(@artist), alert: "No banner video to remove."
    end
  end

  private

  def set_artist
    @artist = current_user.artists.find(params[:id])
  end

  def set_turbo_frame_headers
    response.headers["Content-Type"] = "text/html; turbo-stream; charset=utf-8"
    response.headers["Vary"] = "Accept"
  end

  # Override authenticate_user! for turbo frame requests to handle authentication failures gracefully
  def authenticate_user!
    if turbo_frame_request?
      unless user_signed_in?
        render partial: "artists/unauthenticated", status: :unauthorized
        false
      end
    else
      super
    end
  end

  def artist_params
    params.require(:artist).permit(:name, :bio, :image_url, :banner_video_url)
  end
end
