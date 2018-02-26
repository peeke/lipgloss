/**
 * @class Attributes
 * @classdesc Attribute configuration class for Lipgloss
 */
class Attributes {

  /**
   * Unless overwritten, the default attributes are used
   */
  constructor () {
    this._attributes = {
      view: 'data-view',
      viewLink: 'data-view-link',
      viewActive: 'data-view-active',
      viewsLoading: 'data-views-loading',
      activateView: 'data-activate-view',
      persistView: 'data-persist-view',
      transition: 'data-transition'
    }
  }

  /**
   * Returns the dictionary with attributes
   */
  get dict() {
    return this._attributes
  }

  /**
   * Overwrite the default attributes
   * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
   */
  assign (attributes) {
    this._attributes = Object.assign(this._attributes, attributes)
  }

}

export default new Attributes()
