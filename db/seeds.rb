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
    image_url: "music_files/chris_rea/chris_rea-artist.jpeg",
    albums: [
      {
        title: "Josephine",
        release_year: 1985,
        genre_name: "Blues Rock",
        cover_art_url: "music_files/chris_rea/josephine-s-m.jpg",
        songs: [
          {
            title: "Josephine",
            song_image_url: "music_files/chris_rea/josephine.jpeg",
            song_file_url: "music_files/chris_rea/josephine.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "David Lee Roth",
    image_url: "music_files/david_lee_roth/david_lee_roth-artist.jpeg",
    albums: [
      {
        title: "Skyscraper",
        release_year: 1988,
        genre_name: "Hard Rock",
        cover_art_url: "music_files/david_lee_roth/Skyscraper_(David_Lee_Roth_album_-_cover_art).jpg",
        songs: [
          {
            title: "Hina",
            song_image_url: "music_files/david_lee_roth/hina.jpeg",
            song_file_url: "music_files/david_lee_roth/Hina.mp3"
          },
          {
            title: "Skyscraper",
            song_image_url: "music_files/david_lee_roth/skyscraper.jpeg",
            song_file_url: "music_files/david_lee_roth/Skyscraper.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Dream on Dreamer",
    image_url: "music_files/dream_on_dreamer/dream_on_dreamer-artist.jpeg",
    albums: [
      {
        title: "It Comes and Goes",
        release_year: 2018,
        genre_name: "Rock",
        cover_art_url: "music_files/dream_on_dreamer/runaway.jpeg",
        songs: [
          {
            title: "Runaway",
            song_image_url: "music_files/dream_on_dreamer/runaway.jpeg",
            song_file_url: "music_files/dream_on_dreamer/runaway.mp3"
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
    image_url: "music_files/heavy_metal/heavy_metal-artist.jpeg",
    albums: [
      {
        title: "Heavy Metal",
        release_year: 2016,
        genre_name: "Rock",
        cover_art_url: "music_files/heavy_metal/heavy-metal.jpg",
        songs: [
          {
            title: "Blue Lamp",
            song_image_url: "music_files/heavy_metal/heavy-metal.jpg",
            song_file_url: "music_files/heavy_metal/blue-lamp.mp3"
          },
          {
            title: "All-Of-You",
            song_image_url: "music_files/heavy_metal/heavy-metal.jpg",
            song_file_url: "music_files/heavy_metal/All-Of-You.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Kaskade",
    image_url: "music_files/kaskade/kaskade-artist.jpeg",
    albums: [
      {
        title: "Strobelite Seduction",
        release_year: 2008,
        genre_name: "Electronic",
        cover_art_url: "music_files/kaskade/kaskade.jpg",
        songs: [
          {
            title: "Move for Me",
            song_image_url: "music_files/kaskade/kaskade.jpg",
            song_file_url: "music_files/kaskade/move for me.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Korn",
    image_url: "music_files/Korn/korn-artist.jpeg",
    albums: [
      {
        title: "The Paradigm Shift",
        release_year: 2014,
        genre_name: "Rock",
        cover_art_url: "music_files/Korn/paradigm-shift.jpg",
        songs: [
          {
            title: "Spike in My Veins",
            song_image_url: "music_files/Korn/spike in my veins.jpeg",
            song_file_url: "music_files/Korn/Spike in My Veins.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "The Smiths",
    image_url: "music_files/KWM_Music/kwm-artist.jpeg",
    albums: [
      {
        title: "Hatful of Hollow",
        release_year: 1984,
        genre_name: "Rock",
        cover_art_url: "music_files/KWM_Music/how soon is now.jpeg",
        songs: [
          {
            title: "How Soon is Now",
            song_image_url: "music_files/KWM_Music/how soon is now.jpeg",
            song_file_url: "music_files/KWM_Music/How Soon is Now.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Motley_Crue",
    image_url: "music_files/motley_crue/dr_feelgood-artist.jpeg",
    albums: [
      {
        title: "Dr. Feelgood",
        release_year: 1989,
        genre_name: "Heavy Metal",
        cover_art_url: "music_files/motley_crue/Motley_Crue_-_Dr_Feelgood-front.jpg",
        songs: [
          {
            title: "Dr. Feelgood",
            song_image_url: "music_files/motley_crue/Motley_Crue_-_Dr_Feelgood-front.jpg",
            song_file_url: "music_files/motley_crue/dr-feelgood.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "Sakoya",
    image_url: "music_files/sakoya/sakoya-artist.jpeg",
    albums: [
      {
        title: "Wandering",
        release_year: 2023,
        genre_name: "Rock",
        cover_art_url: "music_files/sakoya/wandering.jpeg",
        songs: [
          {
            title: "Wandering",
            song_image_url: "music_files/sakoya/wandering.jpeg",
            song_file_url: "music_files/sakoya/wandering.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "crazy town",
    image_url: "music_files/crazy_town/crazy-town-artist.jpeg",
    albums: [
      {
        title: "the brimstone sluggers",
        release_year: 2015,
        genre_name: "Metal",
        cover_art_url: "music_files/crazy_town/the-brimstone-sluggers.png",
        songs: [
          {
            title: "back pack",
            song_image_url: "music_files/crazy_town/the-brimstone-sluggers.png",
            song_file_url: "music_files/crazy_town/backpack.mp3"
          },
          {
            title: "come inside",
            song_image_url: "music_files/crazy_town/the-brimstone-sluggers.png",
            song_file_url: "music_files/crazy_town/come_inside.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "rootkit",
    image_url: "music_files/rootkit/rootkit-artist.jpeg",
    albums: [
      {
        title: "do it",
        release_year: 2014,
        genre_name: "Electronic",
        cover_art_url: "music_files/rootkit/do-it.png",
        songs: [
          {
            title: "back pack",
            song_image_url: "music_files/rootkit/do-it.png",
            song_file_url: "music_files/rootkit/do it.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "TSS",
    image_url: "music_files/tss/tss-artist.jpeg",
    albums: [
      {
        title: "killing me",
        release_year: 2024,
        genre_name: "Metal",
        cover_art_url: "music_files/tss/killing-me.jpeg",
        songs: [
          {
            title: "fantasize",
            song_image_url: "music_files/tss/killing-me.jpeg",
            song_file_url: "music_files/tss/fantasize.mp3"
          },
          {
            title: "killing me",
            song_image_url: "music_files/tss/killing-me.jpeg",
            song_file_url: "music_files/tss/killing me.mp3"
          }
        ]
      }
    ]
  },
  {
    name: "dark new day",
    image_url: "music_files/dark-new-day/twelve years of silence.png",
    albums: [
      {
        title: "twelve years of silence",
        release_year: 2005,
        genre_name: "Rock",
        cover_art_url: "music_files/dark-new-day/twelve years of silence.png",
        songs: [
          {
            title: "brother",
            song_image_url: "music_files/dark-new-day/twelve years of silence.png",
            song_file_url: "music_files/dark-new-day/brother.mp3"
          }
        ]
      }
    ]
  }
]

# Clear existing data in safe order
[ PlaylistSong, SongGenre, Song, Album, Artist, Genre, Playlist ].each(&:destroy_all)

artists_data.each do |artist_data|
  artist = Artist.find_or_create_by!(
    name: artist_data[:name],
    image_url: artist_data[:image_url]
  )

  artist_data[:albums].each do |album_data|
    genre = Genre.find_or_create_by!(name: album_data[:genre_name])

    album = artist.albums.create!(
      title: album_data[:title],
      release_year: album_data[:release_year],
      cover_art_url: album_data[:cover_art_url],
      genre: genre
    )

    album_data[:songs].each do |song_data|
      song = album.songs.find_or_create_by!(
          title: song_data[:title],
          artist: artist
        ) do |s|
          s.song_image_url = song_data[:song_image_url]
          s.song_file_url = song_data[:song_file_url]
        end

      SongGenre.create!(song: song, genre: genre)
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
    cover_image_url: "music_files/sakoya/wandering.jpeg",
    song_titles: [ "Hina", "Skyscraper", "Runaway" ]
  },
  {
    name: "Chill Vibes",
    description: "Relaxing electronic and blues",
    is_public: true,
    cover_image_url: "music_files/default_playlist.jpg",
    song_titles: [ "Flutter", "Josephine" ]
  },
  {
    name: "Movie Soundtracks",
    description: "Great songs from films",
    is_public: false,
    cover_image_url: "music_files/default_playlist.jpg",
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
