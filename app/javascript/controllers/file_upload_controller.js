import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="file-upload"
export default class extends Controller {
  static targets = ["input", "status", "hiddenField"]

  connect() {
    console.log("🔍 DEBUG: File upload controller connected")
  }

  async upload(event) {
    const file = event.target.files[0]
    if (!file) {
      console.log("🔍 DEBUG: No file selected")
      return
    }

    console.log("🔍 DEBUG: File selected:", file.name)
    
    // Find the corresponding hidden field and status div
    const inputElement = event.target
    const hiddenFieldSelector = inputElement.dataset.target
    const hiddenField = document.querySelector(hiddenFieldSelector)
    const statusDiv = inputElement.nextElementSibling
    
    console.log("🔍 DEBUG: Hidden field:", hiddenField)
    console.log("🔍 DEBUG: Status div:", statusDiv)

    if (!hiddenField) {
      console.error("🔍 DEBUG: Hidden field not found for selector:", hiddenFieldSelector)
      return
    }

    if (statusDiv) {
      statusDiv.textContent = 'Preparing to upload...'
    }

    try {
      // 1. Get presigned URL from Rails
      console.log("🔍 DEBUG: Requesting presigned URL for:", file.name)
      const presignResponse = await fetch(`/presigns?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })

      if (!presignResponse.ok) {
        throw new Error(`Presign request failed: ${presignResponse.status}`)
      }

      const presignData = await presignResponse.json()
      console.log("🔍 DEBUG: Got presigned URL data:", presignData)

      if (statusDiv) {
        statusDiv.textContent = 'Uploading to S3...'
      }

      // 2. Upload directly to S3
      const uploadResponse = await fetch(presignData.presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (uploadResponse.ok) {
        console.log("🔍 DEBUG: S3 upload successful")
        if (statusDiv) {
          statusDiv.textContent = '✅ Upload complete!'
        }
        // Set the public URL in the hidden field
        hiddenField.value = presignData.public_url
        console.log("🔍 DEBUG: Hidden field updated with:", presignData.public_url)
      } else {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`)
      }

    } catch (error) {
      console.error('🔍 DEBUG: Upload error:', error)
      if (statusDiv) {
        statusDiv.textContent = '❌ Upload failed.'
      }
    }
  }
}