class Genre < ApplicationRecord
  has_many :song_genres, dependent: :destroy
  has_many :songs, through: :song_genres
  has_many :artist, through: :songs
  has_many :albums, through: :songs
end
