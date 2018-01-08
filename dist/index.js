(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.lipgloss = {})));
}(this, (function (exports) { 'use strict';

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

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









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * @class Config
 * @classdesc Configuration class for Lipgloss
 */
var Config = function () {

  /**
   * Unless overwritten, the default attributes are used
   */
  function Config() {
    classCallCheck(this, Config);

    this._overrides = {};
  }

  /**
   * Overwrite the default attributes
   * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
   */


  createClass(Config, [{
    key: "assign",
    value: function assign(attributes) {
      this._overrides = Object.assign(this._overrides, attributes);
    }

    /**
     * Get the attribute name for a given normalized attribute name
     * @param {string} attribute - The normalized attribute name
     * @returns {string} - The configured attribute name
     */

  }, {
    key: "attribute",
    value: function attribute(_attribute) {
      return this._overrides[_attribute] || _attribute;
    }
  }]);
  return Config;
}();

var config = new Config();

var attr$2 = function attr(key) {
  return config.attribute(key);
};
var reflow = function reflow(element) {
  return element.offsetHeight;
};

/**
 * @class Transition
 * @classdesc Basic Transition class. All transitions you create should have this class as (grand)parent. When extending Transition,
 * as a rule of thumb it's good to call this the super functions before your own functionality. E.g.:
 * Sometimes you may want to do some preperation work, in which it is just fine to do this before you call super.exit()
 * @example <caption>Extending Transition</caption>
 * async exit() {
 *   super.exit()
 *   // Your code
 * }
 */

var Transition = function () {

  /**
   * @param {Element} view - The view element
   */
  function Transition(view) {
    classCallCheck(this, Transition);

    this._view = view;
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */


  createClass(Transition, [{
    key: 'exit',
    value: function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this._view.removeAttribute(attr$2('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr$2('data-transition'), 'out');

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function exit() {
        return _ref.apply(this, arguments);
      }

      return exit;
    }()

    /**
     * @description Loading transition for the given view. This transition state will only occur if the requested document is still loading when exit() completes.
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
     */

  }, {
    key: 'loading',
    value: function () {
      var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this._view.removeAttribute(attr$2('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr$2('data-transition'), 'loading');

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loading() {
        return _ref2.apply(this, arguments);
      }

      return loading;
    }()

    /**
     * @description Exit transition for the given view.
     * @param {String} node - The new views node
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
     */

  }, {
    key: 'enter',
    value: function () {
      var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(node) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._view.innerHTML = node.innerHTML;
                this._view.removeAttribute(attr$2('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr$2('data-transition'), 'in');

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function enter(_x) {
        return _ref3.apply(this, arguments);
      }

      return enter;
    }()
  }]);
  return Transition;
}();

var dispatchEvent = function dispatchEvent(source, event) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { bubbles: true, cancelable: true };

  source.dispatchEvent(new CustomEvent(event, options));
};

var unique = function unique(arr) {
  return Array.from(new Set(arr));
};
var attr$1 = function attr(key) {
  return config.attribute(key);
};

/**
 * @class View
 * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
 */

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
    this._persist = this._element.hasAttribute(attr$1('data-persist-view'));
    this._activeModel = this._options.model;

    var ViewTransition = this._options.transition;
    this._transition = new ViewTransition(this._element);

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
    value: function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(model) {
        var _this = this;

        var node, active;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                this.loading = true;
                model.doc.then(function () {
                  _this.loading = false;
                });

                _context.t0 = this.active;

                if (!_context.t0) {
                  _context.next = 6;
                  break;
                }

                _context.next = 6;
                return this._exit();

              case 6:
                this.loading && this._transition.loading();

                _context.next = 9;
                return model.querySelector(this.selector);

              case 9:
                node = _context.sent;
                active = !!node.innerHTML.trim();

                if (!active) {
                  _context.next = 17;
                  break;
                }

                _context.next = 14;
                return this._enter(node);

              case 14:
                this._activeModel = model;
                _context.next = 18;
                break;

              case 17:
                this._activeModel = null;

              case 18:

                this.active = active;

              case 19:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _activate(_x2) {
        return _ref.apply(this, arguments);
      }

      return _activate;
    }()

    /**
     * Deactivate the Model for this View.
     * @private
     */

  }, {
    key: '_deactivate',
    value: function () {
      var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.active) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                if (!this._persist) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt('return');

              case 4:
                _context2.next = 6;
                return this._exit();

              case 6:
                this.active = false;
                this._activeModel = null;

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _deactivate() {
        return _ref2.apply(this, arguments);
      }

      return _deactivate;
    }()

    /**
     * Initialize the enter transition and fire relevant lifecycle events
     * @param {Element} node - The new node to update the view with
     * @returns {Promise.<void>}
     * @private
     */

  }, {
    key: '_enter',
    value: function () {
      var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(node) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                dispatchEvent(this._element, 'viewwillenter', this.eventOptions);
                _context3.next = 3;
                return this._transition.enter(node);

              case 3:
                dispatchEvent(this._element, 'viewdidenter', this.eventOptions);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _enter(_x3) {
        return _ref3.apply(this, arguments);
      }

      return _enter;
    }()

    /**
     * Initialize the exit transition and fire relevant lifecycle events
     * @returns {Promise.<void>}
     * @private
     */

  }, {
    key: '_exit',
    value: function () {
      var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                dispatchEvent(this._element, 'viewwillexit', this.eventOptions);
                _context4.next = 3;
                return this._transition.exit();

              case 3:
                dispatchEvent(this._element, 'viewdidexit', this.eventOptions);

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _exit() {
        return _ref4.apply(this, arguments);
      }

      return _exit;
    }()
  }, {
    key: 'eventOptions',
    get: function get$$1() {
      return {
        bubbles: true,
        cancelable: true,
        detail: {
          name: this._name
        }
      };
    }

    /**
     * The selector to use to obtain a new node for this View from the loaded document
     * @returns {string}
     */

  }, {
    key: 'selector',
    get: function get$$1() {
      return this._options.selector || '[' + attr$1('data-view') + '="' + this._options.name + '"]';
    }

    /**
     * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
     * @returns {boolean} - Active
     */

  }, {
    key: 'active',
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
      this._element.setAttribute(attr$1('data-view-active'), bool);
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
      var _this2 = this;

      this._isLoading = bool;
      var loadingViews = document.body.hasAttribute(attr$1('data-views-loading')) ? document.body.getAttribute(attr$1('data-views-loading')).split(' ') : [];

      var newLoadingViews = bool ? unique([].concat(toConsumableArray(loadingViews), [this._options.name])) : loadingViews.filter(function (name) {
        return name !== _this2._options.name;
      });

      document.body.setAttribute(attr$1('data-views-loading'), newLoadingViews.join(' '));
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
     * @param {Model} model
     */
    ,
    set: function set$$1(model) {
      var _this3 = this;

      if (this._activeModel && this._activeModel.url === model.url) {
        return;
      }

      var modelHasHint = model.includesView(this._options.name);
      var docHasView = Promise.resolve(modelHasHint || model.querySelector(this.selector));
      docHasView.then(function () {
        return _this3._activate(model);
      }, function () {
        return _this3._deactivate();
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
  }], [{
    key: 'options',
    get: function get$$1() {
      return {
        name: null,
        persist: false,
        transition: Transition,
        selector: null,
        model: null
      };
    }
  }]);
  return View;
}();

/**
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
    value: function includesView(name) {
      return this._hints.includes(name);
    }

    /**
     * Queries the loaded document for the selector, rejects if it's not found
     * @param {string} selector='body' - The selector to query for
     * @returns {Promise.<node>} - The node found in the loaded document
     */

  }, {
    key: 'querySelector',
    value: function querySelector() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';

      return this.doc.then(function (doc) {
        return doc.querySelector(selector);
      }).then(function (node) {
        return node || Promise.reject();
      });
    }

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

var SUPPORTED = 'pushState' in history;
var attr = function attr(key) {
  return config.attribute(key);
};

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

      config.assign(this._options.attributes);

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
    key: '_bindEvents',


    /**
     * Bind global events
     * @private
     */
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

      Array.from(context.querySelectorAll('[' + attr('data-view') + ']')).filter(function (element) {
        return !_this2._viewsMap.has(element);
      }).forEach(function (element) {
        return _this2._viewsMap.set(element, _this2._buildView(element, _this2._model));
      });

      context.querySelectorAll('[href][' + attr('data-view-link') + ']').forEach(function (link) {
        return link.addEventListener('click', _this2._onLinkClick);
      });

      context.querySelectorAll('[' + attr('data-activate-view') + ']').forEach(function (link) {
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
      var name = element.getAttribute(attr('data-view'));
      var persist = element.hasAttribute(attr('data-persist-view'));
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
        return 'Not able to determine where [' + attr('data-view') + '=\'' + name + '\'] should be inserted.';
      };

      Array.from(doc.querySelectorAll('[' + attr('data-view') + ']')).map(function (viewElement) {
        return viewElement.getAttribute(attr('data-view'));
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
    value: function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e) {
        var url, viewLink, hints, model;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                e.preventDefault();

                url = this._options.sanitizeUrl(e.currentTarget.href);
                viewLink = e.currentTarget.getAttribute(attr('data-view-link'));
                hints = viewLink ? viewLink.split(',') : this._options.defaultHints;
                model = new Model({ url: url, hints: hints }, this._options.fetch);

                if (!this._isCurrentUrl(model.url)) {
                  _context.next = 7;
                  break;
                }

                return _context.abrupt('return');

              case 7:
                _context.next = 9;
                return this._updatePage(model);

              case 9:
                this._addHistoryEntry(model);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _onLinkClick(_x2) {
        return _ref.apply(this, arguments);
      }

      return _onLinkClick;
    }()

    /**
     * Handles a click on an element with a [data-activate-view="viewname"] attribute.
     * Navigates to the current url of the given View. This is particularly useful when you want to close an overlay or lightbox.
     * This function calls the _updatePage function and adds a history entry.
     * @param {Event} e - Click event
     * @private
     */

  }, {
    key: '_onActivateViewClick',
    value: function () {
      var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(e) {
        var name, model;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                e.preventDefault();

                name = e.currentTarget.getAttribute(attr('data-activate-view'));
                model = this._getViewByName(name).model;

                if (!this._isCurrentUrl(model.url)) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return');

              case 5:
                _context2.next = 7;
                return this._updatePage(model);

              case 7:
                this._addHistoryEntry(model);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _onActivateViewClick(_x3) {
        return _ref2.apply(this, arguments);
      }

      return _onActivateViewClick;
    }()

    /**
     * Retreive a Model from a View
     * @param {string} name - The name of a View
     * @returns {Model} - The model currently active for the given View
     * @private
     */

  }, {
    key: '_getViewByName',
    value: function _getViewByName(name) {
      var element = document.querySelector('[' + attr('data-view') + '="' + name + '"]');
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
    value: function () {
      var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(model) {
        var doc;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._model = model;
                _context3.prev = 1;

                this.views.forEach(function (view) {
                  return view.model = model;
                });
                _context3.next = 5;
                return model.doc;

              case 5:
                doc = _context3.sent;

                this._throwOnUnknownViews(doc);
                document.title = doc.title;
                _context3.next = 14;
                break;

              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3['catch'](1);

                console.error(_context3.t0);
                window.location.href = model.url;

              case 14:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 10]]);
      }));

      function _updatePage(_x4) {
        return _ref3.apply(this, arguments);
      }

      return _updatePage;
    }()

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

      dispatchEvent(window, 'statechange', {
        detail: state
      });
    }
  }, {
    key: 'views',


    /**
     * Return all the views contained in the current document
     * @returns {View[]} - An array of View instances
     */
    get: function get$$1() {
      var _this4 = this;

      return Array.from(document.querySelectorAll('[' + attr('data-view') + ']')).map(function (element) {
        return _this4._viewsMap.get(element);
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

var index = new Controller();

exports.View = View;
exports.Model = Model;
exports.Transition = Transition;
exports.Config = config;
exports['default'] = index;

Object.defineProperty(exports, '__esModule', { value: true });

})));
