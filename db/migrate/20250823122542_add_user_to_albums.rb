class AddUserToAlbums < ActiveRecord::Migration[8.0]
  def change
    # Make user_id nullable initially to handle existing records
    add_reference :albums, :user, null: true, foreign_key: true

    # Note: add_reference automatically creates an index for user_id
  end
end
