// app/javascript/controllers/sidebar_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "link", "menu", "sidebar", "overlay" ]

  connect() {
    // Set the initial active link (Home in this case)
    if (this.linkTargets.length > 0) {
      this.setActive(this.linkTargets[0])
    }
    
    // Handle window resize for responsive behavior
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)
    this.handleResize() // Initial check
  }

  disconnect() {
    window.removeEventListener('resize', this.handleResize)
  }

  setActive(event) {
    // If event is a mouse event, get the target element
    const element = event.currentTarget || event
    
    // Remove active class from all links
    this.linkTargets.forEach(link => {
      link.classList.remove("bg-purple-500", "text-white")
      link.classList.add("text-gray-600")
    })
    
    // Add active class to clicked link
    element.classList.add("bg-purple-500", "text-white")
    element.classList.remove("text-gray-600")
    
    // Close mobile menu after navigation on mobile
    if (window.innerWidth < 768) {
      this.closeMobileMenu()
    }
  }

  toggleMenu() {
    if (this.hasMenuTarget) {
      this.menuTarget.classList.toggle("hidden")
    }
  }

  toggleMobileMenu() {
    if (this.hasSidebarTarget && this.hasOverlayTarget) {
      const sidebar = this.sidebarTarget
      const overlay = this.overlayTarget
      
      if (sidebar.classList.contains('-translate-x-full')) {
        // Show sidebar
        sidebar.classList.remove('-translate-x-full')
        overlay.classList.remove('opacity-0', 'pointer-events-none')
        overlay.classList.add('opacity-100')
        document.body.style.overflow = 'hidden'
      } else {
        // Hide sidebar
        this.closeMobileMenu()
      }
    }
  }

  closeMobileMenu() {
    if (this.hasSidebarTarget && this.hasOverlayTarget) {
      const sidebar = this.sidebarTarget
      const overlay = this.overlayTarget
      
      sidebar.classList.add('-translate-x-full')
      overlay.classList.add('opacity-0', 'pointer-events-none')
      overlay.classList.remove('opacity-100')
      document.body.style.overflow = ''
    }
  }

  closeMenu(e) {
    // Close dropdown menu if clicking outside
    if (this.hasMenuTarget && !this.element.contains(e.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }

  handleResize() {
    // Auto-close mobile menu on desktop
    if (window.innerWidth >= 768) {
      this.closeMobileMenu()
    }
  }
}