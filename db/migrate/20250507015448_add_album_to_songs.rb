class AddAlbumToSongs < ActiveRecord::Migration[8.0]
  def change
    add_reference :songs, :album, null: false, foreign_key: true
  end
end
