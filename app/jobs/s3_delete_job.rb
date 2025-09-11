class S3DeleteJob < ApplicationJob
  queue_as :default

  def perform(url)
    return if url.blank?

    # Example URL: https://your-bucket.s3.your-region.amazonaws.com/uploads/uuid/filename.mp3
    # We need to extract the key: "uploads/uuid/filename.mp3"
    uri = URI.parse(url)
    key = uri.path.delete_prefix("/")

    s3_object = Aws::S3::Object.new(bucket_name: S3_BUCKET_NAME, key: key, client: S3_CLIENT)
    s3_object.delete
  rescue Aws::S3::Errors::NoSuchKey
    # If the key isn't found, we can safely ignore the error.
    Rails.logger.warn("S3DeleteJob: Key not found in S3, skipping delete: #{key}")
  rescue StandardError => e
    Rails.logger.error("S3DeleteJob: Failed to delete S3 object with key #{key}. Error: #{e.message}")
  end
end
