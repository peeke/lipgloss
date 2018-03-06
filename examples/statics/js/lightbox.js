(function () {
'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * @class Attributes
 * @classdesc Attribute configuration class for Lipgloss
 */
var Attributes = function () {

  /**
   * Unless overwritten, the default attributes are used
   */
  function Attributes() {
    classCallCheck(this, Attributes);

    this._attributes = {
      view: 'data-view',
      viewLink: 'data-view-link',
      viewActive: 'data-view-active',
      viewsLoading: 'data-views-loading',
      activateView: 'data-activate-view',
      persistView: 'data-persist-view',
      transition: 'data-transition'
    };
  }

  /**
   * Returns the dictionary with attributes
   */


  createClass(Attributes, [{
    key: 'assign',


    /**
     * Overwrite the default attributes
     * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
     */
    value: function assign(attributes) {
      this._attributes = Object.assign(this._attributes, attributes);
    }
  }, {
    key: 'dict',
    get: function get$$1() {
      return this._attributes;
    }
  }]);
  return Attributes;
}();

var attributes = new Attributes();

var _async$2 = function () {
  try {
    if (isNaN.apply(null, {})) {

      return function (f) {
        return function () {
          try {
            return Promise.resolve(f.apply(this, arguments));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      };
    }
  } catch (e) {}return function (f) {
    // Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
    return function () {
      try {
        return Promise.resolve(f.apply(this, Array.prototype.slice.call(arguments)));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}();var reflow = function reflow(element) {
  return element.offsetHeight;
};
var eventOptions$1 = { bubbles: true, cancelable: true /**
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
};
var Transition = function () {

  /**
   * @param {Element} view - The view element
   */
  function Transition(view) {
    classCallCheck(this, Transition);

    this._view = view;
    this.didExit = this.didEnter = this.didComplete = Promise.resolve();
  }

  createClass(Transition, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this.didExit = new Promise(function (resolve) {
        return _this.exitDone = resolve;
      });
      this.didEnter = new Promise(function (resolve) {
        return _this.enterDone = resolve;
      });
      this.didComplete = Promise.all([this.didExit, this.didEnter]);
    }

    /**
     * @description Exit transition for the given view.
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
     */

  }, {
    key: 'exit',
    value: _async$2(function () {
      var _this2 = this;

      _this2._view.removeAttribute(attributes.dict.transition);
      reflow(_this2._view);
      _this2._view.setAttribute(attributes.dict.transition, 'out');
    })

    /**
     * @description Loading transition for the given view. This transition state will only occur
     * if the requested document is still loading when exit() completes.
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
     */

  }, {
    key: 'loading',
    value: _async$2(function () {
      var _this3 = this;

      _this3._view.removeAttribute(attributes.dict.transition);
      reflow(_this3._view);
      _this3._view.setAttribute(attributes.dict.transition, 'loading');
    })

    /**
     * @description Enter transition for the given view.
     * @param {String} newNode - The new views node
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
     */

  }, {
    key: 'enter',
    value: _async$2(function (newNode, newDoc) {
      var _this4 = this;

      _this4.updateHtml(newNode);
      _this4._view.removeAttribute(attributes.dict.transition);
      reflow(_this4._view);
      _this4._view.setAttribute(attributes.dict.transition, 'in');
    })

    /**
     * Updates the view element with new HTML and dispatches the 'viewhtmlupdated' lifecycle event
     * @param {String} newNode - The new views node
     */

  }, {
    key: 'updateHtml',
    value: function updateHtml(newNode) {
      this._view.dispatchEvent(new CustomEvent('viewhtmlwillupdate', eventOptions$1));
      this._view.innerHTML = newNode.innerHTML;
      this._view.dispatchEvent(new CustomEvent('viewhtmldidupdate', eventOptions$1));
    }

    /**
     * Cleans up after transitions have completed
     */

  }, {
    key: 'done',
    value: function done() {
      this.exitDone();
      this.enterDone();
      this._view.removeAttribute(attributes.dict.transition);
      reflow(this._view);
    }
  }, {
    key: 'view',
    get: function get$$1() {
      return this._view;
    }
  }]);
  return Transition;
}();

var _async$1 = function () {
  try {
    if (isNaN.apply(null, {})) {
      return function (f) {
        return function () {
          try {
            return Promise.resolve(f.apply(this, arguments));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      };
    }
  } catch (e) {}return function (f) {
    // Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
    return function () {
      try {
        return Promise.resolve(f.apply(this, Array.prototype.slice.call(arguments)));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}();function _invoke(body, then) {
  var result = body();if (result && result.then) {
    return result.then(then);
  }return then(result);
}function _await$1(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }value = Promise.resolve(value);return then ? value.then(then) : value;
}var unique = function unique(arr) {
  return Array.from(new Set(arr));
};
var eventOptions = { bubbles: true, cancelable: true

  /**
   * @class View
   * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
   */
};
var View = function () {

  /**
   * @param {Element} element - The element associated with the view
   * @param {Object} options - Options for the view
   * @param {string|null} options.name = null - The name of the view. You should set this
   * @param {boolean} options.persist = false - If a view is persistant, it will not exit if it's not found within the loaded document.
   * @param {Transition} options.transition = Transition - The transition to use for this view
   * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
   * @param {Model|null} options.model = null - The initial model of the view. You should set this.
   */
  function View(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, View);


    this._element = element;
    this._options = Object.assign(View.options, options);

    this.active = !!this._element.innerHTML.trim();

    this._persist = typeof this._options.persist === 'undefined' ? this._element.hasAttribute(attributes.dict.persistView) : this._options.persist;

    this._activeModel = this._options.model;
    this._selector = '[' + attributes.dict.view + '="' + this._options.name + '"]';
    this._transition = new this._options.transition(this._element);

    if (!(this._transition instanceof Transition)) {
      throw new Error('Provided transition is not an instance of Transition');
    }
  }

  /**
   * Default options
   * @type {object}
   */


  createClass(View, [{
    key: '_activate',


    /**
     * Activate a new Model for this View. The selector will query the retreived document for a node to use.
     * @param {Model} model - The model to update the view with
     * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
     * @private
     */
    value: _async$1(function (model) {
      var _this = this;

      _this.loading = true;
      model.doc.then(function () {
        _this.loading = false;
      });

      return _invoke(function () {
        if (_this.active) {
          _this._dispatch('viewwillexit');
          return _await$1(_this._transition.exit(), function () {
            _this._dispatch('viewdidexit');
          });
        }
      }, function () {
        _this._transition.exitDone();
        _this.loading && _this._transition.loading();

        return _await$1(model.doc, function (doc) {
          var node = doc.querySelector(_this._selector);
          var active = node && Boolean(node.innerHTML.trim());

          return _invoke(function () {
            if (active) {
              _this._dispatch('viewwillenter');
              return _await$1(_this._transition.enter(node, doc), function () {
                _this._transition.enterDone();
                _this._dispatch('viewdidenter');
                _this._activeModel = model;
              });
            } else {
              _this._activeModel = null;
            }
          }, function () {
            _this.active = active;
          });
        });
      });
    })

    /**
     * Deactivate the Model for this View.
     * @private
     */

  }, {
    key: '_deactivate',
    value: _async$1(function () {
      var _this2 = this;

      if (!_this2.active) return;
      if (_this2._persist) return;

      _this2._dispatch('viewwillexit');
      return _await$1(_this2._transition.exit(), function () {
        _this2._transition.exitDone();
        _this2._dispatch('viewdidexit');

        _this2.active = false;
        _this2._activeModel = null;
      });
    })
  }, {
    key: '_dispatch',
    value: function _dispatch(eventName) {
      this._element.dispatchEvent(new CustomEvent(eventName, eventOptions));
    }
  }, {
    key: 'active',


    /**
     * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
     * @returns {boolean} - Active
     */
    get: function get$$1() {
      return this._active;
    }

    /**
     * Set the active state of this View.
     * @param {boolean} bool - Active
     */
    ,
    set: function set$$1(bool) {
      this._active = bool;
      this._element.setAttribute(attributes.dict.viewActive, bool);
    }

    /**
     * @returns {boolean} - Whether this View is loading
     */

  }, {
    key: 'loading',
    get: function get$$1() {
      return this._isLoading;
    }

    /**
     * Set's the loading state for this View
     * @param {boolean} bool
     */
    ,
    set: function set$$1(bool) {
      var _this3 = this;

      this._isLoading = bool;
      var loadingViews = document.body.hasAttribute(attributes.dict.viewsLoading) ? document.body.getAttribute(attributes.dict.viewsLoading).split(' ') : [];

      var newLoadingViews = bool ? unique([].concat(toConsumableArray(loadingViews), [this._options.name])) : loadingViews.filter(function (name) {
        return name !== _this3._options.name;
      });

      document.body.setAttribute(attributes.dict.viewsLoading, newLoadingViews.join(' '));
    }

    /**
     * @returns {Model} - The Model currently associated with this view
     */

  }, {
    key: 'model',
    get: function get$$1() {
      return this._activeModel;
    }

    /**
     * Set the model associated with this view
     * Has three flows:
     *   1. The same Model is already set, do nothing
     *   2. The view is included in the Model, activate
     *   3. The view is not included in the Model, deactivate
     * @param {Model} model
     */
    ,
    set: function set$$1(model) {
      var _this4 = this;

      this._transition.start();

      var isAlreadySet = this._activeModel && this._activeModel === model;
      if (isAlreadySet) {
        this._transition.done();
        return;
      }

      model.includesView(this._options.name).then(function (includesView) {
        return includesView ? _this4._activate(model) : _this4._deactivate();
      }).then(function () {
        return _this4._transition.done();
      }).catch(function (err) {
        console.error(err);
        throw new Error('Hint \'' + _this4._options.name + '\' was given, but not found in the loaded document.');
      });
    }

    /**
     * @returns {string} - The name of this view
     */

  }, {
    key: 'name',
    get: function get$$1() {
      return this._options.name;
    }
  }, {
    key: 'transition',
    get: function get$$1() {
      return this._transition;
    }
  }], [{
    key: 'options',
    get: function get$$1() {
      return {
        name: null,
        persist: false,
        transition: Transition,
        model: null
      };
    }
  }]);
  return View;
}();

var _async$3 = function () {
  try {
    if (isNaN.apply(null, {})) {
      return function (f) {
        return function () {
          try {
            return Promise.resolve(f.apply(this, arguments));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      };
    }
  } catch (e) {}return function (f) {
    // Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
    return function () {
      try {
        return Promise.resolve(f.apply(this, Array.prototype.slice.call(arguments)));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}();function _await$2(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }value = Promise.resolve(value);return then ? value.then(then) : value;
}/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */

var Model = function () {

  /**
   * Initialize a new Model
   * @param {object} options - The configuration for the Model
   * @param {string} options.url - The url to request
   * @param {array} options.hints=string[] - The views expected to be present on the requested page
   * @param {object} fetchOptions = The options used to fetch the url
   */
  function Model(options, fetchOptions) {
    classCallCheck(this, Model);

    this._request = new Request(options.url, fetchOptions);
    this._hints = options.hints || [];
    this._doc = null;
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */


  createClass(Model, [{
    key: 'includesView',


    /**
     * A check to see if name was included the given hints
     * @param {string} name - A name of a view
     * @returns {boolean}
     */
    value: _async$3(function (name) {
      var _this = this;

      if (_this._hints.includes(name)) return true;
      return _await$2(_this.doc, function (doc) {
        return Boolean(doc.querySelector('[' + attributes.dict.view + '="' + name + '"]'));
      });
    })

    /**
     * Get an object representation of the Model, which can be added to the history state. You can pass it to the
     * options parameter in the constructor to recreate the model:
     * @example <caption>Using the model representation</caption>
     * const representation = model.getRepresentation()
     * const twin = new Model(representation, fetchOptions)
     * @returns {{url: string, hints: string[]}}
     */

  }, {
    key: 'getRepresentation',
    value: function getRepresentation() {
      return { url: this._request.url, hints: this._hints };
    }
  }, {
    key: 'url',
    get: function get$$1() {
      return this._request.url;
    }

    /**
     * @description Gets the loaded document (lazily)
     * @returns {Promise.<Element>} - A promise containing the new document
     */

  }, {
    key: 'doc',
    get: function get$$1() {
      if (!this._doc) {
        this._doc = fetch(this._request).then(function (response) {
          return response.ok ? response : Promise.reject();
        }).then(function (response) {
          return response.text();
        }).then(function (html) {
          return new DOMParser().parseFromString(html, 'text/html');
        });
      }
      return this._doc;
    }
  }]);
  return Model;
}();

function _continueIgnored(value) {
  if (value && value.then) {
    return value.then(_empty);
  }
}function _empty() {}function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    try {
      return recover(e);
    } catch (e2) {
      return Promise.reject(e2);
    }
  }if (result && result.then) {
    return result.then(void 0, recover);
  }return result;
}function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }value = Promise.resolve(value);return then ? value.then(then) : value;
}var _async = function () {
  try {
    if (isNaN.apply(null, {})) {
      return function (f) {
        return function () {
          try {
            return Promise.resolve(f.apply(this, arguments));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      };
    }
  } catch (e) {}return function (f) {
    // Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
    return function () {
      try {
        return Promise.resolve(f.apply(this, Array.prototype.slice.call(arguments)));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}();var SUPPORTED = 'pushState' in history;

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */

var Controller = function () {
  function Controller() {
    classCallCheck(this, Controller);
  }

  createClass(Controller, [{
    key: 'init',


    /**
     * Controller is a singleton which should be initialized once trough the init() method to set the options
     * @param {object} options - Options
     * @param {string[]} options.defaultHints - Which views are expected to be present, when a link is loaded with an empty [data-view-link]
     * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
     * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
     * @param {object} options.fetch - The options to pass into a fetch request
     */
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


      if (!SUPPORTED) return;

      if (this._initialized) {
        throw new Error('You can only initialize Lipgloss once.');
      }

      this._initialized = true;
      this._options = Object.assign(Controller.options, options);
      this._viewsMap = new WeakMap();

      attributes.assign(this._options.attributes);

      var url = this._options.sanitizeUrl(window.location.href);
      this._model = new Model({ url: url, hints: this._options.defaultHints }, this._options.fetch);

      this._addHistoryEntry(this._model, true);
      this._bindEvents();

      this.initializeContext(document);
    }

    /**
     * Default init options
     * @type {object}
     */

  }, {
    key: 'didExit',
    value: function didExit(name) {
      return this._getViewByName(name).transition.didExit;
    }
  }, {
    key: 'didEnter',
    value: function didEnter(name) {
      return this._getViewByName(name).transition.didEnter;
    }
  }, {
    key: 'didComplete',
    value: function didComplete(name) {
      return this._getViewByName(name).transition.didComplete;
    }

    /**
     * Bind global events
     * @private
     */

  }, {
    key: '_bindEvents',
    value: function _bindEvents() {
      var _this = this;

      this._onLinkClick = this._onLinkClick.bind(this);
      this._onActivateViewClick = this._onActivateViewClick.bind(this);
      document.addEventListener('viewdidenter', function (e) {
        return _this.initializeContext(e.target);
      });
      window.addEventListener('popstate', function (e) {
        return _this._onPopState(e);
      });
    }

    /**
     * Initialize a piece of context. Is automatically called after a Transition updates the HTML, but can also be called
     * manually if you have udpated the HTML manually.
     * This function creates Views when they are not initialized yet and binds events for the context.
     * @param {Element} context - The context to intialize
     */

  }, {
    key: 'initializeContext',
    value: function initializeContext(context) {
      var _this2 = this;

      Array.from(context.querySelectorAll('[' + attributes.dict.view + ']')).filter(function (element) {
        return !_this2._viewsMap.has(element);
      }).forEach(function (element) {
        return _this2._viewsMap.set(element, _this2._buildView(element, _this2._model));
      });

      Array.from(context.querySelectorAll('[href][' + attributes.dict.viewLink + ']')).forEach(function (link) {
        return link.addEventListener('click', _this2._onLinkClick);
      });

      Array.from(context.querySelectorAll('[' + attributes.dict.activateView + ']')).forEach(function (link) {
        return link.addEventListener('click', _this2._onActivateViewClick);
      });
    }

    /**
     * Creates a View component based on a given element and an initial model
     * @param {Element} element - The element to create a view for
     * @param {Model} model - The initial model for the view
     * @returns {View} - The created view
     * @private
     */

  }, {
    key: '_buildView',
    value: function _buildView(element, model) {
      var name = element.getAttribute(attributes.dict.view);
      var persist = element.hasAttribute(attributes.dict.persistView);
      var transition = this._options.transitions[name] || Transition;
      return new View(element, { name: name, transition: transition, persist: persist, model: model });
    }

    /**
     * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
     * document. This is the case when the doc which is loaded contains views which are not in the current document and
     * do not have a parent view which is in the current document.
     * @param doc
     * @private
     */

  }, {
    key: '_throwOnUnknownViews',
    value: function _throwOnUnknownViews(doc) {
      var _this3 = this;

      var message = function message(name) {
        return 'Not able to determine where [' + attributes.dict.view + '=\'' + name + '\'] should be inserted.';
      };

      Array.from(doc.querySelectorAll('[' + attributes.dict.view + ']')).map(function (viewElement) {
        return viewElement.getAttribute(attributes.dict.view);
      }).filter(function (name) {
        return !_this3.views.some(function (view) {
          return view.name === name;
        });
      }).forEach(function (name) {
        throw new Error(message(name));
      });
    }

    /**
     * Checks whether a url is equal to the current url (after sanitizing)
     * @param {string} url - The url to compare to the current url
     * @returns {boolean}
     * @private
     */

  }, {
    key: '_isCurrentUrl',
    value: function _isCurrentUrl(url) {
      return this._options.sanitizeUrl(url) === this._options.sanitizeUrl(window.location.href);
    }

    /**
     * Handles a click on an element with a [data-view-link] attribute.
     * Loads the document found at [href], unless that's the current url already.
     * This function calls the _updatePage function and adds a history entry.
     * @param {Event} e - Click event
     * @private
     */

  }, {
    key: '_onLinkClick',
    value: _async(function (e) {
      var _this4 = this;

      e.preventDefault();

      var url = _this4._options.sanitizeUrl(e.currentTarget.href);
      var viewLink = e.currentTarget.getAttribute(attributes.dict.viewLink);
      var hints = viewLink ? viewLink.split(',') : _this4._options.defaultHints;
      var model = new Model({ url: url, hints: hints }, _this4._options.fetch);

      _this4._updatePage(model);
      _this4._addHistoryEntry(model);
    })

    /**
     * Handles a click on an element with a [data-activate-view="viewname"] attribute.
     * Navigates to the current url of the given View. This is particularly useful when you want to close an overlay or lightbox.
     * This function calls the _updatePage function and adds a history entry.
     * @param {Event} e - Click event
     * @private
     */

  }, {
    key: '_onActivateViewClick',
    value: function _onActivateViewClick(e) {
      e.preventDefault();
      var name = e.currentTarget.getAttribute(attributes.dict.activateView);
      this.activateView(name);
    }

    /**
     * Activate a view by name
     * @param {string} name - Name of the view to activate
     */

  }, {
    key: 'activateView',
    value: function activateView(name) {
      var model = this._getViewByName(name).model;
      this._updatePage(model);
      this._addHistoryEntry(model);
    }

    /**
     * Retreive a Model from a View
     * @param {string} name - The name of a View
     * @returns {Model} - The model currently active for the given View
     * @private
     */

  }, {
    key: '_getViewByName',
    value: function _getViewByName(name) {
      var element = document.querySelector('[' + attributes.dict.view + '="' + name + '"]');
      return this._viewsMap.get(element);
    }

    /**
     * Recreate a model for a given popstate and update the page
     * @param {Event} e - Event
     * @private
     */

  }, {
    key: '_onPopState',
    value: function _onPopState(e) {
      try {
        var model = new Model(e.state.model, this._options.fetch);
        this._updatePage(model);
      } catch (err) {}
    }

    /**
     * Updates given views in a page with a new model
     * @param {Model} model - The model to update the page with
     * @returns {Promise.<void>} - Resolves when updating the page is done
     * @private
     */

  }, {
    key: '_updatePage',
    value: _async(function (model) {
      var _this5 = this;

      window.dispatchEvent(new CustomEvent('pagewillupdate'));
      _this5._model = model;
      return _continueIgnored(_catch(function () {
        var views = _this5.views;
        var transitions = views.forEach(function (view) {
          return view.model = model;
        });

        var done = Promise.all(views.map(function (view) {
          return view.transition;
        }).map(function (transition) {
          return transition.didComplete;
        }));

        return _await(model.doc, function (doc) {
          _this5._throwOnUnknownViews(doc);
          _this5._options.updateDocument(doc);

          return _await(done, function () {
            window.dispatchEvent(new CustomEvent('pagedidupdate'));
          });
        });
      }, function (err) {
        console.error(err);
        window.location.href = model.url;
      }));
    })

    /**
     * Add an history entry
     * @param {Model} model - The model to add an history entry for
     * @param {boolean} [replaceEntry=false] - Whether to replace the history entry, instead of pushing it.
     * @private
     */

  }, {
    key: '_addHistoryEntry',
    value: function _addHistoryEntry(model) {
      var replaceEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


      var state = {
        title: document.title,
        url: model.url,
        model: model.getRepresentation()
      };

      var method = replaceEntry ? 'replaceState' : 'pushState';
      history[method](state, document.title, model.url);

      window.dispatchEvent(new CustomEvent('statechange', { detail: state }));
    }
  }, {
    key: 'views',


    /**
     * Return all the views contained in the current document
     * @returns {View[]} - An array of View instances
     */
    get: function get$$1() {
      var _this6 = this;

      return Array.from(document.querySelectorAll('[' + attributes.dict.view + ']')).map(function (element) {
        return _this6._viewsMap.get(element);
      });
    }
  }], [{
    key: 'options',
    get: function get$$1() {
      return {
        defaultHints: [],
        transitions: {},
        sanitizeUrl: function sanitizeUrl(url) {
          return url;
        },
        updateDocument: function updateDocument(doc) {
          document.title = doc.title;
        },
        attributes: {},
        fetch: {
          credentials: 'same-origin',
          cache: 'default',
          redirect: 'error',
          headers: {
            'X-Requested-With': 'XmlHttpRequest'
          }
        }
      };
    }
  }]);
  return Controller;
}();

var lipgloss = new Controller();

var _async$4 = function () {
  try {
    if (isNaN.apply(null, {})) {
      return function (f) {
        return function () {
          try {
            return Promise.resolve(f.apply(this, arguments));
          } catch (e) {
            return Promise.reject(e);
          }
        };
      };
    }
  } catch (e) {}return function (f) {
    // Pre-ES5.1 JavaScript runtimes don't accept array-likes in Function.apply
    return function () {
      try {
        return Promise.resolve(f.apply(this, Array.prototype.slice.call(arguments)));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  };
}();function _awaitIgnored(value, direct) {
  if (!direct) {
    return Promise.resolve(value).then(_empty$1);
  }
}function _empty$1() {}/**
 * Extended Transition
 */
var AnimationTransition = function (_Transition) {
  inherits(AnimationTransition, _Transition);

  function AnimationTransition() {
    classCallCheck(this, AnimationTransition);
    return possibleConstructorReturn(this, (AnimationTransition.__proto__ || Object.getPrototypeOf(AnimationTransition)).apply(this, arguments));
  }

  createClass(AnimationTransition, [{
    key: 'exit',


    /**
     *
     */
    value: _async$4(function () {
      var _this2 = this;

      get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), 'exit', _this2).call(_this2);
      return _awaitIgnored(new Promise(function (resolve) {
        var animationEnd = function animationEnd(e) {
          if (e.target !== _this2._view) return;
          _this2._view.removeEventListener('animationend', animationEnd);
          resolve();
        };
        _this2._view.addEventListener('animationend', animationEnd);
      }));
    })

    /**
     *
     * @param {String} html - HTML to load in the view
     */

  }, {
    key: 'enter',
    value: _async$4(function (node) {
      var _this3 = this;

      get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), 'enter', _this3).call(_this3, node);
      return _awaitIgnored(new Promise(function (resolve) {
        var animationEnd = function animationEnd(e) {
          if (e.target !== _this3._view) return;
          _this3._view.removeEventListener('animationend', animationEnd);
          resolve();
        };
        _this3._view.addEventListener('animationend', animationEnd);
      }));
    })
  }]);
  return AnimationTransition;
}(Transition);

lipgloss.init({
  defaultHints: ['main', 'navigation'],
  transitions: {
    main: AnimationTransition,
    lightbox: AnimationTransition
  }
});

}());
