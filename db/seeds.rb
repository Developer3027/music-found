# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
#
# Destroy Admin
Admin.destroy_all
p "#{Admin.count} Admins left"

# Create Admin
Admin.create!(email: "admin@example.com", password: "admin456", password_confirmation: "admin456")
p "Created Admin"

# db/seeds.rb
artists_data = [
  {
    name: "Chris Rea",
    image_url: "music_files/chris rea/chris-rea.jpg",
    albums: [
      {
        title: "Josephine",
        release_year: 1985,
        genre_name: "Blues Rock",
        cover_art_url: "music_files/chris rea/josephine.jpeg",
        songs: [
          {
            title: "Josephine",
            song_image_url: "music_files/chris rea/josephine.jpeg",
            song_file_url: "music_files/chris rea/josephine.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "David Lee Roth",
    image_url: "music_files/david lee roth/david-lee-roth.jpg",
    albums: [
      {
        title: "Skyscraper",
        release_year: 1988,
        genre_name: "Hard Rock",
        cover_art_url: "music_files/david lee roth/Skyscraper_(David_Lee_Roth_album_-_cover_art).jpg",
        songs: [
          {
            title: "Hina",
            song_image_url: "music_files/david lee roth/Skyscraper_(David_Lee_Roth_album_-_cover_art).jpg",
            song_file_url: "music_files/david lee roth/Hina.mp3"
          },
          {
            title: "Skyscraper",
            song_image_url: "music_files/david lee roth/Skyscraper_(David_Lee_Roth_album_-_cover_art).jpg",
            song_file_url: "music_files/david lee roth/Skyscraper.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Dream on Dreamer",
    image_url: "music_files/dream on dreamer/dream-on-dreamer.png",
    albums: [
      {
        title: "It Comes and Goes",
        release_year: 2018,
        genre_name: "Rock",
        cover_art_url: "music_files/dream on dreamer/runaway.jpeg",
        songs: [
          {
            title: "Runaway",
            song_image_url: "music_files/dream on dreamer/runaway.jpeg",
            song_file_url: "music_files/dream on dreamer/runaway.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Aoshi",
    image_url: "music_files/flutter/fluttershy.png",
    albums: [
      {
        title: "Flutter",
        release_year: 2016,
        genre_name: "Electronic",
        cover_art_url: "music_files/flutter/flutter.jpg",
        songs: [
          {
            title: "Flutter",
            song_image_url: "music_files/flutter/flutter.jpg",
            song_file_url: "music_files/flutter/flutter.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Heavy Metal",
    image_url: "music_files/heavy metal/heavy-metal-movie.jpg",
    albums: [
      {
        title: "Heavy Metal",
        release_year: 2016,
        genre_name: "Rock",
        cover_art_url: "music_files/heavy metal/heavy-metal.jpg",
        songs: [
          {
            title: "Blue Lamp",
            song_image_url: "music_files/heavy metal/heavy-metal.jpg",
            song_file_url: "music_files/heavy metal/blue-lamp.mp3"
          },
          {
            title: "All-Of-You",
            song_image_url: "music_files/heavy metal/heavy-metal.jpg",
            song_file_url: "music_files/heavy metal/All-Of-You.mp3"
          }
        ]
      }
    ]
  }
]

# Clear existing data in safe order
[ PlaylistSong, SongGenre, Song, Album, Artist, Genre, Playlist ].each(&:destroy_all)

artists_data.each do |artist_data|
  # 1. Create Artist
  artist = Artist.create!(
    name: artist_data[:name],
    image_url: artist_data[:image_url]
  )

  artist_data[:albums].each do |album_data|
    # 2. Find or Create Genre
    genre = Genre.find_or_create_by!(name: album_data[:genre_name])

    # 3. Create Album (with direct genre association)
    album = artist.albums.create!(
      title: album_data[:title],
      release_year: album_data[:release_year],
      cover_art_url: album_data[:cover_art_url],
      genre: genre # Album's primary genre
    )

    album_data[:songs].each do |song_data|
      # 4. Create Song
      song = album.songs.create!(
        title: song_data[:title],
        song_image_url: song_data[:song_image_url],
        song_file_url: song_data[:song_file_url],
        artist: artist # Direct artist association
      )

      # 5. Connect to Genre through song_genres join table
      SongGenre.create!(song: song, genre: genre)

      # Alternative syntax:
      # song.genres << genre
    end
  end
end

# ... (keep all your existing seed code above this)

# Create some playlists
playlists_data = [
  {
    name: "Rock Classics",
    description: "The best classic rock songs",
    is_public: true,
    cover_image_url: "music_files/rock-roll.jpg",
    song_titles: [ "Hina", "Skyscraper", "Runaway" ]
  },
  {
    name: "Chill Vibes",
    description: "Relaxing electronic and blues",
    is_public: true,
    cover_image_url: "music_files/chill-vibes.jpg",
    song_titles: [ "Flutter", "Josephine" ]
  },
  {
    name: "Movie Soundtracks",
    description: "Great songs from films",
    is_public: false,
    cover_image_url: "music_files/soundtrack.jpg",
    song_titles: [ "Blue Lamp", "All-Of-You" ]
  }
]

playlists_data.each do |playlist_data|
  playlist = Playlist.create!(
    name: playlist_data[:name],
    description: playlist_data[:description],
    is_public: playlist_data[:is_public],
    cover_image_url: playlist_data[:cover_image_url]
  )

  # Add songs to playlist with positions
  playlist_data[:song_titles].each_with_index do |song_title, index|
    song = Song.find_by(title: song_title)
    if song
      PlaylistSong.create!(
        playlist: playlist,
        song: song,
        position: index + 1
      )
    else
      puts "Warning: Song '#{song_title}' not found for playlist '#{playlist.name}'"
    end
  end
end

puts "Seeded #{Playlist.count} playlists and #{PlaylistSong.count} playlist songs."

puts "Seeded #{Artist.count} artists, #{Album.count} albums, #{Song.count} songs, #{Genre.count} genres."
