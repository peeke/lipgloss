(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var ViewOrder =
  /*#__PURE__*/
  function () {
    function ViewOrder() {
      _classCallCheck(this, ViewOrder);

      this._order = [];
    }

    _createClass(ViewOrder, [{
      key: "push",
      value: function push(view) {
        this._order = [view].concat(_toConsumableArray(this._order.filter(function (v) {
          return view.name !== v.name;
        })));
      }
    }, {
      key: "delete",
      value: function _delete(view) {
        this._order = this._order.filter(function (v) {
          return view.name !== v.name;
        });
      }
    }, {
      key: "has",
      value: function has(view) {
        return this._order.includes(view);
      }
    }, {
      key: "order",
      get: function get() {
        return this._order;
      }
    }]);

    return ViewOrder;
  }();

  var ViewOrder$1 = new ViewOrder();

  var attributes = {
    view: 'data-view',
    slot: 'data-view-slot',
    viewLink: 'data-view-link',
    viewActive: 'data-view-active',
    viewsLoading: 'data-views-loading',
    viewsActive: 'data-views-active',
    deactivateView: 'data-deactivate-view',
    transition: 'data-transition'
  };

  var listen = function listen(elements, event, fn) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    Array.from(elements).forEach(function (element) {
      return element.addEventListener(event, fn, options);
    });
  };

  var dispatch = function dispatch(element, event) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    element.dispatchEvent(new CustomEvent(event, {
      detail: data,
      bubbles: true,
      cancelable: true
    }));
  };

  var reflow = function reflow(element) {
    return element.offsetHeight;
  };

  var attributeList = {
    list: function list(element, attribute) {
      var string = element.getAttribute(attribute) || '';
      return new Set(string.split(' ').filter(Boolean));
    },
    add: function add(element, attribute, value) {
      attributeList.toggle(element, attribute, value, true);
    },
    remove: function remove(element, attribute, value) {
      attributeList.toggle(element, attribute, value, false);
    },
    has: function has(element, attribute, value) {
      return attributeList.list(element, attribute).has(value);
    },
    toggle: function toggle(element, attribute, value, force) {
      var list = attributeList.list(element, attribute);
      if (typeof force === 'undefined') force = !list.has(value);
      var action = force ? 'add' : 'delete';
      list[action](value);
      element.setAttribute(attribute, Array.from(list).join(' '));
    }
  };

  function _async(f) {
    return function () {
      for (var args = [], i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      try {
        return Promise.resolve(f.apply(this, args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }

  function _await(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }
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

  var Transition =
  /*#__PURE__*/
  function () {
    /**
     * @param {Element} view - The view element
     */
    function Transition(view, milestones) {
      _classCallCheck(this, Transition);

      this._view = view;
      this._milestones = milestones;
    }

    _createClass(Transition, [{
      key: "beforeExit",
      value: function () {
        return _await();
      }
      /**
       * @description Exit transition for the given view.
       * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
       */

    }, {
      key: "exit",
      value: _async(function () {
        var _this = this;

        _this._view.removeAttribute(attributes.transition);

        reflow(_this._view);

        _this._view.setAttribute(attributes.transition, 'out');
      })
    }, {
      key: "beforeEnter",
      value: function () {
        return _await();
      }
      /**
       * @description Enter transition for the given view.
       * @param {String} newNode - The new views node
       * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
       */

    }, {
      key: "enter",
      value: _async(function (newNode, newDoc) {
        var _this2 = this;

        _this2.updateHtml(newNode);

        _this2._view.removeAttribute(attributes.transition);

        reflow(_this2._view);

        _this2._view.setAttribute(attributes.transition, 'in');
      })
      /**
       * Updates the view element with new HTML and dispatches the 'viewhtmldidupdate' lifecycle event
       * @param {String} newNode - The new views node
       */

    }, {
      key: "updateHtml",
      value: function updateHtml(newNode) {
        dispatch(this._view, 'viewhtmlwillupdate');
        this._view.innerHTML = newNode.innerHTML;
        dispatch(this._view, 'viewhtmldidupdate');
      }
      /**
       * Cleans up after transitions have completed
       */

    }, {
      key: "done",
      value: function done() {
        this._view.removeAttribute(attributes.transition);

        reflow(this._view);
      }
    }, {
      key: "view",
      get: function get() {
        return this._view;
      }
    }]);

    return Transition;
  }();

  function _async$1(f) {
    return function () {
      for (var args = [], i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      try {
        return Promise.resolve(f.apply(this, args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }

  function _await$1(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }
  var modelId = 0;
  var modelCache = {};

  var newId = function newId() {
    return [Date.now(), modelId++].join('-');
  };
  /**
   * @class Model
   * @classdesc The Model contains all the data needed by a View to update.
   */


  var Model =
  /*#__PURE__*/
  function () {
    /**
     * Initialize a new Model
     * @param {object} options - The configuration for the Model
     * @param {string} options.url - The url to request
     * @param {object} fetchOptions = The options used to fetch the url
     */
    function Model(options) {
      var fetchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Model);

      this._request = new Request(options.url, fetchOptions);
      this._doc = null;
      this._id = typeof options.id === 'number' ? options.id : newId();
      modelCache[this._id] = this;
      this._response = fetch(this._request).then(function (response) {
        return response.ok ? response : Promise.reject();
      }).then(function (response) {
        // { redirect: 'error' } fallback for IE and some older browsers
        if (fetchOptions.redirect !== 'error') return response;
        if (options.url !== response.url) return Promise.reject();
        return response;
      });
    }

    _createClass(Model, [{
      key: "includesView",

      /**
       * A check to see if name was included in the document
       * @param {string} name - A name of a view
       * @returns {boolean}
       */
      value: _async$1(function (name) {
        var _this = this;

        return _await$1(_this.doc, function (doc) {
          return Boolean(doc.querySelector("[".concat(attributes.view, "=\"").concat(name, "\"]")));
        });
      })
    }, {
      key: "equals",
      value: function equals(model) {
        if (!model) return false;
        return this.id === model.id;
      }
    }, {
      key: "id",
      get: function get() {
        return this._id;
      }
      /**
       * @description The url used to fetch the new document
       * @returns {string}
       */

    }, {
      key: "url",
      get: function get() {
        return this._request.url;
      }
      /**
       * @description Gets the loaded document (lazily)
       * @returns {Promise.<Element>} - A promise containing the new document
       */

    }, {
      key: "doc",
      get: function get() {
        if (!this._doc) {
          this._doc = this._response.then(function (response) {
            return response.text();
          }).then(function (html) {
            return new DOMParser().parseFromString(html, 'text/html');
          });
        }

        return this._doc;
      }
    }], [{
      key: "getById",
      value: function getById(id) {
        return modelCache[id];
      }
    }]);

    return Model;
  }();

  function _invoke(body, then) {
    var result = body();

    if (result && result.then) {
      return result.then(then);
    }

    return then(result);
  }

  function _awaitIgnored(value, direct) {
    if (!direct) {
      return value && value.then ? value.then(_empty) : Promise.resolve();
    }
  }

  function _empty() {}

  function _async$2(f) {
    return function () {
      for (var args = [], i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      try {
        return Promise.resolve(f.apply(this, args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }

  function _await$2(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  var errorViewNotFound = function errorViewNotFound(name) {
    return new Error("View '".concat(name, "' activated, but not found in the loaded document"));
  };
  /**
   * @class View
   * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
   */


  var View =
  /*#__PURE__*/
  function () {
    /**
     * @param {Element} element - The element associated with the view
     * @param {Object} options - Options for the view
     * @param {string|null} options.name = null - The name of the view. You should set this
     * @param {Transition} options.transition = Transition - The transition to use for this view
     * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
     * @param {Model|null} options.model = null - The initial model of the view. You should set this.
     */
    function View(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, View);

      this._element = element;
      this._options = Object.assign(View.options, options);
      this.active = this.visible = !!this._element.innerHTML.trim();
      this._model = this._options.model;
      this._selector = "[".concat(attributes.view, "=\"").concat(this._options.name, "\"]");
      this._transition = new this._options.transition(this._element);

      if (this.active) {
        ViewOrder$1.push(this);
      }

      if (!(this._transition instanceof Transition)) {
        throw new Error('Provided transition is not an instance of Transition');
      }
    }
    /**
     * Default options
     * @type {object}
     */


    _createClass(View, [{
      key: "setModel",

      /**
       * Set the model associated with this view
       * Has three flows:
       *   1. The same Model is already set, do nothing
       *   2. The view is included in the Model, activate
       *   3. The view is not included in the Model, deactivate
       * @param {Model} model
       */
      value: _async$2(function (model) {
        var _this = this;

        if (model && model.equals(_this._model)) {
          return;
        }

        return _await$2(model.includesView(_this._options.name), function (includedInModel) {
          if (!includedInModel) return;
          dispatch(_this._element, 'viewwillupdate');
          return _await$2(model.doc, function (doc) {
            var node = doc.querySelector(_this._selector);
            var active = node && Boolean(node.innerHTML.trim());
            return _await$2(active ? _this._activate(model) : _this._deactivate(), function (_this$_activate) {

              _this._transition.done();

              dispatch(_this._element, 'viewdidupdate');
            });
          });
        });
      })
      /**
       * Activate a new Model for this View. The selector will query the retreived document for a node to use.
       * @param {Model} model - The model to update the view with
       * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
       * @private
       */

    }, {
      key: "_activate",
      value: _async$2(function (model) {
        var _this2 = this;

        _this2._model = model;
        _this2.loading = true;
        model.doc.then(function () {
          return _this2.loading = false;
        });
        return _invoke(function () {
          if (_this2.active) {
            return _await$2(_this2._transition.beforeExit(), function () {
              return _awaitIgnored(_this2._exit(model.doc));
            });
          }
        }, function () {
          return _await$2(model.doc, function (doc) {
            var node = doc.querySelector(_this2._selector);
            if (!node) throw errorViewNotFound(_this2.name);
            var active = Boolean(node.innerHTML.trim());

            if (!active) {
              _this2.active = false;
              _this2.visible = false;
              return;
            }

            if (!ViewOrder$1.has(_this2)) {
              ViewOrder$1.push(_this2);
            }

            return _await$2(_this2._transition.beforeEnter(node, doc), function () {
              _this2.visible = true;
              _this2.active = true;
              return _awaitIgnored(_this2._enter(node, doc));
            });
          });
        });
      })
      /**
       * Deactivate the Model for this View.
       * @private
       */

    }, {
      key: "_deactivate",
      value: _async$2(function () {
        var _this3 = this;

        if (!_this3.active) return;
        ViewOrder$1.delete(_this3);
        return _await$2(_this3._transition.beforeExit(), function () {
          _this3.active = false;
          return _await$2(_this3._exit(), function () {
            _this3.visible = false;
            _this3._model = null;
          });
        });
      })
    }, {
      key: "_enter",
      value: _async$2(function (node, doc) {
        var _this4 = this;

        dispatch(_this4._element, 'viewwillenter');
        return _await$2(_this4._transition.enter(node, doc), function () {
          dispatch(_this4._element, 'viewdidenter');
        });
      })
    }, {
      key: "_exit",
      value: _async$2(function (doc) {
        var _this5 = this;

        dispatch(_this5._element, 'viewwillexit');
        return _await$2(_this5._transition.exit(doc), function () {
          dispatch(_this5._element, 'viewdidexit');
        });
      })
    }, {
      key: "active",

      /**
       * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
       * @returns {boolean} - Active
       */
      get: function get() {
        return this._active;
      }
      /**
       * Set the active state of this View.
       * @param {boolean} bool - Active
       */
      ,
      set: function set(bool) {
        if (this._active === bool) return;
        this._active = bool;

        this._element.setAttribute(attributes.viewActive, bool);

        attributeList.toggle(document.body, 'data-views-active', this.name, bool);
      }
    }, {
      key: "visible",
      set: function set(bool) {
        if (this._visible === bool) return;
        this._visible = bool;

        this._element.setAttribute(attributes.viewActive, bool);

        attributeList.toggle(document.body, 'data-views-visible', this.name, bool);
      }
      /**
       * @returns {boolean} - Whether this View is loading
       */

    }, {
      key: "loading",
      get: function get() {
        return this._isLoading;
      }
      /**
       * Set's the loading state for this View
       * @param {boolean} bool
       */
      ,
      set: function set(bool) {
        if (this._isLoading === bool) return;
        this._isLoading = bool;
        attributeList.toggle(document.body, attributes.viewsLoading, this.name, bool);
      }
      /**
       * @returns {string} - The name of this view
       */

    }, {
      key: "name",
      get: function get() {
        return this._options.name;
      }
    }, {
      key: "transition",
      get: function get() {
        return this._transition;
      }
      /**
       * @returns {Model} - The Model currently associated with this view
       */

    }, {
      key: "model",
      get: function get() {
        return this._model;
      }
    }], [{
      key: "options",
      get: function get() {
        return {
          name: null,
          transition: Transition,
          model: null
        };
      }
    }]);

    return View;
  }();

  function _awaitIgnored$1(value, direct) {
    if (!direct) {
      return value && value.then ? value.then(_empty$1) : Promise.resolve();
    }
  }

  function _empty$1() {}

  function _continue(value, then) {
    return value && value.then ? value.then(then) : then(value);
  }

  function _catch(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  function _await$3(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  function _async$3(f) {
    return function () {
      for (var args = [], i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      try {
        return Promise.resolve(f.apply(this, args));
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
  var SUPPORTED = 'pushState' in history;

  var viewSelector = function viewSelector(name) {
    return "\n  [".concat(attributes.view, "=").concat(name, "],\n  [").concat(attributes.slot, "=").concat(name, "]\n");
  };
  /**
   * @class Controller
   * @classdesc Handles updating the views on the page with new models
   */


  var Controller =
  /*#__PURE__*/
  function () {
    function Controller() {
      _classCallCheck(this, Controller);
    }

    _createClass(Controller, [{
      key: "init",

      /**
       * Controller is a singleton which should be initialized once trough the init() method to set the options
       * @param {object} options - Options
       * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
       * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
       * @param {object} options.fetch - The options to pass into a fetch request
       */
      value: function init() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        if (!SUPPORTED) return;
        this._options = Object.assign({}, Controller.options, options);
        this._viewsMap = new WeakMap();
        this._views = [];
        Object.assign(attributes, this._options.attributes);

        var url = this._options.sanitizeUrl(window.location.href);

        this._model = new Model({
          url: url
        }, this._options.fetch);
        this._queuedModel = this._model;
        this._updatingPage = false;
        this._onLinkClick = this._onLinkClick.bind(this);
        this._onDeactivateViewClick = this._onDeactivateViewClick.bind(this);

        this._addHistoryEntry(this._model, true);

        this._bindEvents();

        this.initializeContext(document);
        dispatch(window, 'lipglossready');
      }
      /**
       * Default init options
       * @type {object}
       */

    }, {
      key: "isActive",
      value: function isActive(name) {
        var view = this._getViewByName(name);

        return view && view.active;
      }
      /**
       * Bind global events
       * @private
       */

    }, {
      key: "_bindEvents",
      value: function _bindEvents() {
        var _this = this;

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
      key: "initializeContext",
      value: function initializeContext(context) {
        var _this2 = this;

        var selector = "[".concat(attributes.view, "], [").concat(attributes.slot, "]");
        Array.from(context.querySelectorAll(selector)).filter(function (element) {
          return !_this2._viewsMap.has(element);
        }).forEach(function (element) {
          var view = _this2._createView(element, _this2._model);

          _this2._viewsMap.set(element, view);

          _this2._views.push(view);
        });
        listen(context.querySelectorAll("[href][".concat(attributes.viewLink, "]")), 'click', this._onLinkClick);
        listen(context.querySelectorAll("[".concat(attributes.deactivateView, "]")), 'click', this._onDeactivateViewClick);
      }
      /**
       * Creates a View component based on a given element and an initial model
       * @param {Element} element - The element to create a view for
       * @param {Model} model - The initial model for the view
       * @returns {View} - The created view
       * @private
       */

    }, {
      key: "_createView",
      value: function _createView(element, model) {
        var name = element.getAttribute(attributes.view) || element.getAttribute(attributes.slot);
        var transition = this._options.transitions[name] || Transition;
        return new View(element, {
          name: name,
          transition: transition,
          model: model
        });
      }
      /**
       * Handles a click on an element with a [data-view-link] attribute. Loads the document found at [href].
       * This function calls the _setModel function and adds a history entry.
       * @param {Event} e - Click event
       * @private
       */

    }, {
      key: "_onLinkClick",
      value: _async$3(function (e) {
        var _this3 = this;

        e.preventDefault();

        var url = _this3._options.sanitizeUrl(e.currentTarget.href);

        _this3.openUrl(url);
      })
      /**
       *
       * @param {String} url - The url to open.
       * @param {Object} fetchOptions - The options to pass to fetch().
       */

    }, {
      key: "openUrl",
      value: function openUrl(url) {
        var fetchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._options.fetch;
        var model = new Model({
          url: url
        }, fetchOptions);

        var samePage = this._model && this._model.equals(model);

        this._queueModel(model);

        this._addHistoryEntry(model, samePage);
      }
      /**
       * Handles a click on an element with a [data-deactivate-view="viewname"] attribute.
       * Navigates to the current url of View next up in the ViewOrder. This is particularly useful when you want to close an overlay or lightbox.
       * This function calls the _setModel function and adds a history entry.
       * @param {Event} e - Click event
       * @private
       */

    }, {
      key: "_onDeactivateViewClick",
      value: function _onDeactivateViewClick(e) {
        e.preventDefault();
        var name = e.currentTarget.getAttribute(attributes.deactivateView);
        this.deactivateView(name);
      }
      /**
       * Deactivate a view by name
       * @param {string} name - Name of the view to activate
       */

    }, {
      key: "deactivateView",
      value: function deactivateView(name) {
        var view = this._getViewByName(name);

        var newView = ViewOrder$1.order.find(function (v) {
          return !v.model.equals(view.model);
        });

        if (!newView) {
          throw new Error("Unable to deactivate view ".concat(name, ", because there's no view to fall back to."));
        }

        this._queueModel(newView.model);

        this._addHistoryEntry(newView.model);
      }
      /**
       * Retreive a Model from a View
       * @param {string} name - The name of a View
       * @returns {Model} - The model currently active for the given View
       * @private
       */

    }, {
      key: "_getViewByName",
      value: function _getViewByName(name) {
        return this._views.find(function (view) {
          return view.name === name;
        });
      }
      /**
       * Recreate a model for a given popstate and update the page
       * @param {Event} e - Event
       * @private
       */

    }, {
      key: "_onPopState",
      value: function _onPopState(e) {
        if (!e.state) return; // popstate fires on page load as well

        try {
          // We use an existing model (if it exists) so we don't have to refetch the associated request
          var _model = Model.getById(e.state.modelId); // Recreate the model if it's not in the cache


          if (!_model) {
            var options = {
              url: e.state.url,
              id: e.state.modelId
            };
            _model = new Model(options, this._options.fetch);
          }

          this._queueModel(_model);
        } catch (err) {
          console.error(err);
          window.location.href = model.url;
        }
      }
      /**
       * Page updates are always queued, because we want to finish the current transition before starting the next
       * @param {Model} model - The model to update the page with
       * @private
       */

    }, {
      key: "_queueModel",
      value: function _queueModel(model) {
        this._queuedModel = model;
        if (this._updatingPage) return;

        this._setModel(model);
      }
      /**
       * Updates given views in a page with a new model
       * @param {Model} model - The model to update the page with
       * @returns {Promise.<void>} - Resolves when updating the page is done
       * @private
       */

    }, {
      key: "_setModel",
      value: _async$3(function (model) {
        var _this4 = this;

        _this4._model = model;
        _this4._updatingPage = true;
        return _continue(_catch(function () {
          dispatch(window, 'pagewillupdate');

          _this4._views.forEach(_async$3(function (view) {
            return _awaitIgnored$1(view.setModel(model));
          }));

          return _await$3(model.doc, function (doc) {
            _this4._options.updateDocument(doc);

            _this4._views = _this4._views.filter(function (view) {
              return Boolean(document.querySelector(viewSelector(view.name)));
            });
            dispatch(window, 'pagedidupdate');
          });
        }, function (err) {
          console.error(err);
          window.location.href = model.url;
        }), function () {
          _this4._updatingPage = false;

          if (_this4._queuedModel !== model) {
            _this4._setModel(_this4._queuedModel);
          }
        });
      })
      /**
       * Add an history entry
       * @param {Model} model - The model to add an history entry for
       * @param {boolean} [replaceEntry=false] - Whether to replace the history entry, instead of pushing it.
       * @private
       */

    }, {
      key: "_addHistoryEntry",
      value: function _addHistoryEntry(model) {
        var replaceEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var state = {
          title: document.title,
          url: model.url,
          modelId: model.id
        };
        var method = replaceEntry ? 'replaceState' : 'pushState';
        history[method](state, document.title, model.url);
        dispatch(window, 'statechange', state);
      }
    }], [{
      key: "options",
      get: function get() {
        return {
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

  lipgloss.init();

}());
