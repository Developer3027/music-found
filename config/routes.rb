Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: "users/registrations"
  }
  devise_for :admins, skip: [ :registrations ]

  # User profile routes
  resource :profile, only: [ :show, :edit, :update ]

  # Authenticated user root
  authenticated :user do
    root to: "music#index", as: :user_root
  end

  # config/routes.rb
  authenticated :admin do
    root to: "admin/admin#index", as: :admin_root
  end

  namespace :admin do
    resources :songs, only: [ :index, :new, :create, :edit, :update, :destroy ] do
      member do
        delete [ :destroy_image, :destroy_file ]
      end
    end

    resources :users, only: [ :index, :show, :edit, :update, :destroy ] do
      member do
        patch :ban
        patch :unban
      end
    end
  end

scope :music do
  get "/", to: "music#index", as: :music
  get "artists", to: "music#artists", as: :music_artists
  get "genres", to: "music#genres", as: :music_genres
  get "playlists", to: "music#playlists", as: :music_playlists
  get "playlists/:id", to: "music#playlist", as: :music_playlist
  get "about", to: "music#about", as: :music_about
  get "my-music", to: "music#my_music", as: :my_music
end

  resources :music, only: [ :index ] do
    post "audio-player", to: "music#audio_player", on: :collection
  end

  # User music management routes
  resources :songs, except: [ :index ] do
    member do
      delete :destroy_image
      delete :destroy_file
    end
  end

  resources :playlists, only: [ :new, :create, :edit, :update, :destroy ]

  get "home/about", to: "home#about", as: :home_about
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "home#index"
end
