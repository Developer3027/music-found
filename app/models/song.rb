class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true, inverse_of: :songs

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres

  delegate :name, to: :artist, prefix: true
  delegate :title, to: :album, prefix: true

  private
end
