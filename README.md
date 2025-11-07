![Rails](https://img.shields.io/badge/rails-8.0.1-orange?logo=rubyonrails)
![Ruby](https://img.shields.io/badge/ruby-3.3.7-red?logo=ruby)
![Authentication](https://img.shields.io/badge/auth-devise-purple?logo=rubyonrails)
![Status](https://img.shields.io/badge/Player-working-f46519?logo=rubyonrails)
![License](https://img.shields.io/badge/license-MIT-green)
![Powered By](https://img.shields.io/badge/powered%20by-COFFEE-brown)

# Music Found

## Original Concept

I did a quick little project back when learning web development, from Brad Traversy. I loved it. It was a simple page that played a audio file. I went on to add a few things. Loved a song on SoundCloud and that was the one I used. Linked it and passed credit. Record player spinning in the background. It was great. Here is the live version of that project if you like: [Music Found](https://cocky-cori-7cae1e.netlify.app/).

![app index](./public/Screenshot%20from%202025-11-07%2014-21-09.png)

## Introduction

This has been a idea for some time that is finally getting some traction. I wanted a app that was similar to my Microsoft Zune. I also love the SoundCloud waveform. This app is very different from other music apps in that I am not using a API for streaming. Rather I am making my own. This is strictly to enjoy your own music. You have to own the music files and upload them to your account. The app will allow you to customize you music experience in a few ways. Images, short video, managing metadata, and EQ levels. Everything is not built yet. I loved my Zune, but there was also a player called [AIMP](https://www.aimp.ru/) that allowed for player customization and managing of metadata that was wonderful.

*NOTE Part of this app is part of my portfolio, built on Rails using a PostgreSQL database. The large image and audio files are stored in a S3 bucket. This allows me to host it on Heroku for under $20 a month while having access to those files. The player uses the [WaveSurfer](https://wavesurfer.xyz/examples/?basic.js) javascript library through the Rails Stimulus system. It takes into account that the player is working with S3.*

## At A Glance

**Purpose:** Personal music player for owned audio files with visual customization.

## Core Philosophy:

- You own the files (mp3s, etc.)
- Upload and manage your own music
- Customize visuals (images, short videos, metadata)
- Hierarchical data: Song → Album → Artist

## Music Player Architecture:

- WaveSurfer.js: Audio visualization and playback
- Stimulus Controllers: Event-driven audio control
- player_controller.js: Main player with WaveSurfer integration, queue management, auto-advance
- play_pause_controller.js: Play/pause button states
- song_controller.js: Individual song card interactions
- song-list_controller.js: Queue management
- banner_controller.js: Dynamic banner image/video updates
- time_display_controller.js: Current time and duration display
- auto-advance_controller.js: Automatic progression through playlist
- play-on-load_controller.js: Auto-play behavior management
- smart-image_controller.js: Image loading and fallback handling
- sidebar_controller.js: Navigation state

## Event-driven Communication: 
**Custom DOM events coordinate between controllers:**

- player:play-requested: Song selection
- player:state:changed: Playback state updates
- player:queue:updated: Queue synchronization
- player:time:update: Time display updates
- player:auto-advance:changed: Auto-advance toggle
- music:banner:update: Banner image/video changes
- audio:changed, audio:ended, audio:error: Audio lifecycle events

**S3 Integration:** Large audio files served from S3 with proper CORS and streaming configuration.

**Admin namespace:** All admin functionality under admin namespace with Admin model authentication.

## Key models:

- Song: Core entity with audio file, metadata, belongs to Album
- Album: Collection of songs, belongs to Artist, has cover image
- Artist: Top-level entity with banner image/video
- Genre, SongGenre: Genre tagging system
- Playlist, PlaylistSong: User-created playlists
- Routing pattern: Music browsing at /music with sub-routes for artists, genres, playlists

## Home Screen
![app index](./public/Screenshot%20from%202025-04-25%2016-23-40.png)

## Player Screen v1
![Player](./public/Screenshot%20from%202025-05-01%2011-53-09.png)

## Player Screen v2
![player v2](./public/Screenshot%20from%202025-05-09%2014-00-14.png)

## Player Screen v3
![player v3](./public/Screenshot%20from%202025-10-07%2017-50-31.png)

## Live image
![Move For Me Live Image](./public/move-for-me-live-image.gif)

