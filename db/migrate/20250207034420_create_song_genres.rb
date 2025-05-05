class CreateSongGenres < ActiveRecord::Migration[8.0]
  def change
    create_table :song_genres do |t|
      t.references :song, null: false, foreign_key: true
      t.references :genre, null: false, foreign_key: true

      t.timestamps
    end
  end
end
