# Music Found - Rails 8 Music Player Application

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Concept & MVP](#core-concept--mvp)
3. [Technology Stack](#technology-stack)
4. [Application Architecture](#application-architecture)
5. [Database Schema & Models](#database-schema--models)
6. [Core Functionality](#core-functionality)
7. [User Interface & Views](#user-interface--views)
8. [Stimulus Controllers](#stimulus-controllers)
9. [File Upload & Storage](#file-upload--storage)
10. [Feature Status & Roadmap](#feature-status--roadmap)
11. [Development Recommendations](#development-recommendations)

## Core Concept Description
The app is a music player for a users own personal music collection. The player allows a user to customize their music by adding or creating images or video, (Live Images), to music. It is a modern take on a cross between the Microsoft Zune player and the AIMP music player, running in the browser as a web app.

The Zune music player included a screen that showed album art and artist information while playing tracks. I wish to expand and customize that experience. Much like the Spotify Canvas feature, only custom to the user. AIMP had a truly wonderful meta data interface as well as a wonderful EQ feature. This allowed for providing the song details for organization of music library and setting EQ values that expanded on making the music yours, and more enjoyable.

## Project MVP description
The app should allow anyone is organize and customize their music collection as well as stream music from streaming services like Spotify, Pandora, or Sound Cloud. It should allow artist of both music and digital art, the ability to share and sell their art. The app will have three phases. A public phase where any visitor can experience the player. A admin phase that allows for app management. A user phase that allows for greater functionality of the player. 

* The app messages the admin when a user song has been made public.
* The app messages the admin when user art is made public.
* The app presents rules and code of conduct to user on account creation.
* The app includes EQ presets.

* A admin can manage the entire app to include music, art and users.
* A admin can remove music from public for the app.
* A admin can remove art from public for the app.
* A admin can pause, block, and remove users.
* A admin can privately message a user.

* A user can upload their music and art to making the song, album, or artist, uniquely their own. 
* A user can make songs public. 
* A user can comment on public music.
* A user can set EQ settings per song.
* A user can connects to a streaming service.

The app has a public side so anyone can see the player and how it works. There is a admin that can manage the app which includes adding public songs and managing users. A user can make their collection their own by uploading songs, associating art work, images or short videos to the song and setting EQ values. There are various models like song, album, artist, genres, to allow users the easily organize, filter and manage their collection.

A user can create an account and upload music. In the form, they can add the audio file for the song, a image for the artist, a short video for the artist, and a image for the album. These larger files are uploaded to S3. The blob key is returned and a url created for these and saved in the database. The view will then use the url for display of the images, video, or audio play.

The music player consist of a banner, the waveform, the loader, the controls. The banner shows the artist image or artist video and can be expanded or shrunk. The average image is 1280px wide by 300px high. Same dimensions for the video. The image is jpg format and the video is mp4 format.

The app uses a javascript library called Wavesurfer to handle the audio. A wavesurfer object is initialized on load. A list of songs are presented under the player. Selecting a song will create custom events that pass information to the player controller which loads the audio url for the wavesurfer object, loads the image or video for the banner, and plays the audio.

Most streaming player like Spotify or Audius have a simple player that is located at the bottom of the page. This player is intended to be visual and is at the top of the page. The waveform is similar to SoundCloud. The player controls currently consist of a previous, play, next icon buttons. There is also two other icon button here. One enables the song to play once loaded. If false then you need to click the play button to play the track. There is a option to play the next track automatically. When this option is false then the track will play and end.

The app is currently only for desktop and has a sidebar along the left side. The right top is the player. Under the player is all the songs available.

## The Global Event Bus
Songs are collected from the database and looped through a song card, below the player. Selecting a song will pass information to the player through the Global Event Bus. This GEB creates and destroys custom events that the banner and player will subscribe to.

Using stimulus, selecting a song with pass these values:
* id value = song.id - ID of the song for specific song
* url value = song.song_file_url - URL for the song in S3
* title value = song.title - The song title
* artist value = song.artist.name - The name of the artist
* banner value = song.artist.image_url - The image for the artist ( 1280 x 300 )
* banner video value = song.artist.banner_video_url - The video for the artist ( 1280 x 300 )
* animated banners enabled value = current_user&.enable_animated_banners || false - show video?

These are passed to the smart image stimulus controller. 




## Active Storage Note
This app originally used Active Storage to quickly get the concept for the player working. The app has been partially migrated to use S3 directly instead of Active Storage. **Current State:**

- **Admin functionality**: Fully migrated to S3 with presigned URLs and direct S3 operations
- **User upload functionality**: Still uses Active Storage attachments (User.profile_image, song/artist/album file uploads in UploadController)
- **Database schema**: Still contains Active Storage tables but they are not actively used
- **S3 operations**: Handled through Aws::S3::Client with presigned URLs for uploads and S3DeleteJob for cleanup

**Migration Status**: The admin song management is fully S3-based, but user-facing upload functionality still relies on Active Storage. The User model retains `has_one_attached :profile_image` for profile pictures. Consider completing the migration to S3 for consistency.

**Key S3 Components:**
- `S3_CLIENT` and `S3_BUCKET_NAME` configured in `config/initializers/aws.rb`
- `PresignsController` for generating presigned URLs
- `S3DeleteJob` for background file deletion
- Direct S3 URL storage in model attributes (song_file_url, image_url, etc.)

# Core Functionality and Data Model
## Schema
```rb
ActiveRecord::Schema[8.0].define(version: 2025_09_02_214855) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admins", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_admins_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admins_on_reset_password_token", unique: true
  end

  create_table "albums", force: :cascade do |t|
    t.string "title"
    t.integer "release_year"
    t.string "cover_art_url"
    t.bigint "genre_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "artist_id", null: false
    t.bigint "user_id"
    t.index ["artist_id"], name: "index_albums_on_artist_id"
    t.index ["genre_id"], name: "index_albums_on_genre_id"
    t.index ["user_id"], name: "index_albums_on_user_id"
  end

  create_table "artists", force: :cascade do |t|
    t.string "name"
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.text "bio"
    t.string "banner_video_url"
    t.index ["user_id"], name: "index_artists_on_user_id"
  end

  create_table "genres", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "playlist_songs", force: :cascade do |t|
    t.bigint "playlist_id", null: false
    t.bigint "song_id", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["playlist_id"], name: "index_playlist_songs_on_playlist_id"
    t.index ["song_id"], name: "index_playlist_songs_on_song_id"
  end

  create_table "playlists", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.boolean "is_public", default: true
    t.string "cover_image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_playlists_on_user_id"
  end

  create_table "song_genres", force: :cascade do |t|
    t.bigint "song_id", null: false
    t.bigint "genre_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["genre_id"], name: "index_song_genres_on_genre_id"
    t.index ["song_id"], name: "index_song_genres_on_song_id"
  end

  create_table "songs", force: :cascade do |t|
    t.string "title"
    t.string "song_image_url"
    t.string "song_file_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "album_id", null: false
    t.bigint "artist_id", null: false
    t.bigint "user_id"
    t.boolean "public", default: false, null: false
    t.index ["album_id"], name: "index_songs_on_album_id"
    t.index ["artist_id"], name: "index_songs_on_artist_id"
    t.index ["user_id"], name: "index_songs_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "username"
    t.text "bio"
    t.string "location"
    t.date "date_of_birth"
    t.string "profile_image_url"
    t.boolean "active", default: true, null: false
    t.boolean "banned", default: false, null: false
    t.datetime "banned_at"
    t.text "ban_reason"
    t.boolean "enable_animated_banners", default: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "albums", "artists"
  add_foreign_key "albums", "genres"
  add_foreign_key "albums", "users"
  add_foreign_key "artists", "users"
  add_foreign_key "playlist_songs", "playlists"
  add_foreign_key "playlist_songs", "songs"
  add_foreign_key "playlists", "users"
  add_foreign_key "song_genres", "genres"
  add_foreign_key "song_genres", "songs"
  add_foreign_key "songs", "albums"
  add_foreign_key "songs", "artists"
  add_foreign_key "songs", "users"
end
```

## AWS S3 Uploads
Consider a track or song as the foundation. When uploading a song you will have the audio file and the album art. Each song has a artist that created it and a album it belongs to, even if it is a single. These are all included in the form. A artist may have a image and / or a live image, (video). Files such as images and audio files are uploaded to S3 in the following way.

### Admin Form - Song Upload
This form for the admin includes all the fields for uploading the song. It uses a stimulus controller to upload the files to s3 and populate the hidden field with the url to be included for save when the form is submitted.

```erb
<%= form_with(model: [ :admin, @song ], local: true) do |form| %>
  <% if form.object.errors.any? %>
        <div>
            <% form.object.errors.full_messages.each do |message|  %>
            <div class="text-red-500"><%= message %></div>
            <% end %>
        </div>
    <% end %>

  <div class="">

    <% if @song.song_image_url.present? %>
      <div id="<%= dom_id(@song, :song_image) %>" class="flex flex-col justify-center items-center">
          <%= image_tag safe_image_url(@song.song_image_url), class: "w-1/3 py-2" %>
          <%= link_to "Remove image", destroy_image_admin_song_path(@song), class: "border border-input-background rounded bg-red-400 py-1 px-2 my-2", data: { turbo_method: :delete, turbo_confirm: "Are you sure?" } %>
      </div>
    <% end %>

    <div class="rounded-sm p-2" data-controller="file-upload">
      <div class="flex items-center my-4">
        <%= label_tag :song_image_upload, "Select Image" %>&nbsp;
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          <span class="text-sm">w-640 x h-640 - 5MB max</span>
        </svg>
      </div>
      <%= file_field_tag :song_image_upload,
          class: "block w-full text-sm border rounded-sm cursor-pointer text-zinc-800 focus:outline-none bg-gray-100 border-gray-100",
          accept: "image/jpeg,image/png,image/webp",
          data: {
            target: "#song_song_image_url",
            action: "change->file-upload#upload"
          } %>
          
      <div class="upload-status" id="image-upload-status"></div>
      
      <%= form.hidden_field :song_image_url %>
    </div>

    <% if @song.song_file_url.present? %>
      <div id="<%= dom_id(@song, :song_file) %>" class="flex flex-col justify-center items-center">
        <div class="w-1/3 py-2">
          <audio controls class="w-full">
            <source src="<%= safe_image_url(@song.song_file_url) %>" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </div>
        
        <%= link_to "Remove audio file",
                    destroy_file_admin_song_path(@song),
                    class: "border border-input-background rounded bg-red-400 py-1 px-2 my-2",
                    data: { turbo_method: :delete, turbo_confirm: "Are you sure?" } %>
      </div>
    <% end %>
    
    <div class="rounded-sm p-2" data-controller="file-upload">
      <div class="flex items-center my-4">
        <%= label_tag :song_file_upload, "Select Audio File" %>&nbsp;
        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          <span class="text-sm">MP3, WAV, OGG, M4A - 50MB max</span>
        </svg>
      </div>
      <%= file_field_tag :song_file_upload,
          class: "block w-full text-sm border rounded-sm cursor-pointer text-zinc-800 focus:outline-none bg-gray-100 border-gray-100",
          accept: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a",
          data: {
            target: "#song_song_file_url",
            action: "change->file-upload#upload"
          } %>

      <div class="upload-status" id="file-upload-status"></div>
      
      <%= form.hidden_field :song_file_url %>
    </div>
    <div class="border border-gray-100 rounded-sm p-2 mt-1">
      <h2 class="text-xl font-medium text-gray-100 align-middle text-center p-2">Song Details</h2>
      <div class="flex justify-between items-center my-2">
        <%= form.label :artist_name, "Artist Name", class: "w-52" %>
        <%= form.text_field :artist_name, value: @song.artist&.name, class: "rounded-sm border border-slate-600 bg-gray-100 text-zinc-800 w-full" %>
      </div>
      
      <% if @song.artist&.image_url.present? %>
        <div id="<%= dom_id(@song, :artist_image) %>" class="flex flex-col justify-center items-center">
            <%= image_tag safe_image_url(@song.artist.image_url), class: "w-1/3 py-2" %>
            <%= link_to "Remove artist image", destroy_artist_image_admin_song_path(@song), class: "border border-input-background rounded bg-red-400 py-1 px-2 my-2", data: { turbo_method: :delete, turbo_confirm: "Are you sure?" } %>
        </div>
      <% end %>

      <div class="rounded-sm p-2 my-2" data-controller="file-upload">
        <div class="flex items-center my-4">
          <%= label_tag :artist_image_upload, "Select Artist Image" %>&nbsp;
          <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            <span class="text-sm">300px high recommended for banners - 5MB max</span>
          </svg>
        </div>
        <%= file_field_tag :artist_image_upload,
            class: "block w-full text-sm border rounded-sm cursor-pointer text-zinc-800 focus:outline-none bg-gray-100 border-gray-100",
            accept: "image/jpeg,image/png,image/webp",
            data: {
              target: "#artist_image_url",
              action: "change->file-upload#upload"
            } %>
            
        <div class="upload-status" id="artist-image-upload-status"></div>
        
        <%= hidden_field_tag :artist_image_url %>
      </div>
      
      <% if @song.artist&.banner_video_url.present? %>
        <div id="<%= dom_id(@song, :artist_banner_video) %>" class="flex flex-col justify-center items-center">
          <div class="w-1/2 py-2">
            <video class="w-full h-auto max-h-64" controls>
              <source src="<%= safe_image_url(@song.artist.banner_video_url) %>" type="video/mp4">
              Your browser does not support the video element.
            </video>
          </div>
          <%= link_to "Remove banner video", destroy_artist_banner_video_admin_song_path(@song), class: "border border-input-background rounded bg-red-400 py-1 px-2 my-2", data: { turbo_method: :delete, turbo_confirm: "Are you sure?" } %>
        </div>
      <% end %>

      <div class="rounded-sm p-2 my-2" data-controller="file-upload">
        <div class="flex items-center my-4">
          <%= label_tag :artist_banner_video_upload, "Select Artist Banner Video" %>&nbsp;
          <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            <span class="text-sm">1280x300 recommended - 20MB MP4 max</span>
          </svg>
        </div>
        <%= file_field_tag :artist_banner_video_upload,
            class: "block w-full text-sm border rounded-sm cursor-pointer text-zinc-800 focus:outline-none bg-gray-100 border-gray-100",
            accept: "video/mp4",
            data: {
              target: "#artist_banner_video_url",
              action: "change->file-upload#upload"
            } %>
            
        <div class="upload-status" id="artist-banner-video-upload-status"></div>
        
        <%= hidden_field_tag :artist_banner_video_url %>
      </div>
      
      <div class="flex justify-between items-center my-2">
        <%= form.label :album_title, "Album Title", class: "w-52" %>
        <%= form.text_field :album_title, value: @song.album&.title, class: "rounded-sm border border-slate-600 bg-gray-100 text-zinc-800 w-full" %>
      </div>
      
      <% if @song.album&.cover_art_url.present? %>
        <div id="<%= dom_id(@song, :album_cover) %>" class="flex flex-col justify-center items-center">
            <%= image_tag safe_image_url(@song.album.cover_art_url), class: "w-1/3 py-2" %>
            <%= link_to "Remove album cover", destroy_album_cover_admin_song_path(@song), class: "border border-input-background rounded bg-red-400 py-1 px-2 my-2", data: { turbo_method: :delete, turbo_confirm: "Are you sure?" } %>
        </div>
      <% end %>

      <div class="rounded-sm p-2 my-2" data-controller="file-upload">
        <div class="flex items-center my-4">
          <%= label_tag :album_cover_upload, "Select Album Cover" %>&nbsp;
          <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            <span class="text-sm">640x640 recommended - 5MB max</span>
          </svg>
        </div>
        <%= file_field_tag :album_cover_upload,
            class: "block w-full text-sm border rounded-sm cursor-pointer text-zinc-800 focus:outline-none bg-gray-100 border-gray-100",
            accept: "image/jpeg,image/png,image/webp",
            data: {
              target: "#album_cover_url",
              action: "change->file-upload#upload"
            } %>
            
        <div class="upload-status" id="album-cover-upload-status"></div>
        
        <%= hidden_field_tag :album_cover_url %>
      </div>
      
      <div class="flex justify-between items-center my-2">
        <%= form.label :title, class: "w-52" %>
        <%= form.text_field :title, class: "rounded-sm border border-slate-600 bg-gray-100 text-zinc-800 w-full" %>
      </div>
      <div class="flex justify-between items-center my-2">
        <%= form.label :genre_ids, "Genres" %>
        <%= form.collection_select :genre_ids, Genre.all, :id, :name, {}, { multiple: true } %>
      </div>
      <div class="flex justify-between items-center my-2">
        <%= form.label :public, "Public", class: "w-52" %>
        <%= form.check_box :public, class: "rounded-sm border border-slate-600 bg-gray-100 text-zinc-800" %>
        <span class="text-sm text-gray-300 ml-2">Check to make this song publicly accessible</span>
      </div>
    </div>
    <%= form.submit "Submit", class: "border border-gray-100 bg-slate-900 text-gray-100 rounded-sm px-6 py-2 mt-2" %>
  </div>
<% end %>
```

### Admin Song Controller
```rb
# Song Controller for Admin
class Admin::SongsController < ApplicationController
  include ActionView::RecordIdentifier

  # Ensure admin is logged in for CRUD actions
  before_action :authenticate_admin!
  # Set song for methods that need it
  before_action :set_song, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file, :destroy_artist_image, :destroy_album_cover, :destroy_artist_banner_video ]
  before_action :ensure_song_editable, only: [ :edit, :update, :destroy, :destroy_image, :destroy_file, :destroy_artist_image, :destroy_album_cover, :destroy_artist_banner_video ]

  # GET /admin/songs
  #
  # Returns all songs. The `format.html` response is the default view for
  # this controller and is used for the index page of the milk admin dashboard.
  # The `format.json` response is used by the JavaScript frontend to populate the data tables.
  def index
    @show_private = params[:show_private] == "true"

    if @show_private
      @songs = Song.all.includes([ :artist, :genres, :user ])
    else
      @songs = Song.where(public: true).includes([ :artist, :genres, :user ])
    end

    respond_to do |format|
      format.html
      format.json { render json: @songs.as_json(
        only: [ :id, :artist, :album, :title, :song_image_url, :song_file_url ]
      )}
    end
  end

  # GET /admin/songs/new
  #
  # Initializes a new Song object.
  # The `new` action is used to display a form for creating a new song.

  def new
    @song = Song.new
  end

  def edit; end

  # POST /admin/songs
  #
  # Creates a new song using provided song parameters.
  #
  # On success:
  # - Sets the song image URL if an image is attached.
  # - Sets the song file URL if a file is attached.
  # - Redirects to the songs listing page with a success notice.
  # - Renders the blog as JSON with a 201 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.

  def create
    @song = Song.new(song_params_without_associations)

    artist = nil
    album = nil

    # Handle artist first
    if params[:song][:artist_name].present?
      artist = Artist.find_or_create_by(name: params[:song][:artist_name])
      # Update artist image if provided
      if params[:artist_image_url].present?
        artist.update(image_url: params[:artist_image_url])
      end
      # Update artist banner video if provided
      if params[:artist_banner_video_url].present?
        artist.update(banner_video_url: params[:artist_banner_video_url])
      end
      @song.artist = artist
    end

    # Handle album second (after artist is available)
    if params[:song][:album_title].present? && artist.present?
      album = Album.find_or_create_by(title: params[:song][:album_title], artist_id: artist.id, user_id: nil)
      # Update album cover if provided
      if params[:album_cover_url].present?
        album.update(cover_art_url: params[:album_cover_url])
      end
      @song.album = album
    end

    respond_to do |format|
      if @song.save
        format.html { redirect_to admin_songs_path, notice: "Song was successfully added." }
        format.json { render json: @song }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /admin/songs/1
  #
  # Updates a song using the given song parameters.
  #
  # On success:
  # - Sets the song image URL if an image is attached.
  # - Sets the song file URL if a file is attached.
  # - Redirects to the songs listing page with a success notice.
  # - Renders the song as JSON with a 201 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def update
    artist = nil
    album = nil

    # Handle artist first
    if params[:song][:artist_name].present?
      artist = Artist.find_or_create_by(name: params[:song][:artist_name])
      # Update artist image if provided
      if params[:artist_image_url].present?
        artist.update(image_url: params[:artist_image_url])
      end
      # Update artist banner video if provided
      if params[:artist_banner_video_url].present?
        artist.update(banner_video_url: params[:artist_banner_video_url])
      end
      @song.artist = artist
    end

    # Handle album second (after artist is available)
    if params[:song][:album_title].present? && artist.present?
      album = Album.find_or_create_by(title: params[:song][:album_title], artist_id: artist.id, user_id: nil)
      # Update album cover if provided
      if params[:album_cover_url].present?
        album.update(cover_art_url: params[:album_cover_url])
      end
      @song.album = album
    end

    respond_to do |format|
      if @song.update(song_params_without_associations)
        format.html { redirect_to admin_songs_path, notice: "Song was successfully updated." }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/songs/1
  #
  # Destroys a song any associated file and any associated image.
  #
  # On success:
  # - Redirects to the songs listing page with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the new song form with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy
    S3DeleteJob.perform_now(@song.song_image_url) if @song.song_image_url.present?
    S3DeleteJob.perform_now(@song.song_file_url) if @song.song_file_url.present?

    respond_to do |format|
      if @song.destroy
        format.html { redirect_to admin_songs_path, status: :see_other, notice: "Song, file and image were successfully destroyed." }
        format.json { head :no_content }
      else
        format.html { redirect_to admin_songs_path, alert: "Failed to destroy the song." }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_image
  #
  # Destroys the associated image from the song - aws-s3.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the edit page of the song with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy_image
    if @song.song_image_url.present?
      S3DeleteJob.perform_now(@song.song_image_url) # Delete from S3 immediately
      @song.update(song_image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_image")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No image to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_file
  #
  # Destroys the associated audio file from the song - aws-s3.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders the song as JSON with a 204 status code.
  #
  # On failure:
  # - Renders the edit page of the song with an unprocessable entity status.
  # - Renders the errors as JSON with an unprocessable entity status.
  def destroy_file
    if @song.song_file_url.present?
      S3DeleteJob.perform_now(@song.song_file_url) # Delete from S3 immediately
      @song.update(song_file_url: nil) # Clear the URL

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "song_file")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No file to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_artist_image
  #
  # Destroys the associated artist image from S3 and clears the artist's image_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the image element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_artist_image
    if @song.artist&.image_url.present?
      S3DeleteJob.perform_now(@song.artist.image_url) # Delete from S3 immediately
      @song.artist.update(image_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "artist_image")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No artist image to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_album_cover
  #
  # Destroys the associated album cover from S3 and clears the album's cover_art_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the cover element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_album_cover
    if @song.album&.cover_art_url.present?
      S3DeleteJob.perform_now(@song.album.cover_art_url) # Delete from S3 immediately
      @song.album.update(cover_art_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "album_cover")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No album cover to remove." }
      end
    end
  end

  # DELETE /admin/songs/1/destroy_artist_banner_video
  #
  # Destroys the associated artist banner video from S3 and clears the artist's banner_video_url.
  #
  # On success:
  # - Redirects to the edit page of the song with a success notice.
  # - Renders a turbo_stream response to remove the video element.
  #
  # On failure:
  # - Redirects to the edit page of the song with an alert.
  def destroy_artist_banner_video
    if @song.artist&.banner_video_url.present?
      S3DeleteJob.perform_now(@song.artist.banner_video_url) # Delete from S3 immediately
      @song.artist.update(banner_video_url: nil) # Clear the URL from the database

      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song) }
        format.turbo_stream { render turbo_stream: turbo_stream.remove(ActionView::RecordIdentifier.dom_id(@song, "artist_banner_video")) }
      end
    else
      respond_to do |format|
        format.html { redirect_to edit_admin_song_path(@song), alert: "No artist banner video to remove." }
      end
    end
  end

  private

  # Strong parameters method for song attributes.
  #
  # Ensures only the permitted attributes are allowed from the params hash.
  #
  # @return [ActionController::Parameters] filtered parameters for creating or updating a song.

  def song_params
    params.require(:song).permit(:artist_name,
                                 :album_title,
                                 :title,
                                 :song_image_url,
                                 :song_file_url,
                                 :public,
                                 genre_ids: [])
  end

  def song_params_without_associations
    params.require(:song).permit(:title,
                                 :song_image_url,
                                 :song_file_url,
                                 :public,
                                 genre_ids: [])
  end

  # Finds the song with the given id and assigns it to the @song instance variable.
  #
  # This method is called by the before_action callback in the SongController and
  # is used by multiple actions in the controller to fetch the song related to
  # the current request.
  def set_song
    @song = Song.find(params[:id])
  end

  # Check if the current song is editable by admin
  # Admin can only edit:
  # - Public songs (public: true)
  # - Songs without a user (user_id: nil) - these are admin-created songs
  def ensure_song_editable
    unless song_admin_editable?(@song)
      redirect_to admin_songs_path, alert: "Cannot edit private user songs. Only public songs and admin-created songs can be edited."
    end
  end

  # Helper method to determine if a song is editable by admin
  def song_admin_editable?(song)
    song.public? || song.user_id.nil?
  end

  # Make the helper method available to views
  helper_method :song_admin_editable?
end
```

### Presigns Controller
```rb
class PresignsController < ApplicationController
  def create
    # Generate a unique key for the S3 object.
    # The format `uploads/{uuid}/{filename}` is a good practice.
    key = "uploads/#{SecureRandom.uuid}/#{params[:filename]}"

    # Create a presigned URL for a PUT request
    presigner = Aws::S3::Presigner.new(client: S3_CLIENT)

    # URL is valid for 5 minutes. The client MUST use this exact URL to upload.
    presigned_url = presigner.presigned_url(
      :put_object,
      bucket: S3_BUCKET_NAME,
      key: key,
      expires_in: 300 # seconds
    )

    # The public URL is what you'll save in your database
    public_url = "https://#{S3_BUCKET_NAME}.s3.#{Aws.config[:region]}.amazonaws.com/#{key}"

    render json: { presigned_url: presigned_url, public_url: public_url }
  end
end
```

### File Upload Controller - Stimulus
```js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="file-upload"
export default class extends Controller {
  static targets = ["input", "status", "hiddenField"]

  connect() {
    console.log("🔍 DEBUG: File upload controller connected")
  }

  async upload(event) {
    const file = event.target.files[0]
    if (!file) {
      console.log("🔍 DEBUG: No file selected")
      return
    }

    console.log("🔍 DEBUG: File selected:", file.name)
    
    // Find the corresponding hidden field and status div
    const inputElement = event.target
    const hiddenFieldSelector = inputElement.dataset.target
    const hiddenField = document.querySelector(hiddenFieldSelector)
    const statusDiv = inputElement.nextElementSibling
    
    console.log("🔍 DEBUG: Hidden field:", hiddenField)
    console.log("🔍 DEBUG: Status div:", statusDiv)

    if (!hiddenField) {
      console.error("🔍 DEBUG: Hidden field not found for selector:", hiddenFieldSelector)
      return
    }

    if (statusDiv) {
      statusDiv.textContent = 'Preparing to upload...'
    }

    try {
      // 1. Get presigned URL from Rails
      console.log("🔍 DEBUG: Requesting presigned URL for:", file.name)
      const presignResponse = await fetch(`/presigns?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })

      if (!presignResponse.ok) {
        throw new Error(`Presign request failed: ${presignResponse.status}`)
      }

      const presignData = await presignResponse.json()
      console.log("🔍 DEBUG: Got presigned URL data:", presignData)

      if (statusDiv) {
        statusDiv.textContent = 'Uploading to S3...'
      }

      // 2. Upload directly to S3
      const uploadResponse = await fetch(presignData.presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (uploadResponse.ok) {
        console.log("🔍 DEBUG: S3 upload successful")
        if (statusDiv) {
          statusDiv.textContent = '✅ Upload complete!'
        }
        // Set the public URL in the hidden field
        hiddenField.value = presignData.public_url
        console.log("🔍 DEBUG: Hidden field updated with:", presignData.public_url)
      } else {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`)
      }

    } catch (error) {
      console.error('🔍 DEBUG: Upload error:', error)
      if (statusDiv) {
        statusDiv.textContent = '❌ Upload failed.'
      }
    }
  }
}
```

### Initializer S3
```rb
require "aws-sdk-s3"

Aws.config.update(
  region: "us-east-2"
)

S3_CLIENT = Aws::S3::Client.new(
  access_key_id: Rails.application.credentials.aws[:access_key_id],
  secret_access_key: Rails.application.credentials.aws[:secret_access_key]
)

S3_BUCKET_NAME = "zuke"
```

## Song Model
```rb
class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true, inverse_of: :songs
  belongs_to :user, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres


  validates :title, presence: true
  validates :artist, presence: true
  validates :song_file_url, presence: true
  validates :song_image_url, presence: true

  # Virtual attributes for form handling
  attr_accessor :artist_name, :album_title

  # Make delegations safe by allowing nil
  delegate :name, to: :artist, prefix: true, allow_nil: true
  delegate :title, to: :album, prefix: true, allow_nil: true

  scope :by_user, ->(user) { where(user: user) }
  scope :public_songs, -> { where(public: true) }
  scope :accessible_to_user, ->(user) {
    if user.present?
      # Authenticated users: public songs + their own private songs
      where("public = ? OR user_id = ?", true, user.id)
    else
      # Non-authenticated users: only public songs
      where(public: true)
    end
  }

  def owned_by?(user)
    self.user == user
  end

  def image_url
    song_image_url || artist&.image_url
  end
end
```

## Album Model
```rb
class Album < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :artist, optional: false
  belongs_to :genre, optional: true

  has_many :songs, dependent: :destroy, inverse_of: :album
  has_many :song_genres, through: :songs
  has_many :genres, through: :song_genres

  # Validations
  validates :title, presence: true
  validates :title, uniqueness: { scope: [ :artist_id, :user_id ], message: "already exists for this artist and user" }
  validates :artist, presence: true

  delegate :name, to: :artist, prefix: true

  scope :by_user, ->(user) { where(user: user) }
  scope :public_albums, -> { where(user: nil) }

  def owned_by?(user)
    self.user == user
  end

  def cover_url
    cover_art_url
  end
end
```

## Artist Model
```rb
class Artist < ApplicationRecord
  belongs_to :user, optional: true

  has_many :songs, dependent: :destroy
  has_many :albums, dependent: :destroy
  has_many :song_genres, through: :songs
  has_many :genres, through: :song_genres

  # Validations
  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, message: "already exists for this user" }
  validates :bio, length: { maximum: 2000 }

  scope :by_user, ->(user) { where(user: user) }
  scope :public_artists, -> { where(user: nil) }

  def owned_by?(user)
    self.user == user
  end

  def image_url
    read_attribute(:image_url)
  end

  def banner_video_url
    read_attribute(:banner_video_url)
  end

  def has_banner_video?
    banner_video_url.present?
  end
end
```

## View Information
### Music Main
The main music page includes the sidebar, player, and song cards.
```erb
<section class="bg-gray-50 text-gray-900 w-full min-h-screen" data-controller="sidebar" data-action="click@window->sidebar#closeMenu">
  <div class="flex w-full relative">
    <!-- Mobile Menu Button -->
    <button class="fixed top-4 left-4 z-50 md:hidden bg-white rounded-lg p-2 shadow-lg hover:shadow-md transition-shadow duration-200"
            data-action="click->sidebar#toggleMobileMenu">
      <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>

    <!-- Sidebar (responsive width) -->
    <%= render "music/components/sidebar/root" %>

    <!-- Main Content Area (flexible width with responsive margins) -->
    <div class="bg-gray-50 relative flex flex-col h-screen flex-1 ml-0 md:ml-16 lg:ml-60 transition-all duration-300">
      <!-- Music Player (fixed height) -->
      <div class="sticky top-0 z-20 bg-white shadow-sm">
        <%= render partial: "shared/music_player" %>
      </div>
      
      <!-- Scrollable Turbo Frame Content -->
      <div class="flex-1 overflow-y-auto flex justify-center bg-gray-50">
        <div class="w-full max-w-4xl px-6">
          <%= turbo_frame_tag "music-frame" do %>
            <%= render partial: "music/turbo_frames/index", songs: @songs %>
          <% end %>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Sidebar
```erb
<div class="fixed top-0 left-0 z-40 h-screen bg-white text-gray-900 transition-all duration-500 ease-out
            w-60 lg:w-60 md:w-16
            -translate-x-full md:translate-x-0
            shadow-lg md:shadow-none border-r border-gray-200 hover:shadow-xl"
     data-sidebar-target="sidebar">

  <nav class="flex flex-col justify-start h-full overflow-y-auto">
    <%= render 'music/components/sidebar/header' %>
    <%= render 'music/components/sidebar/dropdown_menu' %>
    <%= render 'music/components/sidebar/main_nav' %>
    <%#= render 'music/components/sidebar/most_played', songs: @songs %>
  </nav>
</div>

<!-- Mobile Overlay -->
<div class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden opacity-0 pointer-events-none transition-all duration-500 ease-out hover:bg-opacity-60"
     data-sidebar-target="overlay"
     data-action="click->sidebar#closeMobileMenu">
</div>
```
### Music Player
```erb
<!-- Music Player -->
<div data-controller="music--player" class="flex flex-col w-full">
  <!-- Banner Section -->
  <!-- This partial will change the default banner image to the song's or playlist's image -->
  <%= render "music/components/player/banner",
             banner_image: @banner_image,
             banner_video: @banner_video,
             title: @banner_title,
             subtitle: @banner_subtitle %>

  <div class="flex justify-center items-center bg-gray-900 text-white">
    <div class="flex flex-col items-center">
      <%= render "music/components/player/time_display" do %>
        <div class="flex flex-col w-[768px]">
          <div data-music--player-target="waveform" class="mx-2 px-2"></div>
          <div class="h-1 bg-gray-700 relative rounded-full">
            <div data-music--player-target="loadingProgress"
                class="absolute top-0 left-0 h-full bg-lime-500 transition-all duration-300 rounded-full"
                style="width: 0%">
            </div>
          </div>
        </div>
      <% end %>

      <div class="flex items-center my-1 w-full">
        <!-- Replace the old buttons with: -->
        <%= render "music/components/player/playback_controls", playing: @playing %>
      </div>
    </div>
  </div>
</div>
```
### Song Card
```erb
<div data-controller="music--smart-image"
     data-music--smart-image-id-value="<%= song.id %>"
     data-music--smart-image-url-value="<%= song.song_file_url %>"
     data-music--smart-image-title-value="<%= song.title %>"
     data-music--smart-image-artist-value="<%= song.artist.name %>"
     data-music--smart-image-banner-value="<%= song.artist.image_url %>"
     data-music--smart-image-banner-video-value="<%= song.artist.banner_video_url %>" 
     data-music--smart-image-animated-banners-enabled-value="<%= current_user&.enable_animated_banners || false %>"
     class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 hover:border-[#00B1D1]/20 hover:bg-[#00B1D1]/10">
  
  <div class="flex items-center p-3 sm:p-4 space-x-3 sm:space-x-4"
       data-music--smart-image-target="playButton"
       data-action="click->music--smart-image#playRequest">
    
    <!-- Artwork Section -->
    <div class="flex-shrink-0">
      <img class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-gray-200 hover:border-[#00B1D1]/30 transition-colors duration-200"
           src="<%= song.song_image_url.present? ? song.song_image_url : (song.album&.cover_art_url.present? ? song.album.cover_art_url : song.artist.image_url) %>"
           alt="<%= song.title %>" />
    </div>
    
    <!-- Content Section -->
    <div class="flex-1 min-w-0">
      <!-- Primary Info -->
      <div class="mb-1">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 truncate hover:text-purple-600 transition-colors">
          <%= song.title %>
        </h3>
        <p class="text-sm sm:text-base text-gray-600 truncate">
          <%= song.artist.name %>
        </p>
      </div>
      
      <!-- Secondary Info - Hidden on very small screens -->
      <div class="space-y-1 hidden sm:block">
        <% if song.album.present? %>
          <p class="text-sm text-gray-500 truncate">
            <span class="font-medium">Album:</span> <%= song.album.title %>
            <% if song.album.release_year.present? %>
              <span class="text-gray-400">(<%= song.album.release_year %>)</span>
            <% end %>
          </p>
        <% end %>
        
        <% if song.genres.any? %>
          <p class="text-sm text-gray-500 truncate">
            <span class="font-medium">Genres:</span> <%= song.genres.pluck(:name).join(', ') %>
          </p>
        <% end %>
      </div>
    </div>
    
    <!-- Play Indicator -->
    <div class="flex-shrink-0">
      <div class="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-[#00B1D1]/10 hover:bg-[#00B1D1]/20 flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-manipulation">
        <svg class="w-4 h-4 sm:w-3 sm:h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 5v10l8-5-8-5z"/>
        </svg>
      </div>
    </div>
  </div>
</div>
```

## Stimulus Controllers
### Sidebar
```js
// app/javascript/controllers/sidebar_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "link", "menu", "sidebar", "overlay" ]

  connect() {
    // Set the initial active link (Home in this case)
    if (this.linkTargets.length > 0) {
      this.setActive(this.linkTargets[0])
    }
    
    // Handle window resize for responsive behavior
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
    this.handleResize() // Initial check
  }

  disconnect() {
    window.removeEventListener('resize', this.handleResize)
  }

  setActive(event) {
    // If event is a mouse event, get the target element
    const element = event.currentTarget || event
    
    // Remove active class from all links
    this.linkTargets.forEach(link => {
      link.classList.remove("bg-[#00B1D1]", "text-white")
      link.classList.add("text-gray-600")
    })
    
    // Add active class to clicked link
    element.classList.add("bg-[#00B1D1]", "text-white")
    element.classList.remove("text-gray-600")
    
    // Close mobile menu after navigation on mobile
    if (window.innerWidth < 768) {
      this.closeMobileMenu()
    }
  }

  toggleMenu() {
    if (this.hasMenuTarget) {
      this.menuTarget.classList.toggle("hidden")
    }
  }

  toggleMobileMenu() {
    if (this.hasSidebarTarget && this.hasOverlayTarget) {
      const sidebar = this.sidebarTarget
      const overlay = this.overlayTarget
      
      if (sidebar.classList.contains('-translate-x-full')) {
        // Show sidebar
        sidebar.classList.remove('-translate-x-full')
        overlay.classList.remove('opacity-0', 'pointer-events-none')
        overlay.classList.add('opacity-100')
        document.body.style.overflow = 'hidden'
      } else {
        // Hide sidebar
        this.closeMobileMenu()
      }
    }
  }

  closeMobileMenu() {
    if (this.hasSidebarTarget && this.hasOverlayTarget) {
      const sidebar = this.sidebarTarget
      const overlay = this.overlayTarget
      
      sidebar.classList.add('-translate-x-full')
      overlay.classList.add('opacity-0', 'pointer-events-none')
      overlay.classList.remove('opacity-100')
      document.body.style.overflow = ''
    }
  }

  closeMenu(e) {
    // Close dropdown menu if clicking outside
    if (this.hasMenuTarget && !this.element.contains(e.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }

  handleResize() {
    // Auto-close mobile menu on desktop
    if (window.innerWidth >= 768) {
      this.closeMobileMenu()
    }
  }
}
```

### Music Player
```js
import { Controller } from "@hotwired/stimulus"
import WaveSurfer from "wavesurfer.js"

/**
 * Global Audio Player Controller
 * 
 * Manages core audio playback functionality including:
 * - WaveSurfer initialization and management
 * - Track loading and playback control
 * - Event handling and state management
 * - Error handling and recovery
 */
export default class extends Controller {
  // ========================
  //  Configuration
  // ========================

  /**
   * DOM Element Targets
   * @type {string[]}
   */
  static targets = [
    "waveform",          // WaveSurfer visualization container
    "loadingProgress",   // Loading progress bar element
  ]

  /**
   * Controller Values
   * @type {Object}
   */
  static values = {
    autoAdvance: { type: Boolean, default: false },
  }


  /**
   * Current track URL reference
   * @type {?string}
   */
  currentUrl = null

  // ========================
  //  Lifecycle Methods
  // ========================

  /**
   * Initialize controller when connected to DOM
   * Sets up WaveSurfer instance and event listeners
   */
  connect() {
    this.initializeWaveSurfer();
    this.setupEventListeners();
  
    // 1. Initialize playback state from localStorage
    const autoAdvance = localStorage.getItem('playerAutoAdvance') === 'true';
    this.autoAdvanceValue = autoAdvance;

    const playOnLoad = localStorage.getItem('audioPlayOnLoad') === 'true';
    this.playOnLoadValue = playOnLoad;
    
    // 2. Initialize banner state - ensure default banner is set if none exists
    if (!localStorage.getItem('currentBanner')) {
      localStorage.setItem('currentBanner', 'music_files/home-banner.jpg');
    }
    
    // 3. Initialize queue state
    this.currentQueue = [];
    this.currentIndex = -1;
    this.currentUrl = null;
  
    // 4. Sync initial states
    document.dispatchEvent(new CustomEvent("player:auto-advance:changed", {
      detail: { enabled: this.autoAdvanceValue }
    }));

    document.dispatchEvent(new CustomEvent("player:play-on-load:changed", {
      detail: { enabled: this.playOnLoadValue }
    }));
  
    // 5. Queue listener remains important!
    document.addEventListener("player:queue:updated", (event) => {
      
      // Improved queue update with validation
      this.currentQueue = Array.isArray(event.detail.queue) ? event.detail.queue : [];
      
      // More robust index finding
      this.currentIndex = this.currentQueue.findIndex(song => {
        return song?.url === this.currentUrl;
      });
    });
  }

  /**
   * Clean up when controller is disconnected
   * Stops playback and destroys WaveSurfer instance
   */
  disconnect() {
    this.destroyWaveSurfer()
  }

  // ========================
  //  Core Audio Setup
  // ========================

  /**
   * Initialize WaveSurfer audio instance
   * Creates and configures the WaveSurfer player with visualization options
   */
  initializeWaveSurfer() {
    try {
      this.wavesurfer = WaveSurfer.create({
        container: this.waveformTarget,
        waveColor: "#00B1D1",
        progressColor: "#01DFB6",
        height: 50,
        minPxPerSec: 50,
        hideScrollbar: true,
        autoScroll: true,
        autoCenter: true,
        dragToSeek: true,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        responsive: true,
        backend: "WebAudio"
      })
      this.setupWaveSurferEvents()
    } catch (error) {
      console.error("WaveSurfer initialization failed:", error)
      this.element.classList.add("player-error-state")
    }
  }

  /**
   * Set up WaveSurfer event listeners
   * Handles playback state changes, loading progress, and errors
   */
  setupWaveSurferEvents() {
    // Playback state events
    this.wavesurfer.on("ready", this.handleTrackReady.bind(this))
    this.wavesurfer.on("play", this.handlePlay.bind(this))
    this.wavesurfer.on("pause", this.handlePause.bind(this))
    this.wavesurfer.on("finish", this.handleTrackEnd.bind(this))
    
    // Loading events
    this.wavesurfer.on("loading", this.handleLoadingProgress.bind(this))
    this.wavesurfer.on("error", this.handleAudioError.bind(this))
    
    // Time updates
    this.wavesurfer.on("timeupdate", this.updateTimeDisplay.bind(this))
  }

  // ========================
  //  Event Handling
  // ========================

  /**
   * Set up custom DOM event listeners
   * Listens for external playback commands
   */
  setupEventListeners() {
    // Existing listeners
    window.addEventListener("player:play-requested", this.handlePlayRequest.bind(this));
    document.addEventListener("player:play", () => this.wavesurfer.play());
    document.addEventListener("player:pause", () => this.wavesurfer.pause());

    document.addEventListener("player:auto-advance:changed", (event) => {
      this.autoAdvanceValue = event.detail.enabled
    })

    document.addEventListener("player:play-on-load:changed", (event) => {
      this.playOnLoadValue = event.detail.enabled
    })
  
    // Add the queue update listener
    document.addEventListener("player:queue:updated", (event) => {
      this.currentQueue = event.detail.queue;
      
      // Sync index if we're already playing a song
      if (this.currentUrl) {
        const currentSong = this.currentQueue.find(song => song.url === this.currentUrl);
        if (currentSong) {
          this.setCurrentIndex(currentSong.id);
        }
      }
    });
  }

  // ========================
  //  Playback State Handlers
  // ========================

  /**
   * Handle track loaded and ready to play
   * Updates UI and dispatches ready state
   */
  handleTrackReady() {
    try {
      this.updateTimeDisplay(0)
      this.hideLoadingIndicator()
      this.dispatchStateChange()
    } catch (error) {
      console.error("Error handling track ready:", error)
      this.handleAudioError()
    }
  }

  /**
   * Handle play state change
   */
  handlePlay() {
    this.dispatchStateChange(true)
  }

  /**
   * Handle pause state change
   */
  handlePause() {
    this.dispatchStateChange(false)
  }

  /**
   * Handle track ending naturally
   */
  handleTrackEnd() {
    this.handlePause()
    this.resetPlayback()
    window.dispatchEvent(new CustomEvent("audio:ended", {
      detail: { url: this.currentUrl }
    }))

    if (this.autoAdvanceValue && this.currentQueue.length > 0) {
      this.playNext()
    }
  }

  /**
   * Dispatch player state change event
   * @param {boolean} [playing] - Optional play/pause state
   */
  dispatchStateChange(playing) {
    document.dispatchEvent(new CustomEvent("player:state:changed", {
      detail: { 
        playing: playing ?? this.wavesurfer.isPlaying(),
        url: this.currentUrl 
      }
    }))
  }

  // ========================
  //  Playback Control
  // ========================

  /**
   * Handle external play event (from song cards)
   * @param {Event} e - Custom play event containing track details
   */
  handlePlayRequest(e) {
    try {
      const { id, url, title, artist, banner, bannerVideo, animatedBannersEnabled, playOnLoad = false, updateBanner } = e.detail

      // DEBUG: Log received event data
      console.log("🎵 PLAYER: Received player:play-requested event")
      console.log("🎵 PLAYER: Event detail received:", e.detail)
      console.log("🎵 PLAYER: Destructured values:", {
        id, url, title, artist, banner, playOnLoad, updateBanner
      })
      console.log("🎵 PLAYER: Banner value analysis:", {
        bannerRaw: banner,
        bannerType: typeof banner,
        bannerEmpty: banner === "",
        bannerUndefined: banner === undefined,
        bannerNull: banner === null
      })

      this.setCurrentIndex(id)

      if (updateBanner !== false) {
        console.log("🎵 PLAYER: About to call updateBanner with:", { banner, bannerVideo, title, artist })
        console.log("🎵 PLAYER: Banner being passed to updateBanner:", banner)
        console.log("🎵 PLAYER: Banner video being passed to updateBanner:", bannerVideo)
        this.updateBanner({ banner, bannerVideo, title, artist, animatedBannersEnabled })
      } else {
        console.log("🎵 PLAYER: Skipping banner update (updateBanner === false)")
      }
      
      if (!this.wavesurfer || this.currentUrl !== url) {
        this.loadTrack(url, playOnLoad)
      } else {
        this.togglePlayback()
      }
    } catch (error) {
      console.error("Error handling play event:", error)
      this.handleAudioError()
    }
  }

  /**
   * Dispatch play request for a song
   * @param {Object} song - Song object
   */
  dispatchPlayRequest(song) {
    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: {
        url: song.url,
        title: song.title,
        artist: song.artist,
        banner: song.banner,
        bannerVideo: song.bannerVideo,
        autoplay: true,
        updateBanner: true
      }
    }))
  }

  /**
   * Play the next song in queue
   */
  playNext() {
    if (this.currentQueue.length === 0) return
    
    this.currentIndex = (this.currentIndex + 1) % this.currentQueue.length
    const nextSong = this.currentQueue[this.currentIndex]
    this.playSongFromQueue(nextSong)
  }

  playPrevious() {
    if (this.currentQueue.length === 0) return
    
    this.currentIndex = (this.currentIndex - 1 + this.currentQueue.length) % this.currentQueue.length
    const prevSong = this.currentQueue[this.currentIndex]
    this.playSongFromQueue(prevSong)
  }

  playSongFromQueue(song) {
    try {
      // Update banner and global state for auto-advance
      this.updateBanner({
        banner: song.banner,
        bannerVideo: song.bannerVideo,
        title: song.title,
        artist: song.artist
      })
      
      this.loadTrack(song.url, true) // Always autoplay when advancing
    } catch (error) {
      console.error("Error playing from queue:", error)
      this.handleAudioError()
    }
  }


  /**
   * Toggle between play and pause states
   */
  togglePlayback() {
    this.wavesurfer.playPause()
  }

  // ========================
  //  Track Loading
  // ========================

  /**
   * Load a new audio track
   * @param {string} url - Audio file URL
   * @param {boolean} [playOnLoad=false] - Whether to playOnLoad when loaded
   */
  loadTrack(url, playOnLoad = false) {
    try {
      this.resetPlayback()
      this.showLoadingIndicator()
      this.dispatchTrackChange(url)
      
      this.wavesurfer.load(url)
      this.setupPlayOnLoad(playOnLoad)
    } catch (error) {
      console.error("Error loading track:", error)
      this.handleAudioError()
    }
  }

  /**
   * Reset playback state before loading new track
   */
  resetPlayback() {
    this.wavesurfer?.pause()
    this.wavesurfer?.setTime(0)
  }

  /**
   * Dispatch track change event
   * @param {string} url - New track URL
   */
  dispatchTrackChange(url) {
    this.currentUrl = url
    window.dispatchEvent(new CustomEvent("audio:changed", { detail: { url } }))
  }

  /**
   * Configure playOnLoad if requested
   * @param {boolean} playOnLoad - Whether to playOnLoad
   */
  setupPlayOnLoad(playOnLoad) {
    if (playOnLoad) {
      this.wavesurfer.once("ready", () => {
        this.wavesurfer.play()
      })
    }
  }

  /**
   * Toggle autoAdvance state
   */
  toggleAutoAdvance() {
    this.autoAdvanceValue = !this.autoAdvanceValue
    this.updateAutoAdvanceUI()
    
    // Dispatch event to inform other components
    document.dispatchEvent(new CustomEvent("player:auto-advance:changed", {
      detail: { enabled: this.autoAdvanceValue }
    }))
  }

  // Set the current index in the queue
  // Use selected song ID to relate to position in queue
  setCurrentIndex(songId) {
    if (!this.currentQueue || this.currentQueue.length === 0) {
      console.warn("Cannot set index for empty queue");
      this.currentIndex = -1;
      return;
    };
    
    // Find the index by matching ID
    const index = this.currentQueue.findIndex(song => song.id.toString() === songId.toString());
    
    if (index >= 0) {
      this.currentIndex = index;
    } else {
      console.warn("Song ID not found in queue:", songId);
      this.currentIndex = 0; // Fallback to first song
    }
  }

  // ========================
  //  UI Updates
  // ========================

  /**
   * Update time display
   * @param {number} currentTime - Current playback position in seconds
   */
  updateTimeDisplay(currentTime) {
    if (this.wavesurfer.getDuration()) {
      document.dispatchEvent(new CustomEvent("player:time:update", {
        detail: {
          current: currentTime,
          duration: this.wavesurfer.getDuration()
        }
      }))
    }
  }

  /**
   * Update banner display
   * @param {Object} details - Banner details
   */
  updateBanner({ banner, bannerVideo, title, artist, animatedBannersEnabled }) {
    // DEBUG: Log input parameters
    console.log("🎵 PLAYER: updateBanner called with:", { banner, bannerVideo, title, artist })
    console.log("🎵 PLAYER: Banner parameter analysis:", {
      bannerRaw: banner,
      bannerVideoRaw: bannerVideo,
      bannerType: typeof banner,
      bannerVideoType: typeof bannerVideo,
      bannerTruthy: !!banner,
      bannerVideoTruthy: !!bannerVideo,
      bannerFallbackTriggered: !banner
    })
    
    // Update global banner state for future comparisons
    const newBanner = banner || "music_files/home-banner.jpg"
    console.log("🎵 PLAYER: newBanner resolved to:", newBanner)
    localStorage.setItem("currentBanner", newBanner)
    
    const bannerEventDetail = {
      image: banner, // Pass the actual banner (could be null for fallback)
      video: bannerVideo, // Pass the banner video URL
      title: title || "Unknown Track",
      subtitle: artist || "Unknown Artist",
      animatedBannersEnabled: animatedBannersEnabled
    }
    
    console.log("🎵 PLAYER: bannerEventDetail.image being sent:", bannerEventDetail.image)
    console.log("🎵 PLAYER: bannerEventDetail.video being sent:", bannerEventDetail.video)
    console.log("🎵 PLAYER: Dispatching music:banner:update with detail:", bannerEventDetail)
    
    document.dispatchEvent(new CustomEvent("music:banner:update", {
      detail: bannerEventDetail
    }))
  }

  /**
   * Update autoplay button UI
   */
  updateAutoAdvanceUI() {
    const btn = this.element.querySelector("#autoAdvance-toggle")
    if (this.autoAdvanceValue) {
      btn.classList.add("text-green-400")
      btn.classList.remove("text-gray-400")
    } else {
      btn.classList.add("text-gray-400")
      btn.classList.remove("text-green-400")
    }
  }

  // ========================
  //  Loading States
  // ========================

  /**
   * Handle loading progress updates
   * @param {number} progress - Loading percentage (0-100)
   */
  handleLoadingProgress(progress) {
    const smoothedProgress = this.calculateSmoothedProgress(progress)
    this.loadingProgressTarget.style.width = `${smoothedProgress}%`
    
    if (progress === 100) {
      setTimeout(() => this.completeLoading(), 500)
    }
  }

  /**
   * Calculate smoothed loading progress
   */
  calculateSmoothedProgress(progress) {
    const currentWidth = parseFloat(this.loadingProgressTarget.style.width) || 0
    return currentWidth + (progress - currentWidth) * 0.3 // Smoothing factor
  }

  /**
   * Complete loading transition
   */
  completeLoading() {
    this.loadingProgressTarget.classList.add("transition-none")
    this.loadingProgressTarget.style.width = "100%"
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    this.loadingProgressTarget.style.width = "0%"
    this.loadingProgressTarget.classList.remove("transition-none")
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    this.loadingProgressTarget.style.width = "0%"
    this.loadingProgressTarget.classList.remove("transition-none")
  }

  /**
   * Set the current play queue
   * @param {Array} queue - Array of song objects
   */
  setQueue(queue) {
    this.currentQueue = queue
    this.currentIndex = queue.findIndex(song => song.url === this.currentUrl)
  }

  // ========================
  //  Error Handling
  // ========================

  /**
   * Handle audio errors
   */
  handleAudioError() {
    this.hideLoadingIndicator()
    window.dispatchEvent(new CustomEvent("audio:error", {
      detail: { url: this.currentUrl }
    }))
  }

  // ========================
  //  Cleanup
  // ========================

  /**
   * Properly destroy WaveSurfer instance
   */
  destroyWaveSurfer() {
    if (this.wavesurfer) {
      try {
        this.wavesurfer.pause()
        this.wavesurfer.destroy()
        this.wavesurfer = null
      } catch (error) {
        console.error("Error destroying WaveSurfer:", error)
      }
    }
  }
}
```

### Smart Image
```js
// app/javascript/controllers/smart_image_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["playButton"]
  static values = {
    id: String,
    url: String,
    title: String,
    artist: String,
    banner: String,
    bannerVideo: String,
    animatedBannersEnabled: Boolean
  }

  connect() {
    // Only keep track of current song
    window.addEventListener("audio:changed", this.handleSongChange.bind(this))
  }

  disconnect() {
    window.removeEventListener("audio:changed", this.handleSongChange)
  }

  playRequest(e) {
    e.preventDefault()
    const playOnLoad = localStorage.getItem("audioPlayOnLoad") === "true"

    // DEBUG: Log raw banner value from stimulus before any processing
    // console.log("🎵 SMART-IMAGE: Raw this.bannerValue:", this.bannerValue)
    // console.log("🎵 SMART-IMAGE: Banner value type:", typeof this.bannerValue)
    // console.log("🎵 SMART-IMAGE: Banner value empty check:", this.bannerValue === "")

    // Get current global banner state from localStorage or default
    const currentBanner = localStorage.getItem("currentBanner") || "music_files/home-banner.jpg"
    const newBanner = this.bannerValue || "music_files/home-banner.jpg"
    // console.log("🎵 SMART-IMAGE: currentBanner:", currentBanner, "newBanner:", newBanner)
    // console.log("🎵 SMART-IMAGE: Banner fallback triggered:", !this.bannerValue)
    
    // FIXED: Always update banner to ensure song metadata (title, artist) is updated
    // even if background image doesn't change
    // const updateBanner = true // Always update banner with current song info
    
    // Store the new banner as current for future comparisons
    localStorage.setItem("currentBanner", newBanner)

    // DEBUG: Log all values before dispatching event
    // console.log("🎵 SMART-IMAGE: Preparing to dispatch player:play-requested")
    // console.log("🎵 SMART-IMAGE: Controller Values:", {
    //  id: this.idValue,
    //  url: this.urlValue,
    //  title: this.titleValue,
    //  artist: this.artistValue,
    //  banner: this.bannerValue,
    //  bannerResolved: newBanner
    // })
    
    const eventDetail = {
      id: this.idValue,
      url: this.urlValue,
      title: this.titleValue,
      artist: this.artistValue,
      banner: this.bannerValue,
      bannerVideo: this.bannerVideoValue,
      playOnLoad: playOnLoad,
      animatedBannersEnabled: this.animatedBannersEnabledValue
    }
    
    // console.log("🎵 SMART-IMAGE: Event detail being dispatched:", eventDetail)
    // console.log("🎵 SMART-IMAGE: updateBanner set to:", updateBanner)

    window.dispatchEvent(new CustomEvent("player:play-requested", {
      detail: eventDetail
    }))

    this.currentUrl = this.urlValue
  }


  handleSongChange(e) {
    // Only highlight if this is the current song
    if (e.detail.url === this.urlValue) {
      this.playButtonTarget.classList.add("border-[#00B1D1]/30", "bg-[#00B1D1]/10")
    } else {
      this.playButtonTarget.classList.remove("border-[#00B1D1]/30", "bg-[#00B1D1]/10")
    }
  }
}
```

## Routes
```rb
Rails.application.routes.draw do
  devise_for :users, controllers: {
    registrations: "users/registrations"
  }
  devise_for :admins, skip: [ :registrations ]

  # Upload interface routes
  resources :presigns, only: [ :create ]

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
        delete :destroy_image
        delete :destroy_file
        delete :destroy_artist_image
        delete :destroy_album_cover
        delete :destroy_artist_banner_video
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

  # Artist management routes
  resources :artists do
    member do
      delete :destroy_image
      delete :destroy_banner_video
    end
  end

  # Album management routes
  resources :albums do
    member do
      delete :destroy_cover
    end
  end

  resources :playlists, only: [ :new, :create, :edit, :update, :destroy ]

  # Upload interface routes
  get "upload", to: "upload#index", as: :upload
  post "upload/song", to: "upload#create_song", as: :upload_song
  post "upload/artist", to: "upload#create_artist", as: :upload_artist
  post "upload/album", to: "upload#create_album", as: :upload_album

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
```

## Additional Models

### Admin Model
```rb
class Admin < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable :registerable, and :omniauthable
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable
end
```

### PlaylistSong Model (Join Table)
```rb
class PlaylistSong < ApplicationRecord
  belongs_to :playlist
  belongs_to :song

  # Position-based ordering for playlist tracks
  validates :position, presence: true, numericality: { only_integer: true, greater_than: 0 }
end
```

### Genre Model
```rb
class Genre < ApplicationRecord
  has_many :song_genres, dependent: :destroy
  has_many :songs, through: :song_genres

  validates :name, presence: true, uniqueness: true

  # Scopes for filtering
  scope :with_songs, -> { joins(:songs).distinct }
  scope :alphabetical, -> { order(name: :asc) }
end
```

### SongGenre Model (Join Table)
```rb
class SongGenre < ApplicationRecord
  belongs_to :song
  belongs_to :genre

  validates :song_id, uniqueness: { scope: :genre_id }
end
```

## Enhanced Stimulus Architecture

### Banner Controller
The banner controller manages dynamic banner switching between images and videos with smooth transitions:

**Key Features:**
- Dynamic height adjustment based on image aspect ratio
- Smooth fade transitions between banners
- Video playback management (pause/unload when switching)
- localStorage persistence for user preferences
- Event-driven updates from music player

**Banner Switching Logic:**
1. Receives `music:banner:update` events from player controller
2. Checks user preference for animated banners
3. Prioritizes video if available and enabled, falls back to image
4. Handles loading states and error recovery

### Additional Music Controllers

#### Auto-Advance Controller
Manages automatic progression to next track:
- Toggles auto-advance functionality
- Persists user preference in localStorage
- Dispatches events to update player state

#### Play-on-Load Controller
Controls whether tracks start playing immediately when loaded:
- User preference persistence
- UI state management
- Integration with player controller

#### Playlist Controller
Manages playlist interactions:
- Queue management
- Position-based track ordering
- Integration with main player

#### Time Display Controller
Handles playback time visualization:
- Current time and duration display
- Progress bar updates
- Seek functionality

## Turbo Frames Implementation

The application extensively uses Turbo Frames for dynamic content loading:

### Music Navigation
- `/music/artists` - Loads artist listings
- `/music/genres` - Loads genre-filtered content
- `/music/playlists` - Loads playlist listings
- `/music/my-music` - Loads user's personal music (authenticated)

### Key Benefits
- Seamless navigation without full page reloads
- Maintained scroll position
- Progressive enhancement
- Error handling for authentication failures

### Upload Interface
- Multi-step form handling with Turbo Streams
- Real-time validation feedback
- File upload progress indication
- Error state management

## Advanced Features

### User Management System
- **Ban/Unban functionality**: Admins can moderate users
- **Profile management**: Users can update personal information
- **User statistics**: Track song count, playlist count, etc.
- **Active/inactive status**: Account lifecycle management

### Playlist Management
- **Position-based ordering**: Tracks maintain order in playlists
- **Public/private playlists**: Sharing capabilities
- **User ownership**: Full CRUD operations for playlist owners

### Responsive Design
- **Mobile-optimized sidebar**: Collapsible navigation
- **Adaptive banner sizing**: Dynamic height adjustment
- **Touch-friendly controls**: Mobile interaction support

### File Management
- **Background deletion**: S3DeleteJob for async cleanup
- **Presigned URLs**: Secure direct-to-S3 uploads
- **File validation**: Size and type restrictions
- **Error recovery**: Failed upload handling

## Event-Driven Architecture

The application uses a sophisticated event system for component communication:

### Custom Events
- `player:play-requested` - Song selection from cards
- `music:banner:update` - Banner content changes
- `player:state:changed` - Playback state updates
- `audio:changed` - Track change notifications
- `player:auto-advance:changed` - Auto-advance preference updates

### Benefits
- **Loose coupling**: Components communicate without direct dependencies
- **Scalability**: Easy to add new event listeners
- **Debugging**: Clear event flow for troubleshooting
- **State management**: Centralized state updates

## Performance Optimizations

### Database Queries
- **Eager loading**: Includes associations to prevent N+1 queries
- **Scoped queries**: Efficient filtering and pagination
- **Index optimization**: Proper database indexing

### Frontend Performance
- **Lazy loading**: Components load on demand
- **Asset optimization**: Efficient JavaScript/CSS delivery
- **Memory management**: Proper cleanup of WaveSurfer instances

### Caching Strategy
- **localStorage**: User preferences and state persistence
- **Turbo cache**: Page fragment caching
- **Asset caching**: Static file optimization

## Updated Feature Checklist

### ✅ Implemented Features

**Core Music Player:**
- [x] Music player with WaveSurfer waveform visualization
- [x] Banner image support (1280x300 recommended)
- [x] Banner video support (1280x300, MP4 format)
- [x] Dynamic banner switching based on user preferences
- [x] Animated banner toggle (user preference)
- [x] Banner height adjustment (fixed/dynamic modes)
- [x] Previous/Next track navigation
- [x] Auto-advance functionality
- [x] Play-on-load toggle
- [x] Loading progress indicators
- [x] Playback controls (play/pause)
- [x] Time display and progress tracking
- [x] Seek functionality (drag to seek)

**User Management:**
- [x] User authentication (Devise)
- [x] User profiles with bio, location, date of birth
- [x] Profile image uploads (Active Storage)
- [x] User statistics (song count, playlist count)
- [x] Account status management (active/inactive/banned)

**Admin Management:**
- [x] Admin authentication (Devise)
- [x] User moderation (ban/unban functionality)
- [x] Song management (CRUD operations)
- [x] Content moderation capabilities
- [x] Admin-only song editing restrictions

**Content Management:**
- [x] Song upload with metadata
- [x] Artist management (create/find existing)
- [x] Album management (create/find existing)
- [x] Genre association (multiple genres per song)
- [x] File upload to S3 (admin functionality)
- [x] Image management (song, artist, album covers)
- [x] Video management (artist banner videos)

**Playlist System:**
- [x] Playlist creation and management
- [x] Position-based track ordering
- [x] Public/private playlist options
- [x] Playlist ownership and permissions

**Navigation & UI:**
- [x] Responsive sidebar navigation
- [x] Turbo Frames for dynamic content loading
- [x] Mobile-optimized interface
- [x] Artist browsing and filtering
- [x] Genre-based music discovery
- [x] User's personal music library
- [x] Search and filtering capabilities

**Technical Features:**
- [x] Event-driven architecture
- [x] Stimulus controllers for interactivity
- [x] Turbo Streams for real-time updates
- [x] S3 integration (admin uploads)
- [x] Presigned URL uploads
- [x] Background job processing (S3DeleteJob)
- [x] Error handling and recovery
- [x] localStorage for user preferences

### 🚧 Partially Implemented

**File Upload System:**
- [x] Admin S3 uploads (fully implemented)
- [x] User Active Storage uploads (partially migrated)
- [ ] Complete S3 migration for user uploads

### ❌ Not Yet Implemented

**Advanced Features:**
- [ ] User comments on music
- [ ] EQ settings and presets
- [ ] Custom waveform styles/themes
- [ ] Mobile fullscreen player mode
- [ ] Individual song show pages
- [ ] Bulk album upload
- [ ] Streaming service integration (Spotify, SoundCloud)
- [ ] AI-generated artist images
- [ ] YouTube audio extraction (ffmpeg)
- [ ] Digital album sales/purchasing

### 📋 Planned Enhancements

**User Experience:**
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts for player controls
- [ ] Drag-and-drop playlist reordering
- [ ] Social sharing features
- [ ] Music discovery recommendations

**Performance:**
- [ ] Audio file transcoding optimization
- [ ] Image optimization and WebP support
- [ ] Caching strategy improvements
- [ ] Progressive Web App (PWA) features

**Content Features:**
- [ ] Artist bio and social links
- [ ] Album release date management
- [ ] Music genre hierarchy/tagging
- [ ] User-generated playlists from public songs
- [ ] Collaborative playlists

**Admin Features:**
- [ ] Bulk content operations
- [ ] Analytics and usage reporting
- [ ] Content approval workflows
- [ ] Automated moderation tools

## Summary & Recommendations

### Current Application State
This Rails 8 application represents a sophisticated music player with modern web technologies. The codebase demonstrates excellent use of:

- **Rails 8.0.1** with Turbo Frames and Stimulus
- **Event-driven architecture** for component communication
- **Hybrid storage approach** (S3 for admin, Active Storage for users)
- **Responsive design** with mobile considerations
- **Real-time features** through Turbo Streams
- **Professional-grade audio playback** with WaveSurfer.js

### Key Strengths
1. **Architecture**: Well-structured with clear separation of concerns
2. **User Experience**: Intuitive interface with smooth interactions
3. **Scalability**: Event-driven design allows easy feature additions
4. **Performance**: Optimized queries and efficient asset delivery
5. **Security**: Proper authentication and authorization patterns

### Recommendations for Future Development

#### Immediate Priorities
1. **Complete S3 Migration**: Finish migrating user uploads from Active Storage to S3 for consistency
2. **User Comments System**: Implement music commenting functionality
3. **EQ Implementation**: Add Wavesurfer-based equalization features
4. **Mobile Player**: Develop dedicated mobile fullscreen interface

#### Medium-term Goals
1. **Advanced Playlist Features**: Collaborative playlists, drag-and-drop reordering
2. **Streaming Integration**: Spotify/SoundCloud API integration
3. **AI Features**: AI-generated artwork and content creation
4. **PWA Implementation**: Offline capabilities and app-like experience

#### Technical Improvements
1. **Testing Suite**: Comprehensive RSpec/Capybara test coverage
2. **Monitoring**: Application performance monitoring and error tracking
3. **API Development**: RESTful API for potential mobile app
4. **Caching Strategy**: Redis implementation for improved performance

### Technology Stack Summary
- **Backend**: Ruby 3.3.7, Rails 8.0.1
- **Frontend**: JavaScript ES6+, Stimulus.js, Tailwind CSS
- **Database**: PostgreSQL with proper indexing
- **Storage**: AWS S3 (primary), Active Storage (partial)
- **Audio**: WaveSurfer.js for visualization and playback
- **Real-time**: Turbo Streams for dynamic updates
- **Authentication**: Devise with custom user/admin roles

This application demonstrates professional-grade development practices and provides an excellent foundation for a modern music streaming platform.

