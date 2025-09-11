module ApplicationHelper
  # Convert relative paths to full URLs for image_tag compatibility
  # Handles both full URLs (starting with http) and relative paths (from seeds)
  def safe_image_url(url)
    return nil if url.blank?

    # If it's already a full URL, return it as-is
    return url if url.start_with?("http")

    # Convert relative path to full URL
    # Remove leading slash if present to avoid double slashes
    clean_path = url.start_with?("/") ? url[1..-1] : url
    "#{request.base_url}/#{clean_path}"
  end
end
