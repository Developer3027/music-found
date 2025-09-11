# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user)
    # Determine user type and set permissions accordingly
    if user.is_a?(Admin)
      # Admin permissions - can manage everything
      can :manage, :all

      # Specific user management permissions
      can :manage, User
      can [ :ban, :unban ], User
    elsif user.is_a?(User)
      # User permissions - authenticated users

      # Read access to music content - public songs + own private songs
      can :read, Song do |song|
        song.public? || song.user == user
      end
      can :read, Album
      can :read, Artist
      can :read, Genre
      can :read, Playlist

      # Users can manage their own profile
      can [ :show, :edit, :update ], User, id: user.id

      # Users can manage their own playlists
      can :manage, Playlist, user_id: user.id

      # Users can create songs and manage their own songs
      can :create, Song
      can :manage, Song, user_id: user.id

      # Users can create and manage their own artists
      can :create, Artist
      can :manage, Artist, user: user
      can :destroy_image, Artist, user: user

      # Users can create and manage their own albums
      can :create, Album
      can :manage, Album, user: user
      can :destroy_cover, Album, user: user

      # Users can create playlists
      can :create, Playlist

    else
      # Guest user permissions (when user is nil or not logged in)
      # Very limited access - only read access to public music content
      can :read, Song, public: true
      can :read, Album
      can :read, Artist
      can :read, Genre
      can :read, Playlist
    end

    # Additional permissions can be added here as the application grows
    # For example:
    # - Premium user features
    # - Content creator permissions
    # - Moderator roles
  end
end
