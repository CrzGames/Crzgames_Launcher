import type { DirectiveBinding } from 'vue'

export default {
  /**
   * Mounted hook
   * @param {any} el - The element the directive is bound to
   * @param {DirectiveBinding} binding - An object containing the directive's information
   * @returns {void}
   */
  mounted(el: any, binding: DirectiveBinding): void {
    /**
     * Click outside event
     * @param {Event} event - The event object
     * @returns {void}
     */
    el.clickOutsideEvent = function (event: Event): void {
      if (!(el == event.target || el.contains(event.target))) {
        binding.value(event, el)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  /**
   * Unmounted hook
   * @param {any} el - The element the directive is bound to
   * @returns {void}
   */
  unmounted(el: any): void {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}
