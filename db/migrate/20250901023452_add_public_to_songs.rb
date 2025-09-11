class AddPublicToSongs < ActiveRecord::Migration[8.0]
  def change
    add_column :songs, :public, :boolean, default: false, null: false
  end
end
