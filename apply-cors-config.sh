#!/bin/bash

# Apply S3 CORS configuration for Rails file uploads
# Usage: ./apply-cors-config.sh

BUCKET_NAME="zuke"
REGION="us-east-2"
CORS_CONFIG_FILE="aws-s3-cors-config.json"

echo "🚀 Applying CORS configuration to S3 bucket: $BUCKET_NAME"
echo "📍 Region: $REGION"
echo "📄 Configuration file: $CORS_CONFIG_FILE"
echo ""

# Check if the CORS configuration file exists
if [ ! -f "$CORS_CONFIG_FILE" ]; then
    echo "❌ Error: CORS configuration file '$CORS_CONFIG_FILE' not found!"
    echo "   Make sure you're running this script from the Rails project root directory."
    exit 1
fi

# Apply the CORS configuration
echo "⏳ Applying CORS configuration..."
if aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://"$CORS_CONFIG_FILE" --region "$REGION"; then
    echo "✅ CORS configuration applied successfully!"
    echo ""
    
    # Verify the configuration
    echo "🔍 Verifying CORS configuration..."
    if aws s3api get-bucket-cors --bucket "$BUCKET_NAME" --region "$REGION"; then
        echo ""
        echo "✅ CORS configuration verified!"
        echo ""
        echo "🎉 Setup complete! You can now test file uploads in your Rails application."
        echo ""
        echo "📝 Next steps:"
        echo "   1. Clear your browser cache"
        echo "   2. Test file uploads at http://127.0.0.1:3000"
        echo "   3. Check browser developer console for any remaining errors"
        echo "   4. Update production origins in the CORS config before deploying"
    else
        echo "⚠️  Could not verify CORS configuration. Please check manually in AWS Console."
    fi
else
    echo "❌ Failed to apply CORS configuration!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Ensure AWS CLI is installed and configured"
    echo "   2. Verify you have permissions to modify S3 bucket CORS settings"
    echo "   3. Check that the bucket name and region are correct"
    echo "   4. Try applying the configuration manually via AWS Console"
    exit 1
fi