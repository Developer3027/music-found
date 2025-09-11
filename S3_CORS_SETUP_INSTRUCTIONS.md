# S3 CORS Configuration for Rails File Uploads

## Problem Description
Your Rails application is experiencing CORS errors when uploading files directly to S3:
```
Access to fetch at 'https://zuke.s3.us-east-2.amazonaws.com/uploads/...' from origin 'http://127.0.0.1:3000' has been blocked by CORS policy
```

This happens because the S3 bucket lacks proper Cross-Origin Resource Sharing (CORS) configuration.

## Solution Overview
Configure your S3 bucket "zuke" to allow direct uploads from your Rails application origins.

## Method 1: AWS CLI (Recommended)

### Prerequisites
- AWS CLI installed and configured with appropriate credentials
- Permissions to modify S3 bucket CORS settings

### Steps

1. **Apply the CORS configuration:**
   ```bash
   aws s3api put-bucket-cors --bucket zuke --cors-configuration file://aws-s3-cors-config.json --region us-east-2
   ```

2. **Verify the configuration was applied:**
   ```bash
   aws s3api get-bucket-cors --bucket zuke --region us-east-2
   ```

3. **Test the upload functionality** in your Rails application.

## Method 2: AWS Management Console

1. **Navigate to S3 in AWS Console:**
   - Go to https://console.aws.amazon.com/s3/
   - Click on your "zuke" bucket

2. **Access Permissions tab:**
   - Click the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"

3. **Edit CORS configuration:**
   - Click "Edit"
   - Replace the existing configuration with the JSON from `aws-s3-cors-config.json`
   - Click "Save changes"

## Configuration Explanation

### Development Rule
```json
{
  "ID": "AllowDirectUploadFromLocalDev",
  "AllowedOrigins": [
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ]
}
```
- Allows uploads from your local development server
- Supports both 127.0.0.1 and localhost variations

### Production Rule
```json
{
  "ID": "AllowDirectUploadFromProduction",
  "AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
  ]
}
```
- **IMPORTANT**: Replace `yourdomain.com` with your actual production domain
- Uses HTTPS for production security

### Key Headers and Methods
- **PUT**: Required for presigned URL uploads (as used in your Rails app)
- **Content-Type**: Essential for file type specification
- **GET/HEAD**: For file verification and metadata
- **ETag**: Exposed for upload verification

## Production Considerations

### 1. Update Production Origins
Before deploying to production, update the CORS configuration:
```json
"AllowedOrigins": [
  "https://your-actual-domain.com",
  "https://www.your-actual-domain.com"
]
```

### 2. Security Best Practices
- Never use wildcards (`*`) for `AllowedOrigins` in production
- Only include necessary headers and methods
- Keep `MaxAgeSeconds` reasonable (3000 = 50 minutes)

### 3. Environment-Specific Configuration
Consider using different CORS rules for different environments by maintaining separate configuration files:
- `cors-development.json`
- `cors-production.json`

### 4. Monitor and Test
- Test uploads after applying CORS configuration
- Monitor S3 access logs for CORS-related issues
- Verify uploads work from all intended origins

## Troubleshooting

### Common Issues

1. **Configuration not taking effect:**
   - Wait a few minutes for AWS propagation
   - Clear browser cache and cookies
   - Verify the configuration with `aws s3api get-bucket-cors`

2. **Still getting CORS errors:**
   - Check that origins exactly match (including protocol and port)
   - Verify all required headers are included in `AllowedHeaders`
   - Ensure your Rails app is using the correct S3 endpoint URL

3. **Partial success:**
   - Some files upload but others fail: Check file type restrictions
   - Intermittent failures: May indicate DNS propagation delays

### Verification Commands

```bash
# Check current CORS configuration
aws s3api get-bucket-cors --bucket zuke --region us-east-2

# Test a presigned URL generation (from Rails console)
rails console
presigner = Aws::S3::Presigner.new(client: S3_CLIENT)
url = presigner.presigned_url(:put_object, bucket: 'zuke', key: 'test/file.txt', expires_in: 300)
puts url
```

## Next Steps

1. Apply the CORS configuration using one of the methods above
2. Test file uploads in your Rails application
3. Update production origins when deploying to production
4. Monitor upload success rates and adjust configuration if needed

The CORS configuration should resolve your S3 upload errors and allow your JavaScript file upload controller to successfully upload files directly to S3.