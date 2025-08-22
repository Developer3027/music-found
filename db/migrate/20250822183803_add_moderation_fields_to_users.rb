class AddModerationFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :active, :boolean, default: true, null: false
    add_column :users, :banned, :boolean, default: false, null: false
    add_column :users, :banned_at, :datetime
    add_column :users, :ban_reason, :text
  end
end
