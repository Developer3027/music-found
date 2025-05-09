class CreatePlaylists < ActiveRecord::Migration[8.0]
  def change
    create_table :playlists do |t|
      t.string :name
      t.text :description
      t.boolean :is_public, default: true
      t.string :cover_image_url

      t.timestamps
    end
  end
end
