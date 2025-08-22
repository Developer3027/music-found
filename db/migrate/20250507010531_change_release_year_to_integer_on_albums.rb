class ChangeReleaseYearToIntegerOnAlbums < ActiveRecord::Migration[8.0]
  def change
    change_column :albums, :release_year, :integer, using: 'extract(year from release_year)::integer', null: true
  end
end
