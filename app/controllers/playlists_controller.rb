class PlaylistsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_playlist, only: [ :show, :edit, :update, :destroy ]
  load_and_authorize_resource

  def new
    @playlist = current_user.playlists.build
  end

  def create
    @playlist = current_user.playlists.build(playlist_params)

    respond_to do |format|
      if @playlist.save
        format.html { redirect_to my_music_path, notice: "Playlist was successfully created." }
        format.json { render json: @playlist }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @playlist.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    # Authorization handled by load_and_authorize_resource
  end

  def update
    respond_to do |format|
      if @playlist.update(playlist_params)
        format.html { redirect_to my_music_path, notice: "Playlist was successfully updated." }
        format.json { render json: @playlist }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @playlist.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @playlist.destroy
        format.html { redirect_to my_music_path, notice: "Playlist was successfully deleted." }
        format.json { head :no_content }
      else
        format.html { redirect_to my_music_path, alert: "Failed to delete the playlist." }
        format.json { render json: @playlist.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_playlist
    @playlist = current_user.playlists.find(params[:id])
  end

  def playlist_params
    params.require(:playlist).permit(:name, :description, :is_public, :cover_image_url)
  end
end
