class UploadController < ApplicationController
  before_action :authenticate_user!
  before_action :set_turbo_frame_headers, if: :turbo_frame_request?
  protect_from_forgery with: :exception, unless: -> { turbo_frame_request? && request.get? }

  # Main interface action - serve the multi-model upload interface
  def index
    # Build new forms for each model
    @song = current_user.songs.build
    @artist = current_user.artists.build
    @album = current_user.albums.build

    # Load user's data for form options
    @artists = current_user.artists.order(:name)
    @albums = current_user.albums.includes(:artist).order(:title)
    @genres = Genre.all.order(:name)

    # For turbo frame requests, render the full frame content with proper wrapper
    if turbo_frame_request?
      render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index")
    end
  end

  # Handle song creation with inline artist/album creation
  def create_song
    # Get the full params first to check for nested attributes
    @full_params = song_params

    # Clean up genre_ids to remove empty strings
    if @full_params[:genre_ids].present?
      @full_params[:genre_ids] = @full_params[:genre_ids].reject(&:blank?)
    end

    # Extract only the basic song attributes for building the song model
    basic_attrs = @full_params.except(:new_artist, :new_album)
    @song = current_user.songs.build(basic_attrs)

    # Handle inline artist creation if provided
    if @full_params[:new_artist].present? && @full_params[:new_artist][:name].present?
      @artist = handle_inline_artist_creation
      @song.artist = @artist if @artist&.persisted?
    end

    # Handle inline album creation if provided
    if @full_params[:new_album].present? && @full_params[:new_album][:title].present?
      @album = handle_inline_album_creation
      @song.album = @album if @album&.persisted?
    end

    # If no artist provided and no new artist created, add validation error
    if @song.artist_id.blank? && @song.artist.nil?
      @song.errors.add(:artist_id, "Please select an existing artist or create a new one")
    end

    if @song.save
      set_image_url(@song)
      set_file_url(@song)

      # Success response
      if request.format.json?
        render json: @song
      elsif turbo_frame_request?
        # Reset form data and show success message
        load_form_data
        flash.now[:notice] = "Song was successfully uploaded."
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index")
      else
        redirect_to upload_path, notice: "Song was successfully uploaded."
      end
    else
      # Error response - reload form data for error display
      load_form_data

      if request.format.json?
        render json: @song.errors, status: :unprocessable_entity
      elsif turbo_frame_request?
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index"), status: :unprocessable_entity
      else
        render :index, status: :unprocessable_entity
      end
    end
  end

  # Handle standalone artist creation
  def create_artist
    @artist = current_user.artists.build(artist_params)

    if @artist.save
      set_image_url(@artist)

      # Success response
      if request.format.json?
        render json: @artist
      elsif turbo_frame_request?
        # Reset form data and show success message
        load_form_data
        flash.now[:notice] = "Artist was successfully created."
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index")
      else
        redirect_to upload_path, notice: "Artist was successfully created."
      end
    else
      # Error response - load other form data but preserve @artist with errors
      @song ||= current_user.songs.build
      @album ||= current_user.albums.build
      @artists = current_user.artists.order(:name)
      @albums = current_user.albums.includes(:artist).order(:title)
      @genres = Genre.all.order(:name)

      if request.format.json?
        render json: @artist.errors, status: :unprocessable_entity
      elsif turbo_frame_request?
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index"), status: :unprocessable_entity
      else
        render :index, status: :unprocessable_entity
      end
    end
  end

  # Handle standalone album creation
  def create_album
    @album = current_user.albums.build(album_params)

    if @album.save
      set_cover_url(@album)

      # Success response
      if request.format.json?
        render json: @album
      elsif turbo_frame_request?
        # Reset form data and show success message
        load_form_data
        flash.now[:notice] = "Album was successfully created."
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index")
      else
        redirect_to upload_path, notice: "Album was successfully created."
      end
    else
      # Error response - load other form data but preserve @album with errors
      @song ||= current_user.songs.build
      @artist ||= current_user.artists.build
      @artists = current_user.artists.order(:name)
      @albums = current_user.albums.includes(:artist).order(:title)
      @genres = Genre.all.order(:name)

      if request.format.json?
        render json: @album.errors, status: :unprocessable_entity
      elsif turbo_frame_request?
        render turbo_stream: turbo_stream.replace("upload_frame", partial: "upload/index"), status: :unprocessable_entity
      else
        render :index, status: :unprocessable_entity
      end
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
        render partial: "upload/unauthenticated", status: :unauthorized
        false
      end
    else
      super
    end
  end

  # Strong parameters for basic song creation (excludes nested attributes)
  def basic_song_params
    params.require(:song).permit(
      :song_image, :song_file, :artist_id, :album_id, :title,
      :song_image_url, :song_file_url,
      genre_ids: []
    )
  end

  # Strong parameters for song creation including nested artist/album attributes
  def song_params
    params.require(:song).permit(
      :song_image, :song_file, :artist_id, :album_id, :title,
      :song_image_url, :song_file_url,
      genre_ids: [],
      new_artist: [ :name, :bio, :artist_image, :artist_image_url ],
      new_album: [ :title, :artist_id, :genre_id, :cover_art ]
    )
  end

  # Strong parameters for artist creation
  def artist_params
    params.require(:artist).permit(:name, :bio, :artist_image, :artist_image_url)
  end

  # Strong parameters for album creation
  def album_params
    params.require(:album).permit(:title, :artist_id, :genre_id, :cover_art)
  end

  # Helper for creating artist during song creation
  def handle_inline_artist_creation
    artist_attrs = @full_params[:new_artist]
    return nil unless artist_attrs[:name].present?

    artist = current_user.artists.build(artist_attrs)
    unless artist.save
      # Add artist errors to song errors for display
      artist.errors.full_messages.each do |message|
        @song.errors.add(:new_artist, message)
      end
      return nil
    end

    set_image_url(artist) if artist.artist_image.attached?
    artist
  end

  # Helper for creating album during song creation
  def handle_inline_album_creation
    album_attrs = @full_params[:new_album]
    return nil unless album_attrs[:title].present?

    # Use the inline artist if created, otherwise use selected artist
    album_attrs[:artist_id] = @artist&.id || album_attrs[:artist_id]

    album = current_user.albums.build(album_attrs)
    unless album.save
      # Add album errors to song errors for display
      album.errors.full_messages.each do |message|
        @song.errors.add(:new_album, message)
      end
      return nil
    end

    set_cover_url(album) if album.cover_art.attached?
    album
  end

  # Load form data for error states
  def load_form_data
    @song ||= current_user.songs.build
    @artist ||= current_user.artists.build
    @album ||= current_user.albums.build
    @artists = current_user.artists.order(:name)
    @albums = current_user.albums.includes(:artist).order(:title)
    @genres = Genre.all.order(:name)
  end

  def set_image_url(record)
    if record.respond_to?(:song_image) && record.song_image.attached?
      record.update(song_image_url: Rails.application.routes.url_helpers.url_for(record.song_image))
    elsif record.respond_to?(:artist_image) && record.artist_image.attached?
      record.update(artist_image_url: Rails.application.routes.url_helpers.url_for(record.artist_image))
    end
  end

  def set_file_url(song)
    if song.song_file.attached?
      song.update(song_file_url: Rails.application.routes.url_helpers.url_for(song.song_file))
    end
  end

  def set_cover_url(album)
    # Cover URL is handled by the model's cover_url method
    # No need to update any fields since cover_art attachment handles the URL
  end
end
