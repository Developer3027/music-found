class ChangeGenreIdToNullableInAlbums < ActiveRecord::Migration[8.0]
  def change
    change_column_null :albums, :genre_id, true
  end
end
