import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    setTimeout(() => {
      this.hide();
    }, 3000); // 3000 milliseconds = 3 seconds
  }

  hide() {
    this.element.style.transition = "opacity 1s";
    this.element.style.opacity = "0";
    setTimeout(() => {
      this.element.remove();
    }, 1000); // Wait for the transition to finish before removing the element
  }

  remove(event) {
    if (event.animationName === "fadeOut") {
      this.element.remove();
    }
  }
}