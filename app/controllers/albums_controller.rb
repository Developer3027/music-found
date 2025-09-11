class AlbumsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_album, only: [ :show, :edit, :update, :destroy, :destroy_cover ]
  before_action :set_turbo_frame_headers, if: :turbo_frame_request?
  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }
  load_and_authorize_resource

  def index
    @albums = current_user.albums.includes(:artist, :songs, :genre)

    if turbo_frame_request?
      render partial: "albums/index", locals: { albums: @albums }
    end
  end

  def show
    # Authorization handled by load_and_authorize_resource
  end

  def new
    @album = current_user.albums.build
    @artists = current_user.artists

    if turbo_frame_request?
      render partial: "albums/form", locals: { album: @album, artists: @artists }
    end
  end

  def create
    @album = current_user.albums.build(album_params)

    respond_to do |format|
      if @album.save
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Album was successfully created."
            render partial: "albums/index", locals: { albums: current_user.albums.includes(:artist, :songs, :genre) }
          else
            redirect_to @album, notice: "Album was successfully created."
          end
        end
        format.json { render json: @album }
      else
        @artists = current_user.artists
        format.html do
          if turbo_frame_request?
            render partial: "albums/form", locals: { album: @album, artists: @artists }, status: :unprocessable_entity
          else
            render :new, status: :unprocessable_entity
          end
        end
        format.json { render json: @album.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    @artists = current_user.artists
    # Authorization handled by load_and_authorize_resource
  end

  def update
    @artists = current_user.artists

    respond_to do |format|
      if @album.update(album_params)
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Album was successfully updated."
            render partial: "albums/index", locals: { albums: current_user.albums.includes(:artist, :songs, :genre) }
          else
            redirect_to @album, notice: "Album was successfully updated."
          end
        end
        format.json { render json: @album }
      else
        format.html do
          if turbo_frame_request?
            render partial: "albums/form", locals: { album: @album, artists: @artists }, status: :unprocessable_entity
          else
            render :edit, status: :unprocessable_entity
          end
        end
        format.json { render json: @album.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @album.destroy
        format.html do
          if turbo_frame_request?
            flash.now[:notice] = "Album was successfully deleted."
            render partial: "albums/index", locals: { albums: current_user.albums.includes(:artist, :songs, :genre) }
          else
            redirect_to albums_path, notice: "Album was successfully deleted."
          end
        end
        format.json { head :no_content }
      else
        format.html do
          if turbo_frame_request?
            flash.now[:alert] = "Failed to delete the album."
            render partial: "albums/index", locals: { albums: current_user.albums.includes(:artist, :songs, :genre) }
          else
            redirect_to albums_path, alert: "Failed to delete the album."
          end
        end
        format.json { render json: @album.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy_cover
    if @album.cover_art_url.present?
      S3DeleteJob.perform_now(@album.cover_art_url) # Delete from S3 immediately
      @album.update(cover_art_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_album_path(@album) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@album, "cover_art")) }
      end
    else
      redirect_to edit_album_path(@album), alert: "No cover art to remove."
    end
  end

  private

  def set_album
    @album = current_user.albums.find(params[:id])
  end

  def set_turbo_frame_headers
    response.headers["Content-Type"] = "text/html; turbo-stream; charset=utf-8"
    response.headers["Vary"] = "Accept"
  end

  # Override authenticate_user! for turbo frame requests to handle authentication failures gracefully
  def authenticate_user!
    if turbo_frame_request?
      unless user_signed_in?
        render partial: "albums/unauthenticated", status: :unauthorized
        false
      end
    else
      super
    end
  end

  def album_params
    params.require(:album).permit(:title, :artist_id, :genre_id, :cover_art_url)
  end
end
