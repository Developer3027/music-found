class Artist < ApplicationRecord
  has_many :songs, dependent: :destroy
  has_many :albums, dependent: :destroy
  has_many :song_genres, through: :songs
  has_many :genres, through: :song_genres

  # has_rich_text :bio
end
