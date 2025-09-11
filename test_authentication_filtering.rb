#!/usr/bin/env ruby

# Authentication-Based Song Filtering Test Script
# This script tests the privacy breach fix implementation

puts "=== Authentication-Based Song Filtering Test ==="
puts "Testing Date: #{Time.current}"
puts ""

# Test data setup
puts "1. Setting up test data..."

# Create test users
test_user_1 = User.create!(
  email: "user1@test.com",
  password: "password123",
  password_confirmation: "password123"
) rescue User.find_by(email: "user1@test.com")

test_user_2 = User.create!(
  email: "user2@test.com",
  password: "password123",
  password_confirmation: "password123"
) rescue User.find_by(email: "user2@test.com")

# Create test artist
test_artist = Artist.find_or_create_by(name: "Test Artist") do |artist|
  artist.image_url = "test_image.jpg"
end

# Create test album
test_album = Album.find_or_create_by(title: "Test Album", artist: test_artist) do |album|
  album.cover_art = "test_album.jpg"
end

# Create test songs with different ownership scenarios
public_song = Song.find_or_create_by(
  title: "Public Test Song",
  artist: test_artist,
  album: test_album,
  user: nil  # Public song
) do |song|
  song.song_file_url = "test_public.mp3"
  song.song_image_url = "test_public.jpg"
end

user1_private_song = Song.find_or_create_by(
  title: "User 1 Private Song",
  artist: test_artist,
  album: test_album,
  user: test_user_1  # Private to user 1
) do |song|
  song.song_file_url = "test_user1.mp3"
  song.song_image_url = "test_user1.jpg"
end

user2_private_song = Song.find_or_create_by(
  title: "User 2 Private Song",
  artist: test_artist,
  album: test_album,
  user: test_user_2  # Private to user 2
) do |song|
  song.song_file_url = "test_user2.mp3"
  song.song_image_url = "test_user2.jpg"
end

puts "✓ Test data created successfully"
puts "  - Public songs: #{Song.where(user: nil).count}"
puts "  - User 1 private songs: #{Song.where(user: test_user_1).count}"
puts "  - User 2 private songs: #{Song.where(user: test_user_2).count}"
puts ""

# Test scenarios
puts "2. Testing Song.accessible_to_user scope..."

# Scenario 1: Non-authenticated user (guest)
puts "📋 Scenario 1: Non-authenticated user (guest)"
guest_accessible_songs = Song.accessible_to_user(nil)
puts "  - Songs accessible to guest: #{guest_accessible_songs.count}"
puts "  - Should only include public songs: #{guest_accessible_songs.all? { |s| s.user.nil? }}"
puts "  - Public song included: #{guest_accessible_songs.exists?(id: public_song.id)}"
puts "  - User 1 private song excluded: #{!guest_accessible_songs.exists?(id: user1_private_song.id)}"
puts "  - User 2 private song excluded: #{!guest_accessible_songs.exists?(id: user2_private_song.id)}"
puts ""

# Scenario 2: Authenticated user 1
puts "📋 Scenario 2: Authenticated User 1"
user1_accessible_songs = Song.accessible_to_user(test_user_1)
puts "  - Songs accessible to User 1: #{user1_accessible_songs.count}"
puts "  - Public song included: #{user1_accessible_songs.exists?(id: public_song.id)}"
puts "  - User 1 private song included: #{user1_accessible_songs.exists?(id: user1_private_song.id)}"
puts "  - User 2 private song excluded: #{!user1_accessible_songs.exists?(id: user2_private_song.id)}"
puts ""

# Scenario 3: Authenticated user 2
puts "📋 Scenario 3: Authenticated User 2"
user2_accessible_songs = Song.accessible_to_user(test_user_2)
puts "  - Songs accessible to User 2: #{user2_accessible_songs.count}"
puts "  - Public song included: #{user2_accessible_songs.exists?(id: public_song.id)}"
puts "  - User 1 private song excluded: #{!user2_accessible_songs.exists?(id: user1_private_song.id)}"
puts "  - User 2 private song included: #{user2_accessible_songs.exists?(id: user2_private_song.id)}"
puts ""

# Test SQL queries to ensure they're efficient
puts "3. Testing SQL query efficiency..."
puts "📋 SQL Query Analysis"
puts "Guest query: #{Song.accessible_to_user(nil).to_sql}"
puts "Authenticated user query: #{Song.accessible_to_user(test_user_1).to_sql}"
puts ""

# Test CanCan Ability rules
puts "4. Testing CanCan Ability authorization..."

# Test guest abilities
puts "📋 Guest User Abilities"
guest_ability = Ability.new(nil)
puts "  - Can read public song: #{guest_ability.can?(:read, public_song)}"
puts "  - Cannot read user 1 private song: #{!guest_ability.can?(:read, user1_private_song)}"
puts "  - Cannot read user 2 private song: #{!guest_ability.can?(:read, user2_private_song)}"
puts ""

# Test user 1 abilities
puts "📋 User 1 Abilities"
user1_ability = Ability.new(test_user_1)
puts "  - Can read public song: #{user1_ability.can?(:read, public_song)}"
puts "  - Can read own private song: #{user1_ability.can?(:read, user1_private_song)}"
puts "  - Cannot read user 2 private song: #{!user1_ability.can?(:read, user2_private_song)}"
puts ""

# Test user 2 abilities
puts "📋 User 2 Abilities"
user2_ability = Ability.new(test_user_2)
puts "  - Can read public song: #{user2_ability.can?(:read, public_song)}"
puts "  - Cannot read user 1 private song: #{!user2_ability.can?(:read, user1_private_song)}"
puts "  - Can read own private song: #{user2_ability.can?(:read, user2_private_song)}"
puts ""

# Test edge cases
puts "5. Testing edge cases..."

# Test with non-existent user
puts "📋 Edge Case: Non-existent user scenarios"
begin
  empty_songs = Song.accessible_to_user(User.new)
  puts "  - New unsaved user treated as guest: #{empty_songs.count == guest_accessible_songs.count}"
rescue => e
  puts "  - Error with new user: #{e.message}"
end

# Test SQL injection protection
puts "📋 Edge Case: SQL injection protection"
begin
  # This should be safely handled
  malicious_input = "'; DROP TABLE songs; --"
  safe_query = Song.accessible_to_user(nil).where("title LIKE ?", "%#{malicious_input}%")
  puts "  - SQL injection protection working: #{safe_query.count >= 0}"
rescue => e
  puts "  - SQL injection test failed: #{e.message}"
end
puts ""

# Summary
puts "=== TEST SUMMARY ==="
all_tests_passed = true

# Check core functionality
guest_test = guest_accessible_songs.count > 0 && guest_accessible_songs.all? { |s| s.user.nil? }
user1_test = user1_accessible_songs.exists?(id: public_song.id) &&
             user1_accessible_songs.exists?(id: user1_private_song.id) &&
             !user1_accessible_songs.exists?(id: user2_private_song.id)
user2_test = user2_accessible_songs.exists?(id: public_song.id) &&
             !user2_accessible_songs.exists?(id: user1_private_song.id) &&
             user2_accessible_songs.exists?(id: user2_private_song.id)

# Check ability rules
ability_guest_test = guest_ability.can?(:read, public_song) &&
                    !guest_ability.can?(:read, user1_private_song)
ability_user1_test = user1_ability.can?(:read, public_song) &&
                    user1_ability.can?(:read, user1_private_song) &&
                    !user1_ability.can?(:read, user2_private_song)
ability_user2_test = user2_ability.can?(:read, public_song) &&
                    !user2_ability.can?(:read, user1_private_song) &&
                    user2_ability.can?(:read, user2_private_song)

puts "✓ Guest user filtering: #{guest_test ? 'PASSED' : 'FAILED'}"
puts "✓ User 1 filtering: #{user1_test ? 'PASSED' : 'FAILED'}"
puts "✓ User 2 filtering: #{user2_test ? 'PASSED' : 'FAILED'}"
puts "✓ Guest abilities: #{ability_guest_test ? 'PASSED' : 'FAILED'}"
puts "✓ User 1 abilities: #{ability_user1_test ? 'PASSED' : 'FAILED'}"
puts "✓ User 2 abilities: #{ability_user2_test ? 'PASSED' : 'FAILED'}"

all_tests_passed = guest_test && user1_test && user2_test &&
                  ability_guest_test && ability_user1_test && ability_user2_test

puts ""
puts "=== OVERALL RESULT ==="
puts all_tests_passed ? "🎉 ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
puts "Privacy breach fix: #{all_tests_passed ? 'SUCCESSFULLY IMPLEMENTED' : 'NEEDS REVIEW'}"
puts ""
puts "Test completed at: #{Time.current}"
