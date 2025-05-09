class Playlist < ApplicationRecord
  has_many :playlist_songs, dependent: :destroy
  has_many :songs, through: :playlist_songs

  # Add default cover image
  def cover_image
    cover_image_url || songs.first&.image_url
  end
end
