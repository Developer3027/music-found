class AddUserAndBioToArtists < ActiveRecord::Migration[8.0]
  def change
    # Make user_id nullable initially to handle existing records
    add_reference :artists, :user, null: true, foreign_key: true
    add_column :artists, :bio, :text

    # Note: add_reference automatically creates an index for user_id
  end
end
