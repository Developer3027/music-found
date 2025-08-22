module SidebarHelper
  def sidebar_link_to(name, path, icon_name, options = {})
    content_tag :li, class: "flex h-11 bg-[#FFC9A4] items-center rounded-sm p-1 hover:bg-[#FFC9A4]/50 transition-colors w-full",
                     data: { sidebar_target: "link", action: "click->sidebar#setActive" } do
      link_to path, class: "flex items-center w-full cursor-pointer", data: options[:data] || {} do
        concat icon(icon_name)
        concat content_tag(:span, name, class: "ms-3")
      end
    end
  end

  def icon(name)
    # This will render SVG icons based on the name
    render "icons/#{name}"
  end
end
