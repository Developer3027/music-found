class ProfilesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  def show
  render partial: "profiles/show"
  rescue StandardError => e
    if turbo_frame_request?
      render partial: "music/turbo_frames/my_music_error", locals: { error_message: "Unable to load profile at this time." }
    else
      raise e
    end
  end

  def edit
  end

  def update
    if @user.update(user_params)
      redirect_to profile_path, notice: "Profile was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = current_user
  end

  def user_params
    params.require(:user).permit(:first_name, :last_name, :username, :bio, :location, :date_of_birth, :profile_image, :enable_animated_banners)
  end
end
