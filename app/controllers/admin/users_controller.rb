class Admin::UsersController < Admin::AdminController
  before_action :set_user, only: [ :show, :edit, :update, :destroy, :ban, :unban ]
  before_action :authorize_user_management

  def index
    @users = User.includes(:songs, :playlists)

    # Apply search filter
    if params[:search].present?
      @users = @users.search_by_name_or_email(params[:search])
    end

    # Apply status filter
    case params[:status]
    when "active"
      @users = @users.active_users
    when "inactive"
      @users = @users.inactive_users
    when "banned"
      @users = @users.banned_users
    end

    # Apply sorting
    @users = case params[:sort]
    when "name"
               @users.order(:first_name, :last_name)
    when "email"
               @users.order(:email)
    when "created_at"
               @users.order(:created_at)
    else
               @users.recent
    end

    # Simple pagination - limit results to 20 per page
    @users = @users.limit(20).offset((params[:page].to_i - 1) * 20) if params[:page].present?
    @users = @users.limit(20) unless params[:page].present?

    # Statistics for dashboard
    @total_users = User.count
    @active_users = User.active_users.count
    @banned_users = User.banned_users.count
    @new_users_this_week = User.where(created_at: 1.week.ago..Time.current).count
  end

  def show
    @user_songs = @user.songs.limit(10)
    @user_playlists = @user.playlists.limit(10)
    @recent_activity = {
      songs_count: @user.songs.count,
      playlists_count: @user.playlists.count,
      last_sign_in: @user.last_sign_in_at,
      sign_in_count: @user.sign_in_count
    }
  end

  def edit
  end

  def update
    begin
      if @user.update(user_params)
        redirect_to admin_user_path(@user), notice: "User was successfully updated."
      else
        flash.now[:alert] = "Please correct the errors below."
        render :edit, status: :unprocessable_entity
      end
    rescue => e
      Rails.logger.error "Error updating user #{@user.id}: #{e.message}"
      redirect_to admin_user_path(@user), alert: "An error occurred while updating the user."
    end
  end

  def destroy
    begin
      # Prevent deletion if user has critical data
      if @user.songs.exists? || @user.playlists.exists?
        redirect_to admin_user_path(@user),
                   alert: "Cannot delete user with existing songs or playlists. Please remove their content first."
        return
      end

      if @user.destroy
        redirect_to admin_users_path, notice: "User was successfully deleted."
      else
        redirect_to admin_users_path, alert: "Unable to delete user: " + @user.errors.full_messages.join(", ")
      end
    rescue => e
      Rails.logger.error "Error deleting user #{@user.id}: #{e.message}"
      redirect_to admin_users_path, alert: "An error occurred while deleting the user."
    end
  end

  def ban
    begin
      reason = params[:ban_reason].presence || "No reason provided"

      if @user.banned?
        redirect_to admin_user_path(@user), alert: "User is already banned."
        return
      end

      if @user.ban!(reason)
        redirect_to admin_user_path(@user), notice: "User has been banned successfully."
      else
        redirect_to admin_user_path(@user), alert: "Unable to ban user: " + @user.errors.full_messages.join(", ")
      end
    rescue => e
      Rails.logger.error "Error banning user #{@user.id}: #{e.message}"
      redirect_to admin_user_path(@user), alert: "An error occurred while banning the user."
    end
  end

  def unban
    begin
      unless @user.banned?
        redirect_to admin_user_path(@user), alert: "User is not currently banned."
        return
      end

      if @user.unban!
        redirect_to admin_user_path(@user), notice: "User has been unbanned successfully."
      else
        redirect_to admin_user_path(@user), alert: "Unable to unban user: " + @user.errors.full_messages.join(", ")
      end
    rescue => e
      Rails.logger.error "Error unbanning user #{@user.id}: #{e.message}"
      redirect_to admin_user_path(@user), alert: "An error occurred while unbanning the user."
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to admin_users_path, alert: "User not found."
  end

  def user_params
    params.require(:user).permit(:first_name, :last_name, :email, :username, :bio, :location, :active)
  end

  def authorize_user_management
    unless can?(:manage, User)
      redirect_to admin_root_path, alert: "You are not authorized to manage users."
    end
  end
end
