class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true, inverse_of: :songs
  belongs_to :user, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres


  validates :title, presence: true
  validates :artist, presence: true
  validates :song_file_url, presence: true
  validates :song_image_url, presence: true

  # Virtual attributes for form handling
  attr_accessor :artist_name, :album_title

  # Make delegations safe by allowing nil
  delegate :name, to: :artist, prefix: true, allow_nil: true
  delegate :title, to: :album, prefix: true, allow_nil: true

  scope :by_user, ->(user) { where(user: user) }
  scope :public_songs, -> { where(public: true) }
  scope :accessible_to_user, ->(user) {
    if user.present?
      # Authenticated users: public songs + their own private songs
      where("public = ? OR user_id = ?", true, user.id)
    else
      # Non-authenticated users: only public songs
      where(public: true)
    end
  }

  def owned_by?(user)
    self.user == user
  end

  def image_url
    song_image_url || artist&.image_url
  end
end
