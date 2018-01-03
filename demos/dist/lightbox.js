// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      
      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module;

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({8:[function(require,module,exports) {
var global = (1,eval)("this");
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
  "use strict";

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

},{}],10:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var dispatchEvent = function dispatchEvent(source, event) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { bubbles: true, cancelable: true };

  source.dispatchEvent(new CustomEvent(event, options));
};

exports.default = dispatchEvent;
},{}],9:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Config
 * @classdesc Configuration class for Lipgloss
 */
var Config = function () {

  /**
   * Unless overwritten, the default attributes are used
   */
  function Config() {
    _classCallCheck(this, Config);

    this._attributes = Config.defaultAttributes;
  }

  /**
   * Object with the default attribute mappings.
   * Used attributes are: 'data-view-link', 'data-active', 'data-view-hint', 'data-view', 'data-view-active', 'data-activate-view', 'data-views-loading', 'data-persist-view' and 'data-transition'.
   * @type {object}
   */


  _createClass(Config, [{
    key: "overrideAttributes",


    /**
     * Overwrite the default attributes
     * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
     */
    value: function overrideAttributes(attributes) {
      this._attributes = _extends({}, Config.defaultAttributes, attributes);
    }

    /**
     * Get the attribute name for a given normalized attribute name
     * @param {string} attribute - The normalized attribute name
     * @returns {string} - The configured attribute name
     */

  }, {
    key: "attribute",
    value: function attribute(_attribute) {
      return this._attributes[_attribute];
    }
  }]);

  return Config;
}();

Config.defaultAttributes = {
  'data-view-link': 'data-view-link',
  'data-view-link-active': 'data-active',
  'data-view-hint': 'data-view-hint',
  'data-view': 'data-view',
  'data-view-active': 'data-view-active',
  'data-activate-view': 'data-activate-view',
  'data-views-loading': 'data-views-loading',
  'data-persist-view': 'data-persist-view',
  'data-transition': 'data-transition' };
exports.default = new Config();
},{}],7:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dispatchEvent = require("./utils/dispatchEvent");

var _dispatchEvent2 = _interopRequireDefault(_dispatchEvent);

var _Config = require("./Config");

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var attr = function attr(key) {
  return _Config2.default.attribute(key);
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
    _classCallCheck(this, Transition);

    this._view = view;
    this._name = view.getAttribute(attr('data-view'));
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */


  _createClass(Transition, [{
    key: "exit",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this._view.removeAttribute(attr('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr('data-transition'), 'out');

              case 3:
              case "end":
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
    key: "loading",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this._view.removeAttribute(attr('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr('data-transition'), 'loading');

              case 3:
              case "end":
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
    key: "enter",
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(node) {
        var eventOptions;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                eventOptions = {
                  bubbles: true,
                  cancelable: true,
                  detail: {
                    name: this._name
                  }
                };


                (0, _dispatchEvent2.default)(this._view, 'viewwillupdate', eventOptions);
                this._view.innerHTML = node.innerHTML;
                (0, _dispatchEvent2.default)(this._view, 'viewupdated', eventOptions);

                this._view.removeAttribute(attr('data-transition'));
                reflow(this._view);
                this._view.setAttribute(attr('data-transition'), 'in');

              case 7:
              case "end":
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

exports.default = Transition;
},{"./utils/dispatchEvent":10,"./Config":9}],5:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Transition = require("./Transition");

var _Transition2 = _interopRequireDefault(_Transition);

var _Config = require("./Config");

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var unique = function unique(arr) {
  return Array.from(new Set(arr));
};
var attr = function attr(key) {
  return _Config2.default.attribute(key);
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

    _classCallCheck(this, View);

    this._element = element;
    this._options = _extends({}, View.options, options);

    this.active = !!this._element.innerHTML;
    this._persist = this._element.hasAttribute(attr('data-persist-view'));
    this._activeModel = this._options.model;

    var ViewTransition = this._options.transition;
    this._transition = new ViewTransition(this._element);

    if (!(this._transition instanceof _Transition2.default)) {
      throw new Error('Provided transition is not an instance of Transition');
    }
  }

  /**
   * @description Default options
   * @type {object}
   */


  _createClass(View, [{
    key: "hasName",


    /**
     * @description Method to check whether the given name is the name of this view. The name itself is not exposed, to prevent it being used in custom logic.
     * @param {string} name - The name to check
     * @returns {boolean}
     */
    value: function hasName(name) {
      return this._options.name === name;
    }

    /**
     * @description Activate a new Model for this View. The selector will query the retreived document for a node to use.
     * @param {Model} model - The model to update the view with
     * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
     */

  }, {
    key: "_activate",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(model) {
        var _this = this;

        var node;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this._activeModel && this._activeModel.url === model.url)) {
                  _context.next = 3;
                  break;
                }

                this.active = true;
                return _context.abrupt("return");

              case 3:

                this.loading = true;
                model.doc.then(function () {
                  _this.loading = false;
                });

                _context.t0 = this.active;

                if (!_context.t0) {
                  _context.next = 9;
                  break;
                }

                _context.next = 9;
                return this._transition.exit();

              case 9:
                this.loading && this._transition.loading();

                _context.next = 12;
                return model.querySelector(this.selector);

              case 12:
                node = _context.sent;

                this._activeModel = model;

                _context.next = 16;
                return this._transition.enter(node);

              case 16:
                this.active = true;

              case 17:
              case "end":
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
     * @description Deactivate the Model for this View.
     */

  }, {
    key: "_deactivate",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.active) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                if (this._persist) {
                  _context2.next = 6;
                  break;
                }

                this._activeModel = null;
                _context2.next = 6;
                return this._transition.exit(this._element);

              case 6:

                this.active = false;

              case 7:
              case "end":
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
  }, {
    key: "selector",


    /**
     * @description The selector to use to obtain a new node for this View from the loaded document
     * @returns {string}
     */
    get: function get() {
      return this._options.selector || "[" + attr('data-view') + "=\"" + this._options.name + "\"]";
    }

    /**
     * @description Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
     * @returns {boolean} - Active
     */

  }, {
    key: "active",
    get: function get() {
      return this._active;
    }

    /**
     * @description Set the active state of this View.
     * @param {boolean} bool - Active
     */
    ,
    set: function set(bool) {
      this._active = bool;
      this._element.setAttribute(attr('data-view-active'), bool);
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
     * @description Set's the loading state for this View
     * @param {boolean} bool
     */
    ,
    set: function set(bool) {
      var _this2 = this;

      this._isLoading = bool;
      var loadingViews = document.body.hasAttribute(attr('data-views-loading')) ? document.body.getAttribute(attr('data-views-loading')).split(' ') || [] : [];

      var newLoadingViews = bool ? unique([].concat(_toConsumableArray(loadingViews), [this._options.name])) : loadingViews.filter(function (name) {
        return name !== _this2._options.name;
      });

      document.body.setAttribute(attr('data-views-loading'), newLoadingViews.join(' '));
    }

    /**
     * @returns {Model} - The Model currently associated with this view
     */

  }, {
    key: "model",
    get: function get() {
      return this._activeModel;
    }

    /**
     * @description Set the model associated with this view
     * @param {Model} model
     */
    ,
    set: function set(model) {
      var _this3 = this;

      var htmlContainsViews = model.includesView(this._options.name)
      // When the model explicitly includes this view name, we assume the view is in the HTML
      ? Promise.resolve()
      // When the model doesn't include the view name, we load the HTML first to check if this view is in the HTML
      : model.querySelector(this.selector);

      htmlContainsViews.then(function () {
        return _this3._activate(model);
      }, function () {
        return _this3._deactivate();
      });
    }
  }]);

  return View;
}();

View.options = {
  name: null,
  persist: false,
  transition: _Transition2.default,
  selector: null,
  model: null };
exports.default = View;
},{"./Transition":7,"./Config":9}],6:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
var Model = function () {

  /**
   * Initialize a new Model
   * @param {Request} request - A request object to fetch the new document
   * @param {string[]} hints = [] - The views which are known to be contained in the loaded document
   */
  function Model(request) {
    var hints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, Model);

    this._request = request;
    this._hints = hints;
    this._doc = null;
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */


  _createClass(Model, [{
    key: "includesView",


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
    key: "querySelector",
    value: function querySelector() {
      var selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';

      return this.doc.then(function (doc) {
        return doc.querySelector(selector);
      }).then(function (node) {
        return node && node.innerHTML ? node : Promise.reject();
      });
    }

    /**
     * Get an object representation of the Model, which can be added to the history state. You can pass it to the
     * Model.create function to recreate the model:
     * @example <caption>Using the model representation</caption>
     * const representation = model.getRepresentation()
     * const twin = Model.create(representation, fetchOptions)
     * @returns {{url: string, hints: string[]}}
     */

  }, {
    key: "getRepresentation",
    value: function getRepresentation() {
      return { url: this._request.url, hints: this._hints };
    }
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

    /**
     * Convenience method to create a Model given url, hints and optionally fetch options
     * @param {string} url - The url to fetch
     * @param {string[]} hints=[] - The views which are known to be contained in the loaded document
     * @param {object} fetchOptions - The options to pass to fetch
     * @returns {Model}
     */

  }], [{
    key: "create",
    value: function create(_ref) {
      var url = _ref.url,
          hints = _ref.hints;
      var fetchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var request = new Request(url, fetchOptions);
      return new Model(request, hints || []);
    }
  }]);

  return Model;
}();

exports.default = Model;
},{}],4:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _View = require("./View");

var _View2 = _interopRequireDefault(_View);

var _Model = require("./Model");

var _Model2 = _interopRequireDefault(_Model);

var _Transition = require("./Transition");

var _Transition2 = _interopRequireDefault(_Transition);

var _Config = require("./Config");

var _Config2 = _interopRequireDefault(_Config);

var _dispatchEvent = require("./utils/dispatchEvent");

var _dispatchEvent2 = _interopRequireDefault(_dispatchEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SUPPORTED = 'pushState' in history;
var attr = function attr(key) {
  return _Config2.default.attribute(key);
};

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */

var Controller = function () {
  function Controller() {
    _classCallCheck(this, Controller);
  }

  _createClass(Controller, [{
    key: "init",


    /**
     * Controller is a singleton which should be initialized once trough the init() method to set the options
     * @param {object} options - Options
     * @param {string[]} options.defaultHints - Which views are expected to be present, when a link is loaded without [data-view-hint]'s given
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
      this._options = _extends({}, Controller.options, options);
      this._viewsMap = new WeakMap();

      if (this._options.overrideAttributes) {
        _Config2.default.overrideAttributes(this._options.overrideAttributes);
      }

      var url = this._options.sanitizeUrl(window.location.href);
      this._model = _Model2.default.create({ url: url, hints: [] }, this._options.fetch);

      this._addHistoryEntry(this._model, true);
      this._bindEvents();

      this.initializeContext(document);
    }

    /**
     * Default init options
     * @type {object}
     */

  }, {
    key: "_bindEvents",


    /**
     * Bind global events
     * @private
     */
    value: function _bindEvents() {
      var _this = this;

      this._onLinkClick = this._onLinkClick.bind(this);
      this._onActivateViewClick = this._onActivateViewClick.bind(this);
      document.addEventListener('viewupdated', function (e) {
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
     * @param context
     */

  }, {
    key: "initializeContext",
    value: function initializeContext(context) {
      var _this2 = this;

      Array.from(context.querySelectorAll("[" + attr('data-view') + "]")).filter(function (element) {
        return !_this2._viewsMap.has(element);
      }).forEach(function (element) {
        return _this2._viewsMap.set(element, _this2._buildView(element, _this2._model));
      });

      context.querySelectorAll("[href][" + attr('data-view-link') + "]").forEach(function (link) {
        return link.addEventListener('click', _this2._onLinkClick);
      });

      context.querySelectorAll("[" + attr('data-activate-view') + "]").forEach(function (link) {
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
    key: "_buildView",
    value: function _buildView(element, model) {
      var name = element.getAttribute(attr('data-view'));
      var persist = element.hasAttribute(attr('data-persist-view'));
      var transition = this._options.transitions[name] || _Transition2.default;
      return new _View2.default(element, { name: name, transition: transition, persist: persist, model: model });
    }

    /**
     * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
     * document. This is the case when the doc which is loaded contains views which are not in the current document and
     * do not have a parent view which is in the current document.
     * @param doc
     * @private
     */

  }, {
    key: "_throwOnUnknownViewsWithoutParent",
    value: function _throwOnUnknownViewsWithoutParent(doc) {
      var _this3 = this;

      var unknownViewElements = Array.from(doc.querySelectorAll("[" + attr('data-view') + "]")).filter(function (element) {
        var name = element.getAttribute(attr('data-view'));
        var hasParent = _this3.views.some(function (view) {
          return view.hasName(name);
        });
        return !hasParent;
      });

      var unknownViewWithoutParent = unknownViewElements.find(function (viewElement) {
        return !viewElement.parentNode.closest("[" + attr('data-view') + "]");
      });

      if (!unknownViewWithoutParent) return;

      var viewName = unknownViewWithoutParent.getAttribute(attr('data-view'));
      throw new Error("Not able to determine where [" + attr('data-view') + "='" + viewName + "'] should be inserted.");
    }

    /**
     * Checks whether a url is equal to the current url (after sanitizing)
     * @param {string} url - The url to compare to the current url
     * @returns {boolean}
     * @private
     */

  }, {
    key: "_isCurrentUrl",
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
    key: "_onLinkClick",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(e) {
        var url, hints, model;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                e.preventDefault();

                url = this._options.sanitizeUrl(e.currentTarget.href);
                hints = e.currentTarget.hasAttribute(attr('data-view-hint')) ? e.currentTarget.getAttribute(attr('data-view-hint')).split(',') : this._options.defaultHints;
                model = _Model2.default.create({ url: url, hints: hints }, this._options.fetch);

                if (!this._isCurrentUrl(model.url)) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt("return");

              case 6:
                _context.next = 8;
                return this._updatePage(model);

              case 8:
                this._addHistoryEntry(model);

              case 9:
              case "end":
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
    key: "_onActivateViewClick",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(e) {
        var name, model;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                e.preventDefault();

                name = e.currentTarget.getAttribute(attr('data-activate-view'));
                model = this._getModelFromView(name);

                if (!this._isCurrentUrl(model.url)) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt("return");

              case 5:
                _context2.next = 7;
                return this._updatePage(model);

              case 7:
                this._addHistoryEntry(model);

              case 8:
              case "end":
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
    key: "_getModelFromView",
    value: function _getModelFromView(name) {
      var element = document.querySelector("[" + attr('data-view') + "=\"" + name + "\"]");
      var view = this._viewsMap.get(element);
      return view.model;
    }

    /**
     * Recreate a model for a given popstate and update the page
     * @param {Event} e - Event
     * @private
     */

  }, {
    key: "_onPopState",
    value: function _onPopState(e) {
      if (!e.state || !e.state.model) return;
      var model = _Model2.default.create(e.state.model, this._options.fetch);
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
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(model) {
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

                this._throwOnUnknownViewsWithoutParent(doc);
                document.title = doc.title;
                _context3.next = 13;
                break;

              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3["catch"](1);

                window.location.href = model.url;

              case 13:
              case "end":
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
    key: "_addHistoryEntry",
    value: function _addHistoryEntry(model) {
      var replaceEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


      var state = {
        title: document.title,
        url: model.url,
        model: model.getRepresentation()
      };

      replaceEntry ? window.history.replaceState(state, document.title, model.url) : window.history.pushState(state, document.title, model.url);

      (0, _dispatchEvent2.default)(window, 'statechange', {
        detail: state
      });
    }
  }, {
    key: "views",


    /**
     * Return all the views contained in the current document
     * @returns {View[]} - An array of View instances
     */
    get: function get() {
      var _this4 = this;

      return Array.from(document.querySelectorAll("[" + attr('data-view') + "]")).map(function (element) {
        return _this4._viewsMap.get(element);
      });
    }
  }]);

  return Controller;
}();

Controller.options = {
  defaultHints: [],
  transitions: {},
  sanitizeUrl: function sanitizeUrl(url) {
    return url;
  },
  fetch: {
    credentials: 'same-origin',
    cache: 'default',
    redirect: 'error',
    headers: {
      'X-Requested-With': 'XmlHttpRequest'
    }
  } };
exports.default = Controller;
},{"./View":5,"./Model":6,"./Transition":7,"./Config":9,"./utils/dispatchEvent":10}],2:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transition = exports.Model = exports.View = undefined;

var _Controller = require("./Controller");

var _Controller2 = _interopRequireDefault(_Controller);

var _View = require("./View");

var _View2 = _interopRequireDefault(_View);

var _Model = require("./Model");

var _Model2 = _interopRequireDefault(_Model);

var _Transition = require("./Transition");

var _Transition2 = _interopRequireDefault(_Transition);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.View = _View2.default;
exports.Model = _Model2.default;
exports.Transition = _Transition2.default;
exports.default = new _Controller2.default();
},{"./Controller":4,"./View":5,"./Model":6,"./Transition":7}],3:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnimationTransition = exports.listenOnce = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _index = require("../../../src/index");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var listenOnce = exports.listenOnce = function listenOnce(target, event, fn) {
  var _fn = function _fn() {
    fn.apply(null, arguments);
    target.removeEventListener(event, _fn);
  };
  return target.addEventListener(event, _fn);
};

/**
 * Extended Transition
 */

var AnimationTransition = exports.AnimationTransition = function (_Transition) {
  _inherits(AnimationTransition, _Transition);

  function AnimationTransition() {
    _classCallCheck(this, AnimationTransition);

    return _possibleConstructorReturn(this, (AnimationTransition.__proto__ || Object.getPrototypeOf(AnimationTransition)).apply(this, arguments));
  }

  _createClass(AnimationTransition, [{
    key: "exit",


    /**
     *
     */
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), "exit", this).call(this);
                _context.next = 3;
                return new Promise(function (resolve) {
                  return listenOnce(_this2._view, 'animationend', resolve);
                });

              case 3:
              case "end":
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
     *
     * @param {String} html - HTML to load in the view
     */

  }, {
    key: "enter",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(node) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), "enter", this).call(this, node);
                _context2.next = 3;
                return new Promise(function (resolve) {
                  return listenOnce(_this3._view, 'animationend', resolve);
                });

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function enter(_x) {
        return _ref2.apply(this, arguments);
      }

      return enter;
    }()
  }]);

  return AnimationTransition;
}(_index.Transition);

exports.default = AnimationTransition;
},{"../../../src/index":2}],1:[function(require,module,exports) {
"use strict";

require("regenerator-runtime/runtime");

var _index = require("../../src/index");

var _index2 = _interopRequireDefault(_index);

var _AnimationTransition = require("./transitions/AnimationTransition");

var _AnimationTransition2 = _interopRequireDefault(_AnimationTransition);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_index2.default.init({
  defaultViews: ['main'],
  transitions: {
    main: _AnimationTransition2.default,
    lightbox: _AnimationTransition2.default
  }
});
},{"regenerator-runtime/runtime":8,"../../src/index":2,"./transitions/AnimationTransition":3}]},{},[1])