class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true, inverse_of: :songs
  belongs_to :user, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres

  has_one_attached :song_image
  has_one_attached :song_file

  validates :title, presence: true
  validates :artist, presence: true
  validates :song_file, presence: true, on: :create
  validate :acceptable_song_file
  validate :acceptable_image

  delegate :name, to: :artist, prefix: true
  delegate :title, to: :album, prefix: true

  scope :by_user, ->(user) { where(user: user) }
  scope :public_songs, -> { where(user: nil) }

  def owned_by?(user)
    self.user == user
  end

  def image_url
    song_image_url || artist&.image_url
  end

  private

  def acceptable_song_file
    return unless song_file.attached?

    unless song_file.blob.content_type.in?(%w[audio/mpeg audio/mp3 audio/wav audio/ogg audio/m4a])
      errors.add(:song_file, "must be an audio file (MP3, WAV, OGG, M4A)")
    end

    if song_file.blob.byte_size > 50.megabytes
      errors.add(:song_file, "must be less than 50MB")
    end
  end

  def acceptable_image
    return unless song_image.attached?

    unless song_image.blob.content_type.in?(%w[image/jpeg image/png image/webp])
      errors.add(:song_image, "must be a JPEG, PNG, or WebP image")
    end

    if song_image.blob.byte_size > 5.megabytes
      errors.add(:song_image, "must be less than 5MB")
    end
  end
end
