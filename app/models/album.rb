class Album < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :artist, optional: false
  belongs_to :genre, optional: true

  has_many :songs, dependent: :destroy, inverse_of: :album
  has_many :song_genres, through: :songs
  has_many :genres, through: :song_genres

  # Validations
  validates :title, presence: true
  validates :title, uniqueness: { scope: [ :artist_id, :user_id ], message: "already exists for this artist and user" }
  validates :artist, presence: true

  delegate :name, to: :artist, prefix: true

  scope :by_user, ->(user) { where(user: user) }
  scope :public_albums, -> { where(user: nil) }

  def owned_by?(user)
    self.user == user
  end

  def cover_url
    cover_art_url
  end
end
