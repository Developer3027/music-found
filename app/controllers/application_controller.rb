class ApplicationController < ActionController::Base
  # Set the default url options for use of blog image url
  before_action :set_default_url_options
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # CanCanCan integration
  protect_from_forgery with: :exception

  # Optional: Enable authorization checking in development (uncomment for strict checking)
  # check_authorization unless: :devise_controller?

  # Handle authorization failures
  rescue_from CanCan::AccessDenied do |exception|
    respond_to do |format|
      format.json { head :forbidden, content_type: "text/html" }
      format.html { redirect_to main_app.root_url, notice: exception.message }
      format.js   { head :forbidden, content_type: "text/html" }
    end
  end

  protected

  # Override CanCanCan's current_user method to work with both Admin and User models
  def current_ability
    @current_ability ||= Ability.new(current_admin || current_user)
  end

  # Set the default host for generating urls based on the request host.
  def set_default_url_options
    Rails.application.routes.default_url_options[:host] = request.host_with_port
  end

  # Helper method to detect turbo frame requests
  def turbo_frame_request?
    request.headers["Turbo-Frame"].present?
  end

  # Devise redirect paths
  def after_sign_in_path_for(resource)
    case resource
    when Admin
      admin_root_path
    when User
      music_path
    else
      root_path
    end
  end

  def after_sign_out_path_for(resource_or_scope)
    case resource_or_scope
    when :admin, Admin
      new_admin_session_path
    when :user, User
      root_path
    else
      root_path
    end
  end

  def after_sign_up_path_for(resource)
    case resource
    when User
      music_path
    else
      root_path
    end
  end
end
