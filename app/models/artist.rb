class Artist < ApplicationRecord
  belongs_to :user, optional: true

  has_many :songs, dependent: :destroy
  has_many :albums, dependent: :destroy
  has_many :song_genres, through: :songs
  has_many :genres, through: :song_genres

  # Validations
  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, message: "already exists for this user" }
  validates :bio, length: { maximum: 2000 }

  scope :by_user, ->(user) { where(user: user) }
  scope :public_artists, -> { where(user: nil) }

  def owned_by?(user)
    self.user == user
  end

  def image_url
    read_attribute(:image_url)
  end

  def banner_video_url
    read_attribute(:banner_video_url)
  end

  def has_banner_video?
    banner_video_url.present?
  end
end
