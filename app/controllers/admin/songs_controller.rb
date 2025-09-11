# Song Controller for Admin
class Admin::SongsController < ApplicationController
  include ActionView::RecordIdentifier

  # Ensure admin is logged in for CRUD actions
  before_action :authenticate_admin!
  # Set song for methods that need it
  before_action :set_song, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file, :destroy_artist_image, :destroy_album_cover, :destroy_artist_banner_video ]
  before_action :ensure_song_editable, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file, :destroy_artist_image, :destroy_album_cover, :destroy_artist_banner_video ]

  # GET /admin/songs
  #
  # Returns all songs. The `format.html` response is the default view for
  # this controller and is used for the index page of the milk admin dashboard.
  # The `format.json` response is used by the JavaScript frontend to populate the data tables.
  def index
    @show_private = params[:show_private] == "true"

    if @show_private
      @songs = Song.all.includes([ :artist, :genres, :user ])
    else
      @songs = Song.where(public: true).includes([ :artist, :genres, :user ])
    end

    respond_to do |format|
      format.html
      format.json { render json: @songs.as_json(
        only: [ :id, :artist, :album, :title, :song_image_url, :song_file_url ]
      )}
    end
  end

  # GET /admin/songs/new
  #
  # Initializes a new Song object.
  # The `new` action is used to display a form for creating a new song.

  def new
    @song = Song.new
  end

  def edit; end

  # POST /admin/songs
  #
  # Creates a new song using provided song parameters.
  #
  # On success:
  # - Sets the song image URL if an image is attached.
  # - Sets the song file URL if a file is attached.
  # - Redirects to the songs listing page with a success notice.
  # - Renders the blog as JSON with a 201 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.

  def create
    @song = Song.new(song_params_without_associations)

    artist = nil
    album = nil

    # Handle artist first
    if params[:song][:artist_name].present?
      artist = Artist.find_or_create_by(name: params[:song][:artist_name])
      # Update artist image if provided
      if params[:artist_image_url].present?
        artist.update(image_url: params[:artist_image_url])
      end
      # Update artist banner video if provided
      if params[:artist_banner_video_url].present?
        artist.update(banner_video_url: params[:artist_banner_video_url])
      end
      @song.artist = artist
    end

    # Handle album second (after artist is available)
    if params[:song][:album_title].present? && artist.present?
      album = Album.find_or_create_by(title: params[:song][:album_title], artist_id: artist.id, user_id: nil)
      # Update album cover if provided
      if params[:album_cover_url].present?
        album.update(cover_art_url: params[:album_cover_url])
      end
      @song.album = album
    end

    respond_to do |format|
      if @song.save
        format.html { redirect_to admin_songs_path, notice: "Song was successfully added." }
        format.json { render json: @song }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /admin/songs/1
  #
  # Updates a song using the given song parameters.
  #
  # On success:
  # - Sets the song image URL if an image is attached.
  # - Sets the song file URL if a file is attached.
  # - Redirects to the songs listing page with a success notice.
  # - Renders the song as JSON with a 201 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def update
    artist = nil
    album = nil

    # Handle artist first
    if params[:song][:artist_name].present?
      artist = Artist.find_or_create_by(name: params[:song][:artist_name])
      # Update artist image if provided
      if params[:artist_image_url].present?
        artist.update(image_url: params[:artist_image_url])
      end
      # Update artist banner video if provided
      if params[:artist_banner_video_url].present?
        artist.update(banner_video_url: params[:artist_banner_video_url])
      end
      @song.artist = artist
    end

    # Handle album second (after artist is available)
    if params[:song][:album_title].present? && artist.present?
      album = Album.find_or_create_by(title: params[:song][:album_title], artist_id: artist.id, user_id: nil)
      # Update album cover if provided
      if params[:album_cover_url].present?
        album.update(cover_art_url: params[:album_cover_url])
      end
      @song.album = album
    end

    respond_to do |format|
      if @song.update(song_params_without_associations)
        format.html { redirect_to admin_songs_path, notice: "Song was successfully updated." }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/songs/1
  #
  # Destroys a song any associated file and any associated image.
  #
  # On success:
  # - Redirects to the songs listing page with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy
    S3DeleteJob.perform_now(@song.song_image_url) if @song.song_image_url.present?
    S3DeleteJob.perform_now(@song.song_file_url) if @song.song_file_url.present?

    respond_to do |format|
      if @song.destroy
        format.html { redirect_to admin_songs_path, status: :see_other, notice: "Song, file and image were successfully destroyed." }
        format.json { head :no_content }
      else
        format.html { redirect_to admin_songs_path, alert: "Failed to destroy the song." }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_image
  #
  # Destroys the associated image from the song - aws-s3.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the edit page of the song with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy_image
    if @song.song_image_url.present?
      S3DeleteJob.perform_now(@song.song_image_url) # Delete from S3 immediately
      @song.update(song_image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_image")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No image to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_file
  #
  # Destroys the associated audio file from the song - aws-s3.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the edit page of the song with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy_file
    if @song.song_file_url.present?
      S3DeleteJob.perform_now(@song.song_file_url) # Delete from S3 immediately
      @song.update(song_file_url: nil) # Clear the URL

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_file")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No file to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_artist_image
  #
  # Destroys the associated artist image from S3 and clears the artist's image_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the image element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_artist_image
    if @song.artist&.image_url.present?
      S3DeleteJob.perform_now(@song.artist.image_url) # Delete from S3 immediately
      @song.artist.update(image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "artist_image")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No artist image to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_album_cover
  #
  # Destroys the associated album cover from S3 and clears the album's cover_art_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the cover element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_album_cover
    if @song.album&.cover_art_url.present?
      S3DeleteJob.perform_now(@song.album.cover_art_url) # Delete from S3 immediately
      @song.album.update(cover_art_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "album_cover")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No album cover to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_artist_banner_video
  #
  # Destroys the associated artist banner video from S3 and clears the artist's banner_video_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the video element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_artist_banner_video
    if @song.artist&.banner_video_url.present?
      S3DeleteJob.perform_now(@song.artist.banner_video_url) # Delete from S3 immediately
      @song.artist.update(banner_video_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "artist_banner_video")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No artist banner video to remove." }
      end
    end
  end

  private

  # Strong parameters method for song attributes.
  #
  # Ensures only the permitted attributes are allowed from the params hash.
  #
  # @return [ActionController::Parameters] filtered parameters for creating or updating a song.

  def song_params
    params.require(:song).permit(:artist_name,
                                 :album_title,
                                 :title,
                                 :song_image_url,
                                 :song_file_url,
                                 :public,
                                 genre_ids: [])
  end

  def song_params_without_associations
    params.require(:song).permit(:title,
                                 :song_image_url,
                                 :song_file_url,
                                 :public,
                                 genre_ids: [])
  end

  # Finds the song with the given id and assigns it to the @song instance variable.
  #
  # This method is called by the before_action callback in the SongController and
  # is used by multiple actions in the controller to fetch the song related to
  # the current request.
  def set_song
    @song = Song.find(params[:id])
  end

  # Check if the current song is editable by admin
  # Admin can only edit:
  # - Public songs (public: true)
  # - Songs without a user (user_id: nil) - these are admin-created songs
  def ensure_song_editable
    unless song_admin_editable?(@song)
      redirect_to admin_songs_path, alert: "Cannot edit private user songs. Only public songs and admin-created songs can be edited."
    end
  end

  # Helper method to determine if a song is editable by admin
  def song_admin_editable?(song)
    song.public? || song.user_id.nil?
  end

  # Make the helper method available to views
  helper_method :song_admin_editable?
end
