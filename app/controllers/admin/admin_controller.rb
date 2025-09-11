class Admin::AdminController < ApplicationController
  before_action :authenticate_admin!

  def index
    @songs = Song.all.includes([ :artist, :genres ])
    @song_count = Song.count

    # User statistics
    @user_count = User.count
    @active_users = User.active_users.count
    @banned_users = User.banned_users.count
    @new_users_this_week = User.where(created_at: 1.week.ago..Time.current).count
    @recent_users = User.recent.limit(5)
  end
end
