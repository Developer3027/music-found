# S3 Public Access Configuration Guide

This guide configures your S3 bucket to allow public read access specifically for files in the `uploads/` directory, enabling images and audio files to display in your web application.

## 🎯 Overview

**Problem**: Files upload successfully to S3 but return "Access Denied" when accessed publicly for display in the web application.

**Solution**: Configure bucket policy and public access settings to allow public GET requests only for the `uploads/*` path.

## 🔧 Quick Setup

### Prerequisites
- AWS CLI installed and configured with appropriate permissions
- Access to the S3 bucket `zuke` in region `us-east-2`

### 1. Make scripts executable
```bash
chmod +x configure-s3-public-access.sh
chmod +x verify-s3-public-access.sh
```

### 2. Apply configuration
```bash
./configure-s3-public-access.sh
```

### 3. Verify setup
```bash
./verify-s3-public-access.sh
```

## 📋 Manual Configuration Steps

If you prefer manual configuration or need to understand each step:

### Step 1: Configure Public Access Block Settings

```bash
aws s3api put-public-access-block \
  --bucket zuke \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --region us-east-2
```

**What this does:**
- `BlockPublicAcls=true`: Prevents new public ACLs from being applied
- `IgnorePublicAcls=true`: Ignores existing public ACLs  
- `BlockPublicPolicy=false`: Allows bucket policies (needed for our public access)
- `RestrictPublicBuckets=false`: Allows public bucket policies to grant public access

### Step 2: Apply Bucket Policy

```bash
aws s3api put-bucket-policy \
  --bucket zuke \
  --policy file://aws-s3-bucket-policy.json \
  --region us-east-2
```

The bucket policy (`aws-s3-bucket-policy.json`) contains:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::zuke/uploads/*"
      ]
    }
  ]
}
```

## 🔒 Security Considerations

### What's Secure:
- ✅ **Directory Restriction**: Only `uploads/*` files are publicly accessible
- ✅ **Read-Only Access**: Only GET requests are allowed, no writing/deleting
- ✅ **No Listing**: Directory contents cannot be listed publicly
- ✅ **ACL Protection**: Public ACLs are blocked, only bucket policies work

### What Remains Private:
- ❌ Files outside the `uploads/` directory return 403 Forbidden
- ❌ Root bucket contents are not accessible
- ❌ Bucket configuration and settings remain private

## 🧪 Testing Public Access

### Test a specific file:
```bash
# Replace with actual file path from your uploads
curl -I "https://zuke.s3.us-east-2.amazonaws.com/uploads/your-uuid/filename.jpg"
```

**Expected result**: HTTP 200 OK

### Test a non-uploads file:
```bash
# This should fail
curl -I "https://zuke.s3.us-east-2.amazonaws.com/some-other-file.txt"
```

**Expected result**: HTTP 403 Forbidden

## 🌐 URL Format

Your uploaded files will be accessible at:
```
https://zuke.s3.us-east-2.amazonaws.com/uploads/[UUID]/[filename]
```

Example:
```
https://zuke.s3.us-east-2.amazonaws.com/uploads/e7cb171a-739c-4d99-9428-c5bc8271c845/SaltTarPhotoFrame.png
```

## 🔧 Troubleshooting

### Images still not loading?

1. **Check the browser console** for specific error messages
2. **Verify the URL format** matches the pattern above
3. **Run the verification script** to test configuration
4. **Check CORS settings** - uploads should work, display should work
5. **Wait a few minutes** - DNS propagation can take time

### Access still denied?

1. **Verify bucket policy** is applied correctly
2. **Check public access block** settings
3. **Confirm file exists** in the uploads directory
4. **Test with curl** to isolate browser issues

### Files uploading but not displaying?

This is likely a **CORS + Public Access** combination issue:
1. **CORS allows uploads** from your domain
2. **Public access allows display** from anywhere
3. Both must be configured correctly

## 📚 AWS Best Practices Applied

1. **Principle of Least Privilege**: Only uploads directory is public
2. **No Public ACLs**: Using bucket policy instead of ACLs
3. **Read-Only Access**: Only GET requests allowed
4. **Resource-Specific**: Policy targets specific path pattern
5. **Explicit Deny by Default**: Everything else remains private

## 🔄 Maintenance

### To revoke public access:
```bash
aws s3api delete-bucket-policy --bucket zuke --region us-east-2
```

### To update the policy:
1. Edit `aws-s3-bucket-policy.json`
2. Run `./configure-s3-public-access.sh` again

### To check current configuration:
```bash
./verify-s3-public-access.sh
```

## 📞 Support

If you encounter issues:
1. Run the verification script for diagnostic information
2. Check AWS CloudTrail for API call errors
3. Verify AWS CLI credentials have the necessary permissions:
   - `s3:GetBucketPolicy`
   - `s3:PutBucketPolicy`
   - `s3:PutBucketPublicAccessBlock`
   - `s3:GetBucketPublicAccessBlock`

---

**Result**: Your uploaded music files and images will now display properly in your web application while maintaining security for other bucket contents.