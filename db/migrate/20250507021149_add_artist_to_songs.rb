class AddArtistToSongs < ActiveRecord::Migration[8.0]
  def change
    add_reference :songs, :artist, null: false, foreign_key: true
  end
end
