class RemoveArtistAndAlbumFromSongs < ActiveRecord::Migration[8.0]
  def change
    remove_column :songs, :artist, :string
    remove_column :songs, :album, :string
  end
end
