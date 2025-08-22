module SidebarHelper
  def sidebar_link_to(name, path, icon_name, options = {})
    content_tag :li, class: "flex h-11 items-center rounded-lg p-1 hover:bg-purple-100 transition-all duration-200 w-full",
                     data: { sidebar_target: "link", action: "click->sidebar#setActive" } do
      link_to path, class: "flex items-center w-full cursor-pointer justify-center md:justify-start rounded-lg px-2 py-1 hover:text-purple-600 transition-colors duration-200", data: options[:data] || {} do
        concat content_tag(:div, icon(icon_name), class: "flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600")
        concat content_tag(:span, name, class: "ms-3 hidden lg:block md:hidden block truncate font-medium")
      end
    end
  end

  def icon(name)
    # This will render SVG icons based on the name
    render "icons/#{name}"
  end
end
