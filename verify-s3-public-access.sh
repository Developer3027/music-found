#!/bin/bash

# S3 Public Access Verification Script
# This script verifies that public read access is working correctly
# for the 'zuke' bucket's uploads/ directory

BUCKET_NAME="zuke"
REGION="us-east-2"
TEST_FILE_URL="https://zuke.s3.us-east-2.amazonaws.com/uploads/"

echo "🔍 Verifying S3 public access configuration for bucket '$BUCKET_NAME'..."
echo ""

# Step 1: Check bucket policy
echo "📋 Step 1: Checking bucket policy..."
aws s3api get-bucket-policy --bucket "$BUCKET_NAME" --region "$REGION" --output text > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Bucket policy is configured"
  aws s3api get-bucket-policy --bucket "$BUCKET_NAME" --region "$REGION" --query Policy --output text | jq '.'
else
  echo "❌ No bucket policy found or access denied"
fi

echo ""

# Step 2: Check public access block settings
echo "📋 Step 2: Checking Public Access Block settings..."
aws s3api get-public-access-block --bucket "$BUCKET_NAME" --region "$REGION"
if [ $? -eq 0 ]; then
  echo "✅ Public Access Block settings retrieved"
else
  echo "❌ Failed to retrieve Public Access Block settings"
fi

echo ""

# Step 3: List some files in uploads directory (if any exist)
echo "📋 Step 3: Checking for files in uploads/ directory..."
aws s3 ls s3://"$BUCKET_NAME"/uploads/ --region "$REGION" --recursive | head -5
if [ $? -eq 0 ]; then
  echo "✅ Successfully listed uploads/ directory contents"
else
  echo "❌ Failed to list uploads/ directory or directory is empty"
fi

echo ""

# Step 4: Test public access with a real file (if available)
echo "📋 Step 4: Testing public HTTP access..."
SAMPLE_FILE=$(aws s3 ls s3://"$BUCKET_NAME"/uploads/ --region "$REGION" --recursive | head -1 | awk '{print $4}')

if [ ! -z "$SAMPLE_FILE" ]; then
  TEST_URL="https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${SAMPLE_FILE}"
  echo "🔗 Testing URL: $TEST_URL"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL")
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Public access test SUCCESSFUL! File is publicly accessible"
    echo "📁 File: $SAMPLE_FILE"
    echo "🌍 URL: $TEST_URL"
  elif [ "$HTTP_STATUS" = "403" ]; then
    echo "❌ Public access test FAILED! Access Denied (HTTP 403)"
    echo "🔧 The bucket policy may not be applied correctly"
  else
    echo "⚠️  Unexpected HTTP status: $HTTP_STATUS"
  fi
else
  echo "⚠️  No files found in uploads/ directory to test"
  echo "💡 Upload a file first, then run this verification again"
fi

echo ""

# Step 5: Test access to a non-uploads file (should be denied)
echo "📋 Step 5: Testing security - checking non-uploads directory access..."
NON_UPLOADS_FILE=$(aws s3 ls s3://"$BUCKET_NAME"/ --region "$REGION" --recursive | grep -v "uploads/" | head -1 | awk '{print $4}')

if [ ! -z "$NON_UPLOADS_FILE" ]; then
  NON_UPLOADS_URL="https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${NON_UPLOADS_FILE}"
  echo "🔗 Testing restricted URL: $NON_UPLOADS_URL"
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NON_UPLOADS_URL")
  
  if [ "$HTTP_STATUS" = "403" ]; then
    echo "✅ Security test PASSED! Non-uploads files are properly restricted"
  else
    echo "⚠️  Security concern: Non-uploads file returned HTTP $HTTP_STATUS"
    echo "🔧 Review bucket policy - it may be too permissive"
  fi
else
  echo "ℹ️  No files outside uploads/ directory found to test security"
fi

echo ""
echo "🏁 Verification completed!"
echo ""
echo "📊 Summary:"
echo "   • Test public access to uploaded files with the example URL format:"
echo "     https://zuke.s3.us-east-2.amazonaws.com/uploads/YOUR_FILE_PATH"
echo "   • Files outside uploads/ should return 403 Forbidden"
echo "   • CORS should still work for uploads from your application"
echo ""