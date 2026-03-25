import type { DirectiveBinding } from 'vue'

/**
 * Handler used to process click outside events.
 */
type ClickOutsideHandler = (event: Event) => void
/**
 * HTMLElement enriched with the click outside handler reference.
 */
type ClickOutsideElement = HTMLElement & { clickOutsideEvent?: ClickOutsideHandler }

export default {
  /**
   * Mounted hook
   * @param {ClickOutsideElement} el - The element the directive is bound to
   * @param {DirectiveBinding<(event: Event, el: ClickOutsideElement) => void>} binding - An object containing the directive's information
   * @returns {void}
   */
  mounted(el: ClickOutsideElement, binding: DirectiveBinding<(event: Event, el: ClickOutsideElement) => void>): void {
    /**
     * Click outside event
     * @param {Event} event - The event object
     * @returns {void}
     */
    el.clickOutsideEvent = function (event: Event): void {
      const eventTarget: EventTarget | null = event.target
      if (!(el === eventTarget || (eventTarget instanceof Node && el.contains(eventTarget)))) {
        binding.value(event, el)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  /**
   * Unmounted hook
   * @param {ClickOutsideElement} el - The element the directive is bound to
   * @returns {void}
   */
  unmounted(el: ClickOutsideElement): void {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  },
}
