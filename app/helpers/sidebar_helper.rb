module SidebarHelper
  def sidebar_link_to(name, path, icon_name, options = {})
    content_tag :li, class: "flex h-11 items-center rounded-lg p-1 hover:bg-[#00B1D1]/20 transition-all duration-200 w-full",
                     data: { sidebar_target: "link", action: "click->sidebar#setActive" } do
      link_to path, class: "flex items-center w-full cursor-pointer justify-center md:justify-start rounded-lg px-2 py-1 hover:text-gray-800 transition-colors duration-200", data: options[:data] || {} do
        concat content_tag(:div, icon(icon_name), class: "flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600")
        concat content_tag(:span, name, class: "ms-3 hidden lg:block md:hidden block truncate font-medium")
      end
    end
  end

  def icon(name)
    # This will render SVG icons based on the name
    render "icons/#{name}"
  end

  # Authentication helpers for navigation
  def user_avatar_or_initial(user, size: "w-8 h-8")
    if user.profile_image.present?
      image_tag user.profile_image, class: "#{size} rounded-full object-cover"
    else
      content_tag :div, class: "#{size} bg-purple-500 rounded-full flex items-center justify-center" do
        content_tag :span, user_initial(user), class: "text-white text-sm font-medium"
      end
    end
  end

  def user_initial(user)
    if user.first_name.present?
      user.first_name.first.upcase
    else
      user.email.first.upcase
    end
  end

  def user_display_name(user)
    if user.first_name.present? && user.last_name.present?
      "#{user.first_name} #{user.last_name}"
    elsif user.first_name.present?
      user.first_name
    else
      user.email.split("@").first.humanize
    end
  end

  def user_greeting(user)
    name = user.first_name.present? ? user.first_name : user.email.split("@").first
    name.length > 12 ? name.truncate(12) : name
  end
end
