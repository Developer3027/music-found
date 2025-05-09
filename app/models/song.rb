class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres

  has_one_attached :song_image, dependent: :destroy
  has_one_attached :song_file, dependent: :destroy
end
