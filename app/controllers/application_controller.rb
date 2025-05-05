class ApplicationController < ActionController::Base
  # Set the default url options for use of blog image url
  before_action :set_default_url_options
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Set the default host for generating urls based on the request host.
  def set_default_url_options
    Rails.application.routes.default_url_options[:host] = request.host_with_port
  end
end
