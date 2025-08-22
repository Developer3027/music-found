class Playlist < ApplicationRecord
  belongs_to :user, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :songs, through: :playlist_songs

  validates :name, presence: true
  validates :user, presence: true, unless: :system_playlist?

  scope :by_user, ->(user) { where(user: user) }
  scope :public_playlists, -> { where(is_public: true) }
  scope :private_playlists, -> { where(is_public: false) }

  def owned_by?(user)
    self.user == user
  end

  def system_playlist?
    user.nil?
  end

  # Add default cover image
  def cover_image
    cover_image_url || songs.first&.image_url
  end

  def song_count
    songs.count
  end

  def total_duration
    # This would require duration field on songs
    # For now, return placeholder
    "#{song_count} songs"
  end
end
