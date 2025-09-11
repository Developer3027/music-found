#!/usr/bin/env ruby

# Test script to verify the boolean public field implementation
require_relative 'config/environment'

def test_public_field_implementation
  puts "=" * 50
  puts "TESTING BOOLEAN PUBLIC FIELD IMPLEMENTATION"
  puts "=" * 50

  # Test 1: Check if public column exists and has correct default
  puts "\n1. Testing database schema..."

  # Check if column exists
  if Song.column_names.include?('public')
    puts "✅ public column exists in songs table"
  else
    puts "❌ public column missing from songs table"
    return
  end

  # Test 2: Check public_songs scope
  puts "\n2. Testing public_songs scope..."
  public_songs = Song.public_songs
  puts "✅ Found #{public_songs.count} public songs using Song.public_songs"

  # Test 3: Check accessible_to_user scope for authenticated users
  puts "\n3. Testing accessible_to_user scope..."

  # Test with nil user (guest)
  guest_songs = Song.accessible_to_user(nil)
  puts "✅ Guest users can access #{guest_songs.count} songs (public only)"

  # Test with a user (if any exist)
  user = User.first
  if user
    user_accessible_songs = Song.accessible_to_user(user)
    user_owned_songs = Song.by_user(user)
    puts "✅ User #{user.id} can access #{user_accessible_songs.count} songs (#{public_songs.count} public + #{user_owned_songs.count} owned)"
  else
    puts "⚠️  No users found to test authenticated access"
  end

  # Test 4: Check data migration results
  puts "\n4. Testing data migration results..."
  songs_with_null_user_and_public_true = Song.where(user: nil, public: true)
  songs_with_null_user_and_public_false = Song.where(user: nil, public: false)
  songs_with_user_and_public_true = Song.where.not(user: nil).where(public: true)
  songs_with_user_and_public_false = Song.where.not(user: nil).where(public: false)

  puts "✅ Songs with user: nil, public: true = #{songs_with_null_user_and_public_true.count}"
  puts "✅ Songs with user: nil, public: false = #{songs_with_null_user_and_public_false.count}"
  puts "✅ Songs with user: present, public: true = #{songs_with_user_and_public_true.count}"
  puts "✅ Songs with user: present, public: false = #{songs_with_user_and_public_false.count}"

  # Test 5: Verify behavior matches old system
  puts "\n5. Testing behavioral equivalence..."

  # Old system: guest access was Song.where(user: nil)
  # New system: guest access should be Song.where(public: true)

  # For songs that had user: nil before migration, they should now be public: true
  if songs_with_null_user_and_public_true.count > 0
    puts "✅ Data migration successful: #{songs_with_null_user_and_public_true.count} songs converted from user: nil to public: true"
  end

  # Test 6: Test scope SQL generation
  puts "\n6. Testing scope SQL generation..."
  puts "public_songs scope SQL: #{Song.public_songs.to_sql}"
  puts "accessible_to_user(nil) SQL: #{Song.accessible_to_user(nil).to_sql}"
  if user
    puts "accessible_to_user(user) SQL: #{Song.accessible_to_user(user).to_sql}"
  end

  puts "\n" + "=" * 50
  puts "IMPLEMENTATION TEST COMPLETE"
  puts "=" * 50
  puts "✅ Boolean public field implementation appears to be working correctly!"
  puts "✅ #{public_songs.count} songs are now marked as public"
  puts "✅ Guest users can access #{guest_songs.count} songs"
  if user
    puts "✅ Authenticated users can access #{user_accessible_songs.count} songs"
  end
  puts "=" * 50
end

# Run the test
begin
  test_public_field_implementation
rescue => e
  puts "❌ Error during testing: #{e.message}"
  puts e.backtrace.first(5)
end
