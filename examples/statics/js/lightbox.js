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

var ViewOrder = function () {
  function ViewOrder() {
    classCallCheck(this, ViewOrder);

    this._order = [];
  }

  createClass(ViewOrder, [{
    key: "push",
    value: function push(view) {
      this._order = [view].concat(toConsumableArray(this._order.filter(function (v) {
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
    get: function get$$1() {
      return this._order;
    }
  }]);
  return ViewOrder;
}();

var ViewOrder$1 = new ViewOrder();

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
      slot: 'data-view-slot',
      viewLink: 'data-view-link',
      viewActive: 'data-view-active',
      viewsLoading: 'data-views-loading',
      viewsActive: 'data-views-active',
      deactivateView: 'data-deactivate-view',
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
}();
function _await$2(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }value = Promise.resolve(value);return then ? value.then(then) : value;
}var Transition = function () {
  /**
   * @param {Element} view - The view element
   */
  function Transition(view) {
    classCallCheck(this, Transition);

    this._view = view;
    this.willExit = this.willEnter = this.didExit = this.didEnter = this.didComplete = Promise.resolve();
    this.exitStart = this.enterStart = this.exitDone = this.enterDone = function () {};
  }

  createClass(Transition, [{
    key: "reset",
    value: function reset() {
      var _this = this;

      this.willExit = new Promise(function (resolve) {
        return _this.exitStart = resolve;
      });
      this.willEnter = new Promise(function (resolve) {
        return _this.enterStart = resolve;
      });
      this.didExit = new Promise(function (resolve) {
        return _this.exitDone = resolve;
      });
      this.didEnter = new Promise(function (resolve) {
        return _this.enterDone = resolve;
      });
      this.didComplete = Promise.all([this.didExit, this.didEnter]);
    }
  }, {
    key: "beforeExit",
    value: function () {
      return _await$2();
    }

    /**
     * @description Exit transition for the given view.
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
     */

  }, {
    key: "exit",
    value: _async$2(function () {
      var _this2 = this;

      _this2._view.removeAttribute(attributes.dict.transition);
      reflow(_this2._view);
      _this2._view.setAttribute(attributes.dict.transition, "out");
    })

    /**
     * @description Loading transition for the given view. This transition state will only occur
     * if the requested document is still loading when exit() completes.
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
     */

  }, {
    key: "loading",
    value: _async$2(function () {
      var _this3 = this;

      _this3._view.removeAttribute(attributes.dict.transition);
      reflow(_this3._view);
      _this3._view.setAttribute(attributes.dict.transition, "loading");
    })
  }, {
    key: "beforeEnter",
    value: function () {
      return _await$2();
    }

    /**
     * @description Enter transition for the given view.
     * @param {String} newNode - The new views node
     * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
     */

  }, {
    key: "enter",
    value: _async$2(function (newNode, newDoc) {
      var _this4 = this;

      _this4.updateHtml(newNode);
      _this4._view.removeAttribute(attributes.dict.transition);
      reflow(_this4._view);
      _this4._view.setAttribute(attributes.dict.transition, "in");
    })

    /**
     * Updates the view element with new HTML and dispatches the 'viewhtmldidupdate' lifecycle event
     * @param {String} newNode - The new views node
     */

  }, {
    key: "updateHtml",
    value: function updateHtml(newNode) {
      dispatch(this._view, "viewhtmlwillupdate");
      this._view.innerHTML = newNode.innerHTML;
      dispatch(this._view, "viewhtmldidupdate");
    }

    /**
     * Cleans up after transitions have completed
     */

  }, {
    key: "done",
    value: function done() {
      this.exitStart();
      this.exitDone();
      this.enterStart();
      this.enterDone();
      this._view.removeAttribute(attributes.dict.transition);
      reflow(this._view);
    }
  }, {
    key: "view",
    get: function get$$1() {
      return this._view;
    }
  }]);
  return Transition;
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
}();function _await$3(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }value = Promise.resolve(value);return then ? value.then(then) : value;
}var modelId = 0;
var modelCache = {};
var newId = function newId() {
  return [Date.now(), modelId++].join("-");
};
var isNumber = function isNumber(n) {
  return Number(n) === n;
};

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
  function Model(options) {
    var _this = this;

    var fetchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, Model);

    this._request = new Request(options.url, fetchOptions);
    this._hints = options.hints || [];
    this._doc = null;
    this._id = isNumber(options.id) ? options.id : newId();

    modelCache[this._id] = this;

    dispatch(window, "modelload");

    this._response = fetch(this._request).then(function (response) {
      return response.ok ? response : Promise.reject();
    }).then(function (response) {
      // { redirect: 'error' } fallback for IE and some older browsers
      if (fetchOptions.redirect !== "error") return response;
      if (options.url !== response.url) return Promise.reject();
      return response;
    });

    this._response.then(function () {
      return dispatch(window, "modelloaded", _this.getBlueprint());
    });
  }

  createClass(Model, [{
    key: "hasHint",
    value: function hasHint(name) {
      return this._hints.includes(name);
    }

    /**
     * A check to see if name was included the given hints
     * @param {string} name - A name of a view
     * @returns {boolean}
     */

  }, {
    key: "includesView",
    value: _async$3(function (name) {
      var _this2 = this;

      return _await$3(_this2.doc, function (doc) {
        return Boolean(doc.querySelector("[" + attributes.dict.view + "=\"" + name + "\"]"));
      });
    })
  }, {
    key: "equals",
    value: function equals(model) {
      if (!model) return false;
      return this === model || this.id === model.id;
    }

    /**
     * Get an object blueprint of the Model, which can be added to the history state. You can pass it to the
     * options parameter in the constructor to recreate the model:
     * @example <caption>Using the model blueprint</caption>
     * const blueprint = model.getBlueprint()
     * const twin = new Model(blueprint, fetchOptions)
     * @returns {{url: string, hints: string[]}}
     */

  }, {
    key: "getBlueprint",
    value: function getBlueprint() {
      return { id: this._id, url: this._request.url, hints: this._hints };
    }
  }, {
    key: "id",
    get: function get$$1() {
      return this._id;
    }

    /**
     * @description The url used to fetch the new document
     * @returns {string}
     */

  }, {
    key: "url",
    get: function get$$1() {
      return this._request.url;
    }

    /**
     * @description Gets the loaded document (lazily)
     * @returns {Promise.<Element>} - A promise containing the new document
     */

  }, {
    key: "doc",
    get: function get$$1() {
      if (!this._doc) {
        this._doc = this._response.then(function (response) {
          return response.text();
        }).then(function (html) {
          return new DOMParser().parseFromString(html, "text/html");
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

var AttributeList = function () {
  function AttributeList(element, attribute) {
    classCallCheck(this, AttributeList);

    this._element = element;
    this._attribute = attribute;
  }

  createClass(AttributeList, [{
    key: '_getList',
    value: function _getList() {
      var string = this._element.getAttribute(this._attribute) || '';
      return new Set(string.split(' ').filter(Boolean));
    }
  }, {
    key: 'add',
    value: function add(value) {
      this.toggle(value, true);
    }
  }, {
    key: 'remove',
    value: function remove(value) {
      this.toggle(value, false);
    }
  }, {
    key: 'has',
    value: function has(value) {
      return this._getList().has(value);
    }
  }, {
    key: 'toggle',
    value: function toggle(value, force) {
      var list = this._getList();
      if (typeof force === 'undefined') force = !list.has(value);
      var action = force ? 'add' : 'delete';

      list[action](value);

      this._element.setAttribute(this._attribute, Array.from(list).join(' '));
    }
  }]);
  return AttributeList;
}();

function _awaitIgnored(value, direct) {
  if (!direct) {
    return Promise.resolve(value).then(_empty);
  }
}function _empty() {}var _async$1 = function () {
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
}var errorViewNotFound = function errorViewNotFound(name) {
  return new Error('View \'' + name + '\' activated, but not found in the loaded document (maybe you\'ve provided it as a hint?).');
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
   * @param {Transition} options.transition = Transition - The transition to use for this view
   * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
   * @param {Model|null} options.model = null - The initial model of the view. You should set this.
   */
  function View(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, View);

    this._element = element;
    this._options = Object.assign(View.options, options);

    this._loadingList = new AttributeList(document.body, attributes.dict.viewsLoading);
    this._activeList = new AttributeList(document.body, attributes.dict.viewsActive);
    this._visibleList = new AttributeList(document.body, 'data-views-visible');

    this.active = this.visible = !!this._element.innerHTML.trim();

    this._model = this._options.model;
    this._selector = '[' + attributes.dict.view + '="' + this._options.name + '"]';
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


  createClass(View, [{
    key: '_setModel',


    /**
     * Set the model associated with this view
     * Has three flows:
     *   1. The same Model is already set, do nothing
     *   2. The view is included in the Model, activate
     *   3. The view is not included in the Model, deactivate
     * @param {Model} model
     */
    value: _async$1(function (model) {
      var _this = this;

      if (model && model.equals(_this._model)) {
        _this._transition.done();
        return;
      }

      var isHintedAt = model.hasHint(_this._options.name);
      return _await$1(isHintedAt || model.includesView(_this._options.name), function (_model$includesView) {
        var _exit2;

        var includedInModel = _model$includesView;

        if (!includedInModel) {
          _this._transition.done();
          return;
        }

        // Take a leap of faith and activate the view based on a hint from the user
        return _invoke(function () {
          if (isHintedAt) {
            return _await$1(_this._activate(model), function () {
              _this._transition.done();
              _exit2 = 1;
            });
          }
        }, function (_result) {
          if (_exit2) return _result;
          return _await$1(model.doc, function (doc) {
            var node = doc.querySelector(_this._selector);
            var active = node && Boolean(node.innerHTML.trim());
            return _await$1(active ? _this._activate(model) : _this._deactivate(), function () {
              _this._transition.done();
            });
          });
        });
      }, isHintedAt);
    })

    /**
     * @returns {string} - The name of this view
     */

  }, {
    key: '_activate',


    /**
     * Activate a new Model for this View. The selector will query the retreived document for a node to use.
     * @param {Model} model - The model to update the view with
     * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
     * @private
     */
    value: _async$1(function (model) {
      var _this2 = this;

      _this2.loading = true;
      model.doc.then(function () {
        return _this2.loading = false;
      });

      return _invoke(function () {
        if (_this2.active) {
          return _await$1(_this2._transition.beforeExit(), function () {
            return _awaitIgnored(_this2._exit());
          });
        } else {
          _this2._transition.exitStart();
          _this2._transition.exitDone();
        }
      }, function () {
        return _invoke(function () {
          if (_this2.loading) {
            return _awaitIgnored(_this2._transition.loading());
          }
        }, function () {
          return _await$1(model.doc, function (doc) {
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

            return _await$1(_this2._transition.beforeEnter(node, doc), function () {
              _this2.visible = true;
              _this2.active = true;
              return _await$1(_this2._enter(node, doc), function () {

                _this2._model = model;
              });
            });
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
      var _this3 = this;

      if (!_this3.active) return;

      ViewOrder$1.delete(_this3);

      return _await$1(_this3._transition.beforeExit(), function () {
        _this3.active = false;
        return _await$1(_this3._exit(), function () {
          _this3.visible = false;

          _this3._model = null;
        });
      });
    })
  }, {
    key: '_enter',
    value: _async$1(function (node, doc) {
      var _this4 = this;

      _this4._transition.enterStart();
      dispatch(_this4._element, 'viewwillenter');
      return _await$1(_this4._transition.enter(node, doc), function () {
        dispatch(_this4._element, 'viewdidenter');
        _this4._transition.enterDone();
      });
    })
  }, {
    key: '_exit',
    value: _async$1(function () {
      var _this5 = this;

      _this5._transition.exitStart();
      dispatch(_this5._element, 'viewwillexit');
      return _await$1(_this5._transition.exit(), function () {
        dispatch(_this5._element, 'viewdidexit');
        _this5._transition.exitDone();
      });
    })
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
      if (this._active === bool) return;
      this._active = bool;
      this._element.setAttribute(attributes.dict.viewActive, bool);
      this._activeList.toggle(this._options.name, bool);
    }
  }, {
    key: 'visible',
    set: function set$$1(bool) {
      if (this._visible === bool) return;
      this._visible = bool;
      this._element.setAttribute(attributes.dict.viewActive, bool);
      this._visibleList.toggle(this._options.name, bool);
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
      if (this._isLoading === bool) return;
      this._isLoading = bool;
      this._loadingList.toggle(this._options.name, bool);
    }

    /**
     * @returns {Model} - The Model currently associated with this view
     */

  }, {
    key: 'model',
    get: function get$$1() {
      return this._model;
    },
    set: function set$$1(model) {
      this._setModel(model);
    }
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
        transition: Transition,
        model: null
      };
    }
  }]);
  return View;
}();

function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}function _catch(body, recover) {
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
}();var SUPPORTED = "pushState" in history;

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */

var Controller = function () {
  function Controller() {
    classCallCheck(this, Controller);
  }

  createClass(Controller, [{
    key: "init",

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

      this._options = Object.assign({}, Controller.options, options);
      this._viewsMap = new WeakMap();

      attributes.assign(this._options.attributes);

      var url = this._options.sanitizeUrl(window.location.href);
      this._model = new Model({ url: url, hints: this._options.defaultHints }, this._options.fetch);
      this._queuedModel = this._model;
      this._updatingPage = false;

      this._onLinkClick = this._onLinkClick.bind(this);
      this._onDeactivateViewClick = this._onDeactivateViewClick.bind(this);

      this._addHistoryEntry(this._model, true);
      this._bindEvents();
      this.initializeContext(document);

      dispatch(window, "lipglossready");
    }

    /**
     * Default init options
     * @type {object}
     */

  }, {
    key: "_gatherViews",


    /**
     * Return all the views contained in the current document
     * @returns {View[]} - An array of View instances
     */
    value: function _gatherViews() {
      var _this = this;

      var selector = "[" + attributes.dict.view + "], [" + attributes.dict.slot + "]";
      return Array.from(document.querySelectorAll(selector)).map(function (element) {
        return _this._viewsMap.get(element);
      });
    }

    // _transitionAction(viewName, action) {
    //   const view = this._getViewByName(viewName);
    //   if (!view) return Promise.resolve();
    //   return view.transition[action];
    // }

    // didExit(name) {
    //   return this._transitionAction(name, "didExit");
    // }

    // didEnter(name) {
    //   return this._transitionAction(name, "didEnter");
    // }

    // didComplete(name) {
    //   return this._transitionAction(name, "didComplete");
    // }

    // willEnter(name) {
    //   return this._transitionAction(name, "willEnter");
    // }

    // willExit(name) {
    //   return this._transitionAction(name, "willExit");
    // }

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
      var _this2 = this;

      document.addEventListener("viewdidenter", function (e) {
        return _this2.initializeContext(e.target);
      });
      window.addEventListener("popstate", function (e) {
        return _this2._onPopState(e);
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
      var _this3 = this;

      var selector = "[" + attributes.dict.view + "], [" + attributes.dict.slot + "]";
      Array.from(context.querySelectorAll(selector)).filter(function (element) {
        return !_this3._viewsMap.has(element);
      }).forEach(function (element) {
        return _this3._viewsMap.set(element, _this3._createView(element, _this3._model));
      });

      listen(context.querySelectorAll("[href][" + attributes.dict.viewLink + "]"), "click", this._onLinkClick);
      listen(context.querySelectorAll("[" + attributes.dict.deactivateView + "]"), "click", this._onDeactivateViewClick);
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
      var name = element.getAttribute(attributes.dict.view) || element.getAttribute(attributes.dict.slot);
      var transition = this._options.transitions[name] || Transition;
      return new View(element, { name: name, transition: transition, model: model });
    }

    /**
     * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
     * document. This is the case when the doc which is loaded contains views which are not in the current document and
     * do not have a parent view which is in the current document.
     * @param doc
     * @private
     */

  }, {
    key: "_throwOnUnknownViews",
    value: function _throwOnUnknownViews(doc) {
      var message = function message(name) {
        return "Not able to determine where [" + attributes.dict.view + "='" + name + "'] should be inserted.";
      };
      var views = this._gatherViews();

      Array.from(doc.querySelectorAll("[" + attributes.dict.view + "]")).map(function (viewElement) {
        return viewElement.getAttribute(attributes.dict.view);
      }).filter(function (name) {
        return !views.some(function (view) {
          return view.name === name;
        });
      }).forEach(function (name) {
        throw new Error(message(name));
      });
    }

    /**
     * Handles a click on an element with a [data-view-link] attribute. Loads the document found at [href].
     * This function calls the _updatePage function and adds a history entry.
     * @param {Event} e - Click event
     * @private
     */

  }, {
    key: "_onLinkClick",
    value: _async(function (e) {
      var _this4 = this;

      e.preventDefault();
      var url = _this4._options.sanitizeUrl(e.currentTarget.href);
      var viewLink = e.currentTarget.getAttribute(attributes.dict.viewLink);
      var hints = viewLink ? viewLink.split(",") : _this4._options.defaultHints;
      _this4.openUrl(url, hints);
    })

    /**
     *
     * @param {String} url - The url to open.
     * @param {Array<String>|String} hints - The views to update. Can be either a string or an array with multiple strings.
     * @param {Object} fetchOptions - The options to pass to fetch().
     */

  }, {
    key: "openUrl",
    value: function openUrl(url) {
      var hints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._options.defaultHints;
      var fetchOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._options.fetch;

      hints = Array.isArray(hints) ? hints : [hints];
      var model = new Model({ url: url, hints: hints }, fetchOptions);
      var samePage = this._model && this._model.equals(model);
      this._queuePageUpdate(model);
      this._addHistoryEntry(model, samePage);
    }

    /**
     * Handles a click on an element with a [data-deactivate-view="viewname"] attribute.
     * Navigates to the current url of View next up in the ViewOrder. This is particularly useful when you want to close an overlay or lightbox.
     * This function calls the _updatePage function and adds a history entry.
     * @param {Event} e - Click event
     * @private
     */

  }, {
    key: "_onDeactivateViewClick",
    value: function _onDeactivateViewClick(e) {
      e.preventDefault();
      var name = e.currentTarget.getAttribute(attributes.dict.deactivateView);
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
        throw new Error("Unable to deactivate view " + name + ", because there's no view to fall back to.");
      }

      this._queuePageUpdate(newView.model);
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
      var element = document.querySelector("[" + attributes.dict.view + "=\"" + name + "\"], [" + attributes.dict.slot + "=\"" + name + "\"]");
      return this._viewsMap.get(element);
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
        var _model = Model.getById(e.state.model.id) || new Model(e.state.model, this._options.fetch);
        this._queuePageUpdate(_model);
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
    key: "_queuePageUpdate",
    value: function _queuePageUpdate(model) {
      this._queuedModel = model;
      if (this._updatingPage) return;
      this._updatePage(model);
    }

    /**
     * Updates given views in a page with a new model
     * @param {Model} model - The model to update the page with
     * @returns {Promise.<void>} - Resolves when updating the page is done
     * @private
     */

  }, {
    key: "_updatePage",
    value: _async(function (model) {
      var _this5 = this;

      _this5._updatingPage = true;

      dispatch(window, "pagewillupdate", model.getBlueprint());

      _this5._model = model;

      return _continue(_catch(function () {
        var views = _this5._gatherViews();
        views.forEach(function (view) {
          return view.transition.reset();
        });
        views.forEach(function (view) {
          view.model = model;
        });

        var done = Promise.all(views.map(function (view) {
          return view.transition.didComplete;
        }));

        return _await(model.doc, function (doc) {
          _this5._throwOnUnknownViews(doc);
          _this5._options.updateDocument(doc);

          return _await(done, function () {
            dispatch(window, "pagedidupdate", model.getBlueprint());
          });
        });
      }, function (err) {
        console.error(err);
        window.location.href = model.url;
      }), function () {

        if (_this5._queuedModel !== model) {
          _this5._updatePage(_this5._queuedModel);
        }

        _this5._updatingPage = false;
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
        model: model.getBlueprint()
      };

      var method = replaceEntry ? "replaceState" : "pushState";
      history[method](state, document.title, model.url);

      dispatch(window, "statechange", state);
    }
  }], [{
    key: "options",
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
          credentials: "same-origin",
          cache: "default",
          redirect: "error",
          headers: {
            "X-Requested-With": "XmlHttpRequest"
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
}();function _awaitIgnored$1(value, direct) {
  if (!direct) {
    return Promise.resolve(value).then(_empty$1);
  }
}function _empty$1() {}var AnimationTransition = function (_Transition) {
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
      return _awaitIgnored$1(new Promise(function (resolve) {
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
      return _awaitIgnored$1(new Promise(function (resolve) {
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
