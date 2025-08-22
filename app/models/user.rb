class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :trackable

  # Associations
  has_many :playlists, dependent: :destroy
  has_many :songs, dependent: :destroy
  has_one_attached :profile_image

  # Validations
  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :first_name, :last_name, presence: true
  validates :bio, length: { maximum: 500 }
  validates :location, length: { maximum: 100 }
  validates :date_of_birth, presence: true
  validate :date_of_birth_cannot_be_in_future

  # Instance methods
  def full_name
    "#{first_name} #{last_name}".strip
  end

  def display_name
    username.presence || full_name
  end

  def age
    return nil unless date_of_birth

    today = Date.current
    age = today.year - date_of_birth.year
    age -= 1 if today < date_of_birth + age.years
    age
  end

  # Moderation methods
  def ban!(reason = nil)
    update!(
      banned: true,
      banned_at: Time.current,
      ban_reason: reason,
      active: false
    )
  end

  def unban!
    update!(
      banned: false,
      banned_at: nil,
      ban_reason: nil,
      active: true
    )
  end

  def banned?
    banned
  end

  def active?
    active && !banned?
  end

  def status
    return "banned" if banned?
    return "inactive" unless active?
    "active"
  end

  def music_library_stats
    {
      songs_count: songs.count,
      playlists_count: playlists.count,
      public_playlists_count: playlists.where(is_public: true).count
    }
  end

  # Scopes for admin filtering
  scope :active_users, -> { where(active: true, banned: false) }
  scope :inactive_users, -> { where(active: false, banned: false) }
  scope :banned_users, -> { where(banned: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :search_by_name_or_email, ->(query) {
    where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR username ILIKE ?",
          "%#{query}%", "%#{query}%", "%#{query}%", "%#{query}%")
  }

  private

  def date_of_birth_cannot_be_in_future
    return unless date_of_birth

    errors.add(:date_of_birth, "can't be in the future") if date_of_birth > Date.current
  end
end
