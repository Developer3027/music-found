#!/bin/bash

# S3 Bucket Public Access Configuration Script
# This script configures the 'zuke' S3 bucket to allow public read access
# specifically for files in the "uploads/" directory

BUCKET_NAME="zuke"
REGION="us-east-2"
POLICY_FILE="aws-s3-bucket-policy.json"

echo "🔧 Configuring S3 bucket '$BUCKET_NAME' for public read access..."
echo "📁 Target directory: uploads/*"
echo "🌍 Region: $REGION"
echo ""

# Step 1: Remove public access block restrictions (only what's needed)
echo "📋 Step 1: Configuring Public Access Block settings..."
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ Public Access Block configured successfully"
else
  echo "❌ Failed to configure Public Access Block"
  exit 1
fi

echo ""

# Step 2: Apply bucket policy
echo "📋 Step 2: Applying bucket policy for public read access..."
if [ ! -f "$POLICY_FILE" ]; then
  echo "❌ Policy file '$POLICY_FILE' not found!"
  exit 1
fi

aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy file://"$POLICY_FILE" \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ Bucket policy applied successfully"
else
  echo "❌ Failed to apply bucket policy"
  exit 1
fi

echo ""
echo "🎉 S3 bucket configuration completed!"
echo ""
echo "📝 What was configured:"
echo "   • Public Access Block: Allows bucket policies but blocks public ACLs"
echo "   • Bucket Policy: Allows public GET requests for uploads/* objects only"
echo "   • Security: Other directories remain private"
echo ""
echo "🔍 Next steps:"
echo "   1. Run the verification script to test public access"
echo "   2. Upload a test file to verify the configuration works"
echo ""