class ConvertPublicSongs < ActiveRecord::Migration[8.0]
  def up
    # Set public: true for all existing songs where user_id is NULL
    # This maintains the existing behavior where user: nil meant public
    execute <<-SQL
      UPDATE songs
      SET public = true
      WHERE user_id IS NULL;
    SQL

    # Log the conversion for reference
    public_songs_count = connection.select_value("SELECT COUNT(*) FROM songs WHERE public = true")
    puts "Converted #{public_songs_count} songs to public status"
  end

  def down
    # Reverse the migration by setting user_id to NULL for public songs
    # that don't have a user_id (preserving user-owned public songs)
    execute <<-SQL
      UPDATE songs
      SET user_id = NULL
      WHERE public = true AND user_id IS NULL;
    SQL

    # Reset public to false for songs that were converted
    execute <<-SQL
      UPDATE songs
      SET public = false
      WHERE user_id IS NULL;
    SQL
  end
end
