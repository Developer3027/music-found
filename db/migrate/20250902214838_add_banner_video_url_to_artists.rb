class AddBannerVideoUrlToArtists < ActiveRecord::Migration[8.0]
  def change
    add_column :artists, :banner_video_url, :string
  end
end
