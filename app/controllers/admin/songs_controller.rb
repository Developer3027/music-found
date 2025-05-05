# Song Controller for Admin
class Admin::SongsController < ApplicationController
  # Ensure admin is logged in for CRUD actions
  before_action :authenticate_admin!
  # Set song for methods that need it
  before_action :set_song, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file ]

  # GET /admin/songs
  #
  # Returns all songs. The `format.html` response is the default view for
  # this controller and is used for the index page of the milk admin dashboard.
  # The `format.json` response is used by the JavaScript frontend to populate the data tables.
  def index
    @songs = Song.all
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
    @song = Song.new(song_params)

    respond_to do |format|
      if @song.save
        set_image_url(@song)
        set_file_url(@song)
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
    respond_to do |format|
      if @song.update(song_params)
        set_image_url(@song) if @song.song_image.attached?
        set_file_url(@song) if @song.song_file.attached?
        format.html { redirect_to admin_songs_path, notice: "Song was successfully updated." }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :new, status: :unprocessable_entity }
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
    @song.song_image.purge_later

    respond_to do |format|
      if @song.song_image.attached?
        @song.update(song_image_url: nil)
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(dom_id(@song, "song_image")) }
      else
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
    @song.song_file.purge_later

    respond_to do |format|
      if @song.song_file.attached?
        @song.update(song_file_url: nil)
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(dom_id(@song, "song_file")) }
      else
        format.html { redirect_to edit_admin_song_path(@song), alert: "No file to remove." }
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
    params.require(:song).permit(:song_image,
                                 :song_file,
                                 :artist,
                                 :album,
                                 :title,
                                 :song_image_url,
                                 :song_file_url)
  end

  # Finds the song with the given id and assigns it to the @song instance variable.
  #
  # This method is called by the before_action callback in the SongController and
  # is used by multiple actions in the controller to fetch the song related to
  # the current request.
  def set_song
    @song = Song.find(params[:id])
  end

  # Sets the song_image_url attribute of a song to the URL of the associated song.
  #
  # @param song [Song] the song to set the song_image_url attribute for.
  #
  # @note This method is called after creating or updating a song when the song has an associated image.
  # @note This method is called by the before_action callback in the SongController and is used by
  # multiple actions in the controller to fetch the song related to the current request.
  # @note The default host url is set in the application controller.
  def set_image_url(song)
    if song.song_image.attached?
      song.update(song_image_url: Rails.application.routes.url_helpers.url_for(song.song_image))
    end
  end

  # Sets the song_file_url attribute of a song to the URL of the associated song.
  #
  # @param song [Song] the song to set the song_file_url attribute for.
  #
  # @note This method is called after creating or updating a song when the song has an associated song.
  # @note This method is called by the before_action callback in the SongController and is used by
  # multiple actions in the controller to fetch the song related to the current request.
  # @note The default host url is set in the application controller.
  def set_file_url(song)
    if song.song_file.attached?
      song.update(song_file_url: Rails.application.routes.url_helpers.url_for(song.song_file))
    end
  end
end
