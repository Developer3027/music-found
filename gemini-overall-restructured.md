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

---

## 🎵 Project Overview

**Application Name:** Music Found
**Developer:** Mason Roberts
**Version:** Rails 8.0.1 Application

### Core Concept Description
Music Found is a modern web-based music player that allows users to customize their personal music collection with custom images and videos. It combines the visual experience of the Microsoft Zune player with the metadata management capabilities of AIMP, creating a unique, personalized music listening experience.

**Key Differentiators:**
- **Custom Visual Experience**: Users can associate images and videos with their music
- **Personalization**: Each song, album, and artist can have unique visual themes
- **Modern Web Technology**: Built with Rails 8, Turbo Frames, and Stimulus
- **Professional Audio Playback**: WaveSurfer.js integration for high-quality audio visualization

---

## 🎯 Core Concept & MVP

### Primary User Journey
1. **Public Access**: Anyone can experience the player and browse public music
2. **User Registration**: Create account with profile customization
3. **Music Upload**: Add personal music collection with custom artwork
4. **Customization**: Associate images/videos with songs, artists, and albums
5. **Playback**: Enjoy personalized visual music experience

### MVP Feature Requirements

#### ✅ Core Features (Implemented)
- **Public Music Experience**: Browse and play public songs
- **User Authentication**: Secure account creation and management
- **Music Upload System**: Add songs with metadata and artwork
- **Visual Customization**: Custom banners, images, and videos
- **Admin Management**: Content moderation and user management

#### 🚧 Advanced Features (Planned)
- **EQ Settings**: Audio equalization per song
- **Comments System**: User interaction on public music
- **Streaming Integration**: Spotify, SoundCloud connectivity
- **Mobile Experience**: Dedicated mobile player interface

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Ruby on Rails 8.0.1
- **Language**: Ruby 3.3.7
- **Database**: PostgreSQL
- **Authentication**: Devise (Users & Admins)
- **Background Jobs**: ActiveJob with custom S3DeleteJob

### Frontend
- **JavaScript Framework**: Stimulus.js
- **CSS Framework**: Tailwind CSS
- **Audio Library**: WaveSurfer.js
- **Real-time Updates**: Turbo Streams & Turbo Frames

### Infrastructure
- **Storage**: AWS S3 (Primary) + Active Storage (Partial)
- **File Uploads**: Presigned URLs for direct S3 uploads
- **Caching**: localStorage for user preferences
- **Deployment**: Kamal-ready configuration

---

## 🏗️ Application Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface │    │  Rails Backend   │    │   AWS S3 Storage │
│   (Views + JS)   │◄──►│  (Controllers)   │◄──►│   (Files/Media)  │
│                 │    │                 │    │                 │
│ • Music Player   │    │ • Music Controller│    │ • Audio Files    │
│ • Song Cards     │    │ • Upload System  │    │ • Images/Videos  │
│ • Navigation     │    │ • Admin Panel    │    │ • User Content    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Event-Driven Communication
The application uses a sophisticated event system for component communication:

**Key Events:**
- `player:play-requested` - Song selection from UI
- `music:banner:update` - Banner content changes
- `player:state:changed` - Playback state updates
- `audio:changed` - Track change notifications
- `player:auto-advance:changed` - User preference updates

**Benefits:**
- Loose coupling between components
- Easy scalability and feature addition
- Clear debugging and state management
- Real-time UI updates without page reloads

---

## 📊 Database Schema & Models

### Core Models Overview

#### User Model
```ruby
class User < ApplicationRecord
  # Authentication & Profile
  devise :database_authenticatable, :registerable, :recoverable, :rememberable,
         :validatable, :confirmable, :trackable

  # Associations
  has_many :playlists, dependent: :destroy
  has_many :songs, dependent: :destroy
  has_many :artists, dependent: :destroy
  has_many :albums, dependent: :destroy
  has_one_attached :profile_image

  # Key Features
  - User status management (active/banned)
  - Profile customization (bio, location, date of birth)
  - Animated banner preferences
  - Music library statistics
end
```

#### Song Model
```ruby
class Song < ApplicationRecord
  belongs_to :artist
  belongs_to :album, optional: true
  belongs_to :user, optional: true

  has_many :playlist_songs, dependent: :destroy
  has_many :playlists, through: :playlist_songs
  has_many :song_genres, dependent: :destroy
  has_many :genres, through: :song_genres

  # Validations
  validates :title, :artist, :song_file_url, :song_image_url, presence: true

  # Key Methods
  - image_url (fallback logic)
  - owned_by?(user) - ownership checking
  - Scopes for accessibility and user filtering
end
```

#### Artist & Album Models
```ruby
class Artist < ApplicationRecord
  belongs_to :user, optional: true
  has_many :songs, dependent: :destroy
  has_many :albums, dependent: :destroy

  # Features
  - Image and banner video support
  - Bio field for artist information
  - User ownership tracking
end

class Album < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :artist
  belongs_to :genre, optional: true

  has_many :songs, dependent: :destroy, inverse_of: :album

  # Features
  - Cover art management
  - Release year tracking
  - Genre association
end
```

#### Playlist System
```ruby
class Playlist < ApplicationRecord
  belongs_to :user
  has_many :playlist_songs, dependent: :destroy
  has_many :songs, through: :playlist_songs

  # Features
  - Public/private visibility
  - Position-based song ordering
  - Cover image support
  - User ownership and permissions
end

class PlaylistSong < ApplicationRecord
  belongs_to :playlist
  belongs_to :song

  # Position-based ordering for playlist tracks
  validates :position, presence: true, numericality: { only_integer: true, greater_than: 0 }
end
```

#### Admin Model
```ruby
class Admin < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  # Separate authentication system for administrators
  # Full access to user management and content moderation
end
```

### Database Relationships
```
User
├── has_many :songs
├── has_many :artists
├── has_many :albums
├── has_many :playlists
└── has_one_attached :profile_image

Song
├── belongs_to :user (optional)
├── belongs_to :artist
├── belongs_to :album (optional)
├── has_many :playlist_songs
├── has_many :song_genres
└── has_many :genres (through song_genres)

Artist
├── belongs_to :user (optional)
├── has_many :songs
├── has_many :albums
└── has_many :song_genres

Album
├── belongs_to :user (optional)
├── belongs_to :artist
├── belongs_to :genre (optional)
└── has_many :songs

Playlist
├── belongs_to :user
├── has_many :playlist_songs
└── has_many :songs (through playlist_songs)

Genre
├── has_many :song_genres
└── has_many :songs (through song_genres)
```

---

## ⚙️ Core Functionality

### Music Player System

#### WaveSurfer Integration
- **Library**: WaveSurfer.js for audio visualization
- **Features**: Real-time waveform, seek functionality, responsive design
- **Configuration**: Custom colors, bar styling, interaction settings

#### Playback Controls
- **Basic Controls**: Play/Pause, Previous, Next
- **Advanced Options**: Auto-advance, Play-on-load
- **Progress Tracking**: Time display, loading indicators
- **Queue Management**: Song queue with position tracking

#### Banner System
- **Dynamic Content**: Images and videos based on current track
- **User Preferences**: Animated banner toggle
- **Responsive Design**: Height adjustment, aspect ratio handling
- **Smooth Transitions**: Fade effects between banner changes

### User Management

#### Authentication & Authorization
- **Devise Integration**: Secure user registration and login
- **Role-based Access**: User and Admin roles
- **Profile Management**: Personal information and preferences
- **Account Status**: Active/Inactive/Banned states

#### Content Ownership
- **User-scoped Content**: Songs, artists, albums belong to users
- **Public/Private**: Content visibility controls
- **Admin Overrides**: Administrative content management

### File Upload System

#### S3 Integration (Admin Uploads - Fully Implemented)
```ruby
# Presigned URL generation
class PresignsController < ApplicationController
  def create
    key = "uploads/#{SecureRandom.uuid}/#{params[:filename]}"
    presigner = Aws::S3::Presigner.new(client: S3_CLIENT)

    presigned_url = presigner.presigned_url(
      :put_object,
      bucket: S3_BUCKET_NAME,
      key: key,
      expires_in: 300
    )

    public_url = "https://#{S3_BUCKET_NAME}.s3.#{Aws.config[:region]}.amazonaws.com/#{key}"

    render json: { presigned_url: presigned_url, public_url: public_url }
  end
end
```

#### Active Storage (User Uploads - Partial)
```ruby
class User < ApplicationRecord
  has_one_attached :profile_image
  # Additional attachments planned for migration
end
```

### Upload Process Flow

#### Admin Upload Flow
1. **File Selection**: User selects file in browser
2. **Presigned URL Request**: Browser requests upload URL from Rails
3. **Direct S3 Upload**: File uploaded directly to S3
4. **URL Storage**: Public URL saved to database
5. **Background Cleanup**: S3DeleteJob handles deletions

#### Stimulus Upload Controller
```javascript
export default class extends Controller {
  async upload(event) {
    // 1. Get presigned URL from Rails
    const presignResponse = await fetch(`/presigns?filename=${file.name}`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken }
    });

    // 2. Upload directly to S3
    const uploadResponse = await fetch(presignData.presigned_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    // 3. Update form with public URL
    hiddenField.value = presignData.public_url;
  }
}
```

### Storage Migration Strategy

#### Current State
- ✅ **Admin uploads**: Fully migrated to S3
- 🚧 **User uploads**: Still using Active Storage
- 📋 **Migration plan**: Complete S3 transition for consistency

#### Benefits of Full S3 Migration
- **Consistency**: Unified storage approach
- **Performance**: Direct browser uploads
- **Scalability**: Better CDN integration
- **Cost**: Optimized storage pricing

---

## 🎨 User Interface & Views

### Main Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header/Navbar (Mobile Menu Button)              │
├─────────────────┬───────────────────────────────┤
│ Sidebar         │ Main Content Area              │
│ Navigation      ├───────────────────────────────┤
│ • Artists       │ Music Player (Banner + Wave)  │
│ • Genres        │                               │
│ • Playlists     │───────────────────────────────│
│ • My Music      │ Song Cards Grid/List           │
│ • Settings      │ • Artwork + Metadata          │
└─────────────────┴───────────────────────────────┘
```

### Key View Components

#### Music Player (`shared/_music_player.html.erb`)
```erb
<div data-controller="music--player" class="flex flex-col w-full">
  <!-- Banner Section -->
  <%= render "music/components/player/banner", banner_image: @banner_image %>

  <!-- Waveform & Controls -->
  <div class="flex justify-center items-center bg-gray-900 text-white">
    <div class="flex flex-col items-center">
      <%= render "music/components/player/time_display" %>
      <%= render "music/components/player/playback_controls" %>
    </div>
  </div>
</div>
```

#### Song Cards (`music/components/_smart-image.html.erb`)
```erb
<div data-controller="music--smart-image" class="song-card">
  <!-- Clickable artwork -->
  <img src="<%= song.image_url %>" alt="<%= song.title %>" />

  <!-- Song metadata -->
  <div class="song-info">
    <h3><%= song.title %></h3>
    <p><%= song.artist.name %></p>
  </div>

  <!-- Play indicator -->
  <div class="play-button">▶</div>
</div>
```

#### Navigation Sidebar
- **Responsive Design**: Collapsible on mobile
- **Turbo Frame Integration**: Dynamic content loading
- **Active State Management**: Visual feedback for current section

### Responsive Design Features
- **Mobile-First**: Optimized for mobile devices
- **Breakpoint Handling**: Tailwind responsive utilities
- **Touch Interactions**: Mobile-friendly controls
- **Adaptive Layouts**: Sidebar collapse/expand

---

## 🎮 Stimulus Controllers

### Core Controllers Architecture

#### Music Player Controller (`music/player_controller.js`)
**Primary Responsibilities:**
- WaveSurfer initialization and management
- Audio playback control (play/pause/seek)
- Event handling and state management
- Queue management and auto-advance
- Banner update coordination

**Key Methods:**
```javascript
// Core audio setup
initializeWaveSurfer()
setupEventListeners()
handlePlayRequest(event)
loadTrack(url, playOnLoad)
updateBanner(details)

// Queue management
playNext()
playPrevious()
setCurrentIndex(songId)

// UI updates
updateTimeDisplay(currentTime)
handleLoadingProgress(progress)
```

#### Smart Image Controller (`music/smart-image_controller.js`)
**Primary Responsibilities:**
- Song card interactions
- Play request dispatching
- Visual feedback for current track
- User preference handling

**Key Features:**
- Click-to-play functionality
- Current song highlighting
- localStorage integration for preferences
- Event dispatching to player controller

#### Banner Controller (`music/banner_controller.js`)
**Primary Responsibilities:**
- Dynamic banner content switching
- Image/video display management
- Height adjustment and transitions
- User preference persistence

**Key Features:**
- Smooth fade transitions
- Video playback management
- Aspect ratio handling
- localStorage persistence

### Supporting Controllers

#### Auto-Advance Controller
- Toggles automatic track progression
- Persists user preferences
- Updates player behavior

#### Play-on-Load Controller
- Controls immediate playback on track load
- User preference management
- Player state synchronization

#### Time Display Controller
- Playback progress visualization
- Seek functionality
- Time formatting and display

### Controller Communication Flow
```
User Interaction → Smart Image → Player Controller → Banner Controller
       ↓              ↓              ↓              ↓
   Song Selection → Event Dispatch → Audio Loading → Visual Updates
```

---

## 📁 File Upload & Storage

### Current Storage Architecture

#### AWS S3 (Admin Uploads - Fully Implemented)
```ruby
# Presigned URL generation
class PresignsController < ApplicationController
  def create
    key = "uploads/#{SecureRandom.uuid}/#{params[:filename]}"
    presigner = Aws::S3::Presigner.new(client: S3_CLIENT)

    presigned_url = presigner.presigned_url(
      :put_object,
      bucket: S3_BUCKET_NAME,
      key: key,
      expires_in: 300
    )

    public_url = "https://#{S3_BUCKET_NAME}.s3.#{Aws.config[:region]}.amazonaws.com/#{key}"

    render json: { presigned_url: presigned_url, public_url: public_url }
  end
end
```

#### Active Storage (User Uploads - Partial)
```ruby
class User < ApplicationRecord
  has_one_attached :profile_image
  # Additional attachments planned for migration
end
```

### Upload Process Flow

#### Admin Upload Flow
1. **File Selection**: User selects file in browser
2. **Presigned URL Request**: Browser requests upload URL from Rails
3. **Direct S3 Upload**: File uploaded directly to S3
4. **URL Storage**: Public URL saved to database
5. **Background Cleanup**: S3DeleteJob handles deletions

#### Stimulus Upload Controller
```javascript
export default class extends Controller {
  async upload(event) {
    // 1. Get presigned URL from Rails
    const presignResponse = await fetch(`/presigns?filename=${file.name}`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken }
    });

    // 2. Upload directly to S3
    const uploadResponse = await fetch(presignData.presigned_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });

    // 3. Update form with public URL
    hiddenField.value = presignData.public_url;
  }
}
```

### Storage Migration Strategy

#### Current State
- ✅ **Admin uploads**: Fully migrated to S3
- 🚧 **User uploads**: Still using Active Storage
- 📋 **Migration plan**: Complete S3 transition for consistency

#### Benefits of Full S3 Migration
- **Consistency**: Unified storage approach
- **Performance**: Direct browser uploads
- **Scalability**: Better CDN integration
- **Cost**: Optimized storage pricing

---

## 📋 Feature Status & Roadmap

### ✅ Implemented Features

#### Core Music Player
- [x] WaveSurfer waveform visualization
- [x] Banner image/video support (1280x300)
- [x] Dynamic banner switching
- [x] Previous/Next navigation
- [x] Auto-advance functionality
- [x] Play-on-load toggle
- [x] Loading progress indicators
- [x] Time display and seeking
- [x] Playback controls

#### User Management
- [x] Devise authentication
- [x] User profiles (bio, location, DOB)
- [x] Profile image uploads
- [x] Account status management
- [x] User statistics tracking

#### Admin Management
- [x] Admin authentication
- [x] User moderation (ban/unban)
- [x] Song CRUD operations
- [x] Content moderation

#### Content Management
- [x] Song upload with metadata
- [x] Artist/album management
- [x] Genre associations
- [x] S3 file uploads (admin)
- [x] Image/video management

#### Playlist System
- [x] Playlist creation/management
- [x] Position-based ordering
- [x] Public/private visibility
- [x] User ownership

#### Navigation & UI
- [x] Responsive sidebar
- [x] Turbo Frames integration
- [x] Mobile optimization
- [x] Artist/genre browsing

#### Technical Features
- [x] Event-driven architecture
- [x] Stimulus controllers
- [x] Turbo Streams
- [x] S3 integration
- [x] Presigned URL uploads
- [x] Background jobs
- [x] Error handling
- [x] localStorage persistence

### 🚧 Partially Implemented

#### File Upload System
- [x] Admin S3 uploads (complete)
- [x] User Active Storage (needs migration)
- [ ] Complete S3 migration

### ❌ Not Yet Implemented

#### Advanced Features
- [ ] User comments on music
- [ ] EQ settings and presets
- [ ] Custom waveform themes
- [ ] Mobile fullscreen player
- [ ] Individual song pages
- [ ] Bulk album uploads
- [ ] Streaming service integration
- [ ] AI-generated artwork
- [ ] YouTube audio extraction
- [ ] Digital album sales/purchasing

### 📋 Planned Enhancements

#### User Experience
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop playlists
- [ ] Social sharing
- [ ] Music recommendations

#### Performance
- [ ] Audio transcoding
- [ ] Image optimization (WebP)
- [ ] Advanced caching (Redis)
- [ ] PWA features

#### Content Features
- [ ] Artist social links
- [ ] Album release management
- [ ] Advanced genre system
- [ ] User-generated playlists from public songs
- [ ] Collaborative playlists

#### Admin Features
- [ ] Bulk operations
- [ ] Analytics dashboard
- [ ] Content approval workflows
- [ ] Automated moderation tools

---

## 🎯 Development Recommendations

### Immediate Priorities (Next Sprint)
1. **Complete S3 Migration**: Finish migrating user uploads from Active Storage to S3 for consistency
2. **User Comments System**: Implement commenting functionality
3. **EQ Implementation**: Add Wavesurfer-based audio equalization
4. **Mobile Player**: Develop dedicated mobile fullscreen interface

### Medium-term Goals (3-6 months)
1. **Advanced Playlist Features**: Collaborative playlists, drag-and-drop
2. **Streaming Integration**: Spotify/SoundCloud API integration
3. **AI Features**: AI-generated artwork and content creation
4. **PWA Implementation**: Offline capabilities and app-like experience

### Technical Improvements (Ongoing)
1. **Testing Suite**: Comprehensive RSpec/Capybara coverage
2. **Monitoring**: Application performance and error tracking
3. **API Development**: RESTful API for potential mobile app
4. **Caching Strategy**: Redis implementation for improved performance

### Technology Stack Summary
- **Backend**: Ruby 3.3.7, Rails 8.0.1
- **Frontend**: JavaScript ES6+, Stimulus.js, Tailwind CSS
- **Database**: PostgreSQL with optimized indexing
- **Storage**: AWS S3 (primary), Active Storage (partial)
- **Audio**: WaveSurfer.js for visualization and playback
- **Real-time**: Turbo Streams for dynamic updates
- **Authentication**: Devise with custom user/admin roles

---

## 📚 Additional Technical Details

### Database Schema (Complete)
```sql
-- Core tables structure (see original document for full schema)
-- Includes all models: users, admins, songs, artists, albums, playlists, genres
-- With proper foreign keys, indexes, and constraints
```

### Routes Configuration
```ruby
Rails.application.routes.draw do
  # Authentication
  devise_for :users, controllers: { registrations: "users/registrations" }
  devise_for :admins, skip: [:registrations]

  # Core resources
  resources :songs, except: [:index]
  resources :artists
  resources :albums
  resources :playlists, only: [:new, :create, :edit, :update, :destroy]

  # Admin namespace
  namespace :admin do
    resources :songs, only: [:index, :new, :create, :edit, :update, :destroy]
    resources :users, only: [:index, :show, :edit, :update, :destroy]
  end

  # Music browsing
  scope :music do
    get "/", to: "music#index"
    get "artists", to: "music#artists"
    get "genres", to: "music#genres"
    get "playlists", to: "music#playlists"
    get "my-music", to: "music#my_music"
  end

  # Upload system
  get "upload", to: "upload#index"
  post "upload/song", to: "upload#create_song"
  resources :presigns, only: [:create]
end
```

### Key Configuration Files

#### AWS S3 Configuration (`config/initializers/aws.rb`)
```ruby
require "aws-sdk-s3"

Aws.config.update(region: "us-east-2")

S3_CLIENT = Aws::S3::Client.new(
  access_key_id: Rails.application.credentials.aws[:access_key_id],
  secret_access_key: Rails.application.credentials.aws[:secret_access_key]
)

S3_BUCKET_NAME = "zuke"
```

#### Background Job Configuration
```ruby
class S3DeleteJob < ApplicationJob
  queue_as :default

  def perform(url)
    return if url.blank?
    uri = URI.parse(url)
    key = uri.path.delete_prefix("/")
    s3_object = Aws::S3::Object.new(bucket_name: S3_BUCKET_NAME, key: key, client: S3_CLIENT)
    s3_object.delete
  rescue Aws::S3::Errors::NoSuchKey
    Rails.logger.warn("S3DeleteJob: Key not found in S3, skipping delete: #{key}")
  end
end
```

This restructured document provides a comprehensive, logical flow that makes it easy for both humans and AI agents to understand the Music Found application architecture, current implementation status, and future development roadmap.