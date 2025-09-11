require "aws-sdk-s3"

Aws.config.update(
  region: "us-east-2"
)

S3_CLIENT = Aws::S3::Client.new(
  access_key_id: Rails.application.credentials.aws[:access_key_id],
  secret_access_key: Rails.application.credentials.aws[:secret_access_key]
)

S3_BUCKET_NAME = "zuke"
