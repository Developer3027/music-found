class Song < ApplicationRecord
  has_one_attached :song_image, dependent: :destroy
  has_one_attached :song_file, dependent: :destroy

  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres
end
