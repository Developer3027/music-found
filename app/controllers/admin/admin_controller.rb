class Admin::AdminController < ApplicationController
  before_action :authenticate_admin!

  def index
    @songs = Song.all
    @song_count = Song.count
  end
end
