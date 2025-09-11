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
