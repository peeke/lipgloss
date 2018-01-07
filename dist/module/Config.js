/**
 * @class Config
 * @classdesc Configuration class for Lipgloss
 */
class Config {

  /**
   * Unless overwritten, the default attributes are used
   */
  constructor () {
    this._attributes = Config.defaultAttributes
  }

  /**
   * Object with the default attribute mappings.
   * Used attributes are: 'data-view-link', 'data-active', 'data-view-hint', 'data-view', 'data-view-active', 'data-activate-view', 'data-views-loading', 'data-persist-view' and 'data-transition'.
   * @type {object}
   */
  static get defaultAttributes() {
    return {
      'data-view-link': 'data-view-link',
      'data-view-link-active': 'data-active',
      'data-view-hint': 'data-view-hint',
      'data-view': 'data-view',
      'data-view-active': 'data-view-active',
      'data-activate-view': 'data-activate-view',
      'data-views-loading': 'data-views-loading',
      'data-persist-view': 'data-persist-view',
      'data-transition': 'data-transition'
    }
  }

  /**
   * Overwrite the default attributes
   * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
   */
  overrideAttributes (attributes) {
    this._attributes = Object.assign(Config.defaultAttributes, attributes)
  }

  /**
   * Get the attribute name for a given normalized attribute name
   * @param {string} attribute - The normalized attribute name
   * @returns {string} - The configured attribute name
   */
  attribute (attribute) {
    return this._attributes[attribute]
  }

}

export default new Config()
