(function () {
'use strict';

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() { return this })() || Function("return this")()
);

/**
 * @class Config
 * @classdesc Configuration class for Lipgloss
 */
class Config {

  /**
   * Unless overwritten, the default attributes are used
   */
  constructor() {
    this._overrides = {};
  }

  /**
   * Overwrite the default attributes
   * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
   */
  assign(attributes) {
    this._overrides = Object.assign(this._overrides, attributes);
  }

  /**
   * Get the attribute name for a given normalized attribute name
   * @param {string} attribute - The normalized attribute name
   * @returns {string} - The configured attribute name
   */
  attribute(attribute) {
    return this._overrides[attribute] || attribute;
  }

}

var config = new Config();

const attr$2 = key => config.attribute(key);
const reflow = element => element.offsetHeight;

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
class Transition {

  /**
   * @param {Element} view - The view element
   */
  constructor(view) {
    this._view = view;
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async exit() {
    this._view.removeAttribute(attr$2('data-transition'));
    reflow(this._view);
    this._view.setAttribute(attr$2('data-transition'), 'out');
  }

  /**
   * @description Loading transition for the given view. This transition state will only occur if the requested document is still loading when exit() completes.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
   */
  async loading() {
    this._view.removeAttribute(attr$2('data-transition'));
    reflow(this._view);
    this._view.setAttribute(attr$2('data-transition'), 'loading');
  }

  /**
   * @description Exit transition for the given view.
   * @param {String} node - The new views node
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async enter(node) {
    this._view.innerHTML = node.innerHTML;
    this._view.removeAttribute(attr$2('data-transition'));
    reflow(this._view);
    this._view.setAttribute(attr$2('data-transition'), 'in');
  }

}

const dispatchEvent = (source, event, options = { bubbles: true, cancelable: true }) => {
  source.dispatchEvent(new CustomEvent(event, options));
};

const unique = arr => Array.from(new Set(arr));
const attr$1 = key => config.attribute(key);

/**
 * @class View
 * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
 */
class View {

  /**
   * @param {Element} element - The element associated with the view
   * @param {Object} options - Options for the view
   * @param {string|null} options.name = null - The name of the view. You should set this
   * @param {boolean} options.persist = false - If a view is persistant, it will not exit if it's not found within the loaded document.
   * @param {Transition} options.transition = Transition - The transition to use for this view
   * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
   * @param {Model|null} options.model = null - The initial model of the view. You should set this.
   */
  constructor(element, options = {}) {

    this._element = element;
    this._options = Object.assign(View.options, options);

    this.active = !!this._element.innerHTML;
    this._persist = this._element.hasAttribute(attr$1('data-persist-view'));
    this._activeModel = this._options.model;

    const ViewTransition = this._options.transition;
    this._transition = new ViewTransition(this._element);

    if (!(this._transition instanceof Transition)) {
      throw new Error('Provided transition is not an instance of Transition');
    }
  }

  /**
   * Default options
   * @type {object}
   */
  static get options() {
    return {
      name: null,
      persist: false,
      transition: Transition,
      selector: null,
      model: null
    };
  }

  get eventOptions() {
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
  get selector() {
    return this._options.selector || `[${attr$1('data-view')}="${this._options.name}"]`;
  }

  /**
   * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
   * @returns {boolean} - Active
   */
  get active() {
    return this._active;
  }

  /**
   * Set the active state of this View.
   * @param {boolean} bool - Active
   */
  set active(bool) {
    this._active = bool;
    this._element.setAttribute(attr$1('data-view-active'), bool);
  }

  /**
   * @returns {boolean} - Whether this View is loading
   */
  get loading() {
    return this._isLoading;
  }

  /**
   * Set's the loading state for this View
   * @param {boolean} bool
   */
  set loading(bool) {

    this._isLoading = bool;
    const loadingViews = document.body.hasAttribute(attr$1('data-views-loading')) ? document.body.getAttribute(attr$1('data-views-loading')).split(' ') : [];

    const newLoadingViews = bool ? unique([...loadingViews, this._options.name]) : loadingViews.filter(name => name !== this._options.name);

    document.body.setAttribute(attr$1('data-views-loading'), newLoadingViews.join(' '));
  }

  /**
   * @returns {Model} - The Model currently associated with this view
   */
  get model() {
    return this._activeModel;
  }

  /**
   * Set the model associated with this view
   * @param {Model} model
   */
  set model(model) {
    this._setModel(model);
  }

  async setModel(model) {

    const modelIncludesView = model.includesView(this._options.name);
    const htmlContainsViews = Promise.resolve(modelIncludesView || model.querySelector(this.selector));
    const active = await htmlContainsViews.then(() => true, () => false);

    (await active) ? this._activate(model) : this._deactivate();
    this.active = active;
  }

  /**
   * @returns {string} - The name of this view
   */
  get name() {
    return this._options.name;
  }

  /**
   * Activate a new Model for this View. The selector will query the retreived document for a node to use.
   * @param {Model} model - The model to update the view with
   * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
   * @private
   */
  async _activate(model) {

    if (this._activeModel && this._activeModel.url === model.url) {
      return;
    }

    this.loading = true;
    model.doc.then(() => {
      this.loading = false;
    });

    this.active && (await this._exit());
    this.loading && this._transition.loading();

    await this._enter((await model.querySelector(this.selector)));
    this._activeModel = model;
  }

  /**
   * Deactivate the Model for this View.
   * @private
   */
  async _deactivate() {

    if (!this.active) return;
    if (this._persist) return;

    await this._exit();
    this._activeModel = null;
  }

  /**
   * Initialize the enter transition and fire relevant lifecycle events
   * @param {Element} node - The new node to update the view with
   * @returns {Promise.<void>}
   * @private
   */
  async _enter(node) {
    dispatchEvent(this._element, 'viewwillenter', this.eventOptions);
    await this._transition.enter(node);
    dispatchEvent(this._element, 'viewdidenter', this.eventOptions);
  }

  /**
   * Initialize the exit transition and fire relevant lifecycle events
   * @returns {Promise.<void>}
   * @private
   */
  async _exit() {
    dispatchEvent(this._element, 'viewwillexit', this.eventOptions);
    await this._transition.exit();
    dispatchEvent(this._element, 'viewdidexit', this.eventOptions);
  }

}

/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
class Model {

  /**
   * Initialize a new Model
   * @param {object} options - The configuration for the Model
   * @param {string} options.url - The url to request
   * @param {array} options.hints=string[] - The views expected to be present on the requested page
   * @param {object} fetchOptions = The options used to fetch the url
   */
  constructor(options, fetchOptions) {
    this._request = new Request(options.url, fetchOptions);
    this._hints = options.hints || [];
    this._doc = null;
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */
  get url() {
    return this._request.url;
  }

  /**
   * @description Gets the loaded document (lazily)
   * @returns {Promise.<Element>} - A promise containing the new document
   */
  get doc() {
    if (!this._doc) {
      this._doc = fetch(this._request).then(response => response.ok ? response : Promise.reject()).then(response => response.text()).then(html => new DOMParser().parseFromString(html, 'text/html'));
    }
    return this._doc;
  }

  /**
   * A check to see if name was included the given hints
   * @param {string} name - A name of a view
   * @returns {boolean}
   */
  includesView(name) {
    return this._hints.includes(name);
  }

  /**
   * Queries the loaded document for the selector, rejects if it's not found
   * @param {string} selector='body' - The selector to query for
   * @returns {Promise.<node>} - The node found in the loaded document
   */
  querySelector(selector = 'body') {
    return this.doc.then(doc => doc.querySelector(selector)).then(node => node && node.innerHTML ? node : Promise.reject());
  }

  /**
   * Get an object representation of the Model, which can be added to the history state. You can pass it to the
   * options parameter in the constructor to recreate the model:
   * @example <caption>Using the model representation</caption>
   * const representation = model.getRepresentation()
   * const twin = new Model(representation, fetchOptions)
   * @returns {{url: string, hints: string[]}}
   */
  getRepresentation() {
    return { url: this._request.url, hints: this._hints };
  }

}

const SUPPORTED = 'pushState' in history;
const attr = key => config.attribute(key);

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */
class Controller {

  /**
   * Controller is a singleton which should be initialized once trough the init() method to set the options
   * @param {object} options - Options
   * @param {string[]} options.defaultHints - Which views are expected to be present, when a link is loaded with an empty [data-view-link]
   * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
   * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
   * @param {object} options.fetch - The options to pass into a fetch request
   */
  init(options = {}) {

    if (!SUPPORTED) return;

    if (this._initialized) {
      throw new Error('You can only initialize Lipgloss once.');
    }

    this._initialized = true;
    this._options = Object.assign(Controller.options, options);
    this._viewsMap = new WeakMap();

    config.assign(this._options.attributes);

    const url = this._options.sanitizeUrl(window.location.href);
    this._model = new Model({ url, hints: [] }, this._options.fetch);

    this._addHistoryEntry(this._model, true);
    this._bindEvents();

    this.initializeContext(document);
  }

  /**
   * Default init options
   * @type {object}
   */
  static get options() {
    return {
      defaultHints: [],
      transitions: {},
      sanitizeUrl: url => url,
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

  /**
   * Return all the views contained in the current document
   * @returns {View[]} - An array of View instances
   */
  get views() {
    return Array.from(document.querySelectorAll(`[${attr('data-view')}]`)).map(element => this._viewsMap.get(element));
  }

  /**
   * Bind global events
   * @private
   */
  _bindEvents() {
    this._onLinkClick = this._onLinkClick.bind(this);
    this._onActivateViewClick = this._onActivateViewClick.bind(this);
    document.addEventListener('viewdidenter', e => this.initializeContext(e.target));
    window.addEventListener('popstate', e => this._onPopState(e));
  }

  /**
   * Initialize a piece of context. Is automatically called after a Transition updates the HTML, but can also be called
   * manually if you have udpated the HTML manually.
   * This function creates Views when they are not initialized yet and binds events for the context.
   * @param {Element} context - The context to intialize
   */
  initializeContext(context) {

    Array.from(context.querySelectorAll(`[${attr('data-view')}]`)).filter(element => !this._viewsMap.has(element)).forEach(element => this._viewsMap.set(element, this._buildView(element, this._model)));

    context.querySelectorAll(`[href][${attr('data-view-link')}]`).forEach(link => link.addEventListener('click', this._onLinkClick));

    context.querySelectorAll(`[${attr('data-activate-view')}]`).forEach(link => link.addEventListener('click', this._onActivateViewClick));
  }

  /**
   * Creates a View component based on a given element and an initial model
   * @param {Element} element - The element to create a view for
   * @param {Model} model - The initial model for the view
   * @returns {View} - The created view
   * @private
   */
  _buildView(element, model) {
    const name = element.getAttribute(attr('data-view'));
    const persist = element.hasAttribute(attr('data-persist-view'));
    const transition = this._options.transitions[name] || Transition;
    return new View(element, { name, transition, persist, model });
  }

  /**
   * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
   * document. This is the case when the doc which is loaded contains views which are not in the current document and
   * do not have a parent view which is in the current document.
   * @param doc
   * @private
   */
  _throwOnUnknownViews(doc) {
    const message = name => `Not able to determine where [${attr('data-view')}='${name}'] should be inserted.`;

    Array.from(doc.querySelectorAll(`[${attr('data-view')}]`)).map(viewElement => viewElement.getAttribute(attr('data-view'))).filter(name => !this.views.some(view => view.name === name)).forEach(name => {
      throw new Error(message(name));
    });
  }

  /**
   * Checks whether a url is equal to the current url (after sanitizing)
   * @param {string} url - The url to compare to the current url
   * @returns {boolean}
   * @private
   */
  _isCurrentUrl(url) {
    return this._options.sanitizeUrl(url) === this._options.sanitizeUrl(window.location.href);
  }

  /**
   * Handles a click on an element with a [data-view-link] attribute.
   * Loads the document found at [href], unless that's the current url already.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  async _onLinkClick(e) {
    e.preventDefault();

    const url = this._options.sanitizeUrl(e.currentTarget.href);
    const viewLink = e.currentTarget.getAttribute(attr('data-view-link'));
    const hints = viewLink ? viewLink.split(',') : this._options.defaultHints;
    const model = new Model({ url, hints }, this._options.fetch);

    if (this._isCurrentUrl(model.url)) return;
    await this._updatePage(model);
    this._addHistoryEntry(model);
  }

  /**
   * Handles a click on an element with a [data-activate-view="viewname"] attribute.
   * Navigates to the current url of the given View. This is particularly useful when you want to close an overlay or lightbox.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  async _onActivateViewClick(e) {
    e.preventDefault();

    const name = e.currentTarget.getAttribute(attr('data-activate-view'));
    const model = this._getModelFromView(name);

    if (this._isCurrentUrl(model.url)) return;
    await this._updatePage(model);
    this._addHistoryEntry(model);
  }

  /**
   * Retreive a Model from a View
   * @param {string} name - The name of a View
   * @returns {Model} - The model currently active for the given View
   * @private
   */
  _getModelFromView(name) {
    const element = document.querySelector(`[${attr('data-view')}="${name}"]`);
    const view = this._viewsMap.get(element);
    return view.model;
  }

  /**
   * Recreate a model for a given popstate and update the page
   * @param {Event} e - Event
   * @private
   */
  _onPopState(e) {
    try {
      const model = new Model(e.state.model, this._options.fetch);
      this._updatePage(model);
    } catch (err) {}
  }

  /**
   * Updates given views in a page with a new model
   * @param {Model} model - The model to update the page with
   * @returns {Promise.<void>} - Resolves when updating the page is done
   * @private
   */
  async _updatePage(model) {
    this._model = model;
    try {
      const viewUpdates = this.views.map(view => view.setModel(model));
      await Promise.all(viewUpdates);
      const doc = await model.doc;
      this._throwOnUnknownViews(doc);
      document.title = doc.title;
    } catch (err) {
      window.location.href = model.url;
    }
  }

  /**
   * Add an history entry
   * @param {Model} model - The model to add an history entry for
   * @param {boolean} [replaceEntry=false] - Whether to replace the history entry, instead of pushing it.
   * @private
   */
  _addHistoryEntry(model, replaceEntry = false) {

    const state = {
      title: document.title,
      url: model.url,
      model: model.getRepresentation()
    };

    const method = replaceEntry ? 'replaceState' : 'pushState';
    history[method](state, document.title, model.url);

    dispatchEvent(window, 'statechange', {
      detail: state
    });
  }

}

var lipgloss = new Controller();

const listenOnce = (target, event, fn) => {
  const _fn = function () {
    fn.apply(null, arguments);
    target.removeEventListener(event, _fn);
  };
  return target.addEventListener(event, _fn);
};

/**
 * Extended Transition
 */
class AnimationTransition extends Transition {

  /**
   *
   */
  async exit() {
    super.exit();
    await new Promise(resolve => listenOnce(this._view, 'animationend', resolve));
  }

  /**
   *
   * @param {String} html - HTML to load in the view
   */
  async enter(node) {
    super.enter(node);
    await new Promise(resolve => listenOnce(this._view, 'animationend', resolve));
  }

}

lipgloss.init({
  defaultViews: ['main'],
  transitions: {
    main: AnimationTransition
  }
});

}());
