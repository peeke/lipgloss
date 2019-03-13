import attributes from "./Attributes";
import { dispatch, reflow } from "./util";

/**
 * @class Transition
 * @classdesc Basic Transition class. All transitions you create should have this class as
 * (grand)parent. When extending Transition, as a rule of thumb it's good to call this the
 * super functions before your own functionality. E.g.: Sometimes you may want to do some
 * preperation work, in which it is just fine to do this before you call super.exit()
 *
 * If you extend Transition, but choose to implement your own enter method, you have to call
 * this.updateHtml(newNode) to update the HTML in order to preserve the lifecycle events.
 * @example <caption>Extending Transition</caption>
 * async exit() {
 *   super.exit()
 *   // Your code
 * }
 */
class Transition {
  /**
   * @param {Element} view - The view element
   */
  constructor(view) {
    this._view = view;
    this.willExit = this.willEnter = this.didExit = this.didEnter = this.didComplete = Promise.resolve();
    this.exitStart = this.enterStart = this.exitDone = this.enterDone = () => {};
  }

  get view() {
    return this._view;
  }

  reset() {
    this.willExit = new Promise(resolve => (this.exitStart = resolve));
    this.willEnter = new Promise(resolve => (this.enterStart = resolve));
    this.didExit = new Promise(resolve => (this.exitDone = resolve));
    this.didEnter = new Promise(resolve => (this.enterDone = resolve));
    this.didComplete = Promise.all([this.didExit, this.didEnter]);
  }

  async beforeExit() {
    return;
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async exit() {
    this._view.removeAttribute(attributes.dict.transition);
    reflow(this._view);
    this._view.setAttribute(attributes.dict.transition, "out");
  }

  /**
   * @description Loading transition for the given view. This transition state will only occur
   * if the requested document is still loading when exit() completes.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
   */
  async loading() {
    this._view.removeAttribute(attributes.dict.transition);
    reflow(this._view);
    this._view.setAttribute(attributes.dict.transition, "loading");
  }

  async beforeEnter() {
    return;
  }

  /**
   * @description Enter transition for the given view.
   * @param {String} newNode - The new views node
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async enter(newNode, newDoc) {
    this.updateHtml(newNode);
    this._view.removeAttribute(attributes.dict.transition);
    reflow(this._view);
    this._view.setAttribute(attributes.dict.transition, "in");
  }

  /**
   * Updates the view element with new HTML and dispatches the 'viewhtmldidupdate' lifecycle event
   * @param {String} newNode - The new views node
   */
  updateHtml(newNode) {
    dispatch(this._view, "viewhtmlwillupdate")
    this._view.innerHTML = newNode.innerHTML;
    dispatch(this._view, "viewhtmldidupdate")
  }

  /**
   * Cleans up after transitions have completed
   */
  done() {
    this.exitStart();
    this.exitDone();
    this.enterStart();
    this.enterDone();
    this._view.removeAttribute(attributes.dict.transition);
    reflow(this._view);
  }
}

export default Transition;