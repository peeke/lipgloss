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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};









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
        var _this = this;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._view.innerHTML = node.innerHTML;
                requestAnimationFrame(function () {
                  _this._view.removeAttribute(attr$2('data-transition'));
                  reflow(_this._view);
                  _this._view.setAttribute(attr$2('data-transition'), 'in');
                });

              case 2:
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
  }, {
    key: 'done',
    value: function done() {
      this._view.removeAttribute(attr$2('data-transition'));
      reflow(this._view);
    }
  }]);
  return Transition;
}();

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

        var node, active, event;
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
                return this._exit(true);

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
                this._transition.done();

                event = active ? 'viewactive' : 'viewinactive';

                this._element.dispatchEvent(new CustomEvent(event, this.eventOptions));

              case 22:
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
                this._transition.done();
                this._element.dispatchEvent(new CustomEvent('viewinactive', this.eventOptions));
                this._activeModel = null;

              case 10:
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
                this._element.dispatchEvent(new CustomEvent('viewwillenter', this.eventOptions));
                _context3.next = 3;
                return this._transition.enter(node);

              case 3:
                this._element.dispatchEvent(new CustomEvent('viewdidenter', this.eventOptions));

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
                this._element.dispatchEvent(new CustomEvent('viewwillexit', this.eventOptions));
                _context4.next = 3;
                return this._transition.exit();

              case 3:
                this._element.dispatchEvent(new CustomEvent('viewdidexit', this.eventOptions));

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
        cancelable: true
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
      console.log(newLoadingViews);
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
      }).catch(function () {
        throw new Error('Hint \'' + _this3._options.name + '\' was given, but not found in the loaded document.');
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

      Array.from(context.querySelectorAll('[href][' + attr('data-view-link') + ']')).forEach(function (link) {
        return link.addEventListener('click', _this2._onLinkClick);
      });

      Array.from(context.querySelectorAll('[' + attr('data-activate-view') + ']')).forEach(function (link) {
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

      window.dispatchEvent(new CustomEvent('statechange', { detail: state }));
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

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory() : typeof define === 'function' && define.amd ? define(factory) : factory();
})(undefined, function () {
  var setTimeoutFunc = setTimeout;

  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && ((typeof newValue === 'undefined' ? 'undefined' : _typeof(newValue)) === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  function Promise(fn) {
    if (!(this instanceof Promise)) throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  var _proto = Promise.prototype;
  _proto.catch = function (onRejected) {
    return this.then(null, onRejected);
  };

  _proto.then = function (onFulfilled, onRejected) {
    var prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!arr || typeof arr.length === 'undefined') throw new TypeError('Promise.all accepts an array');
      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = typeof setImmediate === 'function' && function (fn) {
    setImmediate(fn);
  } || function (fn) {
    setTimeoutFunc(fn, 0);
  };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  var global = function () {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof self !== 'undefined') {
      return self;
    }
    if (typeof window !== 'undefined') {
      return window;
    }
    if (typeof global !== 'undefined') {
      return global;
    }
    throw new Error('unable to locate global object');
  }();

  if (!global.Promise) {
    global.Promise = Promise;
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function value(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        // NOTE: === provides the correct "SameValueZero" comparison needed here.
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

(function (self) {
  if (self.fetch) {
    return;
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  if (support.arrayBuffer) {
    var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

    var isDataView = function isDataView(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj);
    };

    var isArrayBufferView = ArrayBuffer.isView || function (obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
    };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function next() {
        var value = items.shift();
        return { done: value === undefined, value: value };
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function () {
        return iterator;
      };
    }

    return iterator;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function (header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ',' + value : value;
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null;
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push(name);
    });
    return iteratorFor(items);
  };

  Headers.prototype.values = function () {
    var items = [];
    this.forEach(function (value) {
      items.push(value);
    });
    return iteratorFor(items);
  };

  Headers.prototype.entries = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items);
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise;
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise;
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('');
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0);
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer;
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        throw new Error('unsupported BodyInit type');
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob);
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]));
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
        } else {
          return this.blob().then(readBlobAsArrayBuffer);
        }
      };
    }

    this.text = function () {
      var rejected = consumed(this);
      if (rejected) {
        return rejected;
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text');
      } else {
        return Promise.resolve(this._bodyText);
      }
    };

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this, { body: this._bodyInit });
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      var request = new Request(input, init);
      var xhr = new XMLHttpRequest();

      xhr.onload = function () {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : undefined);

// Polyfill for creating CustomEvents on IE9/10/11

// code pulled from:
// https://github.com/d4tocchini/customevent-polyfill
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill

try {
  var ce = new window.CustomEvent('test');
  ce.preventDefault();
  if (ce.defaultPrevented !== true) {
    // IE has problems with .preventDefault() on custom events
    // http://stackoverflow.com/questions/23349191
    throw new Error('Could not prevent default');
  }
} catch (e) {
  var CustomEvent$1 = function CustomEvent(event, params) {
    var evt, origPrevent;
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: undefined
    };

    evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    origPrevent = evt.preventDefault;
    evt.preventDefault = function () {
      origPrevent.call(this);
      try {
        Object.defineProperty(this, 'defaultPrevented', {
          get: function get$$1() {
            return true;
          }
        });
      } catch (e) {
        this.defaultPrevented = true;
      }
    };
    return evt;
  };

  CustomEvent$1.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent$1; // expose definition to window
}

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = function () {
    var toStr = Object.prototype.toString;
    var isCallable = function isCallable(fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function toInteger(value) {
      var number = Number(value);
      if (isNaN(number)) {
        return 0;
      }
      if (number === 0 || !isFinite(number)) {
        return number;
      }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function toLength(value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }();
}

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      // .length of function is 2
      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

var lipgloss = new Controller();

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
    value: function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), 'exit', this).call(this);
                _context.next = 3;
                return new Promise(function (resolve) {
                  var animationEnd = function animationEnd(e) {
                    if (e.target !== _this2._view) return;
                    _this2._view.removeEventListener('animationend', animationEnd);
                    resolve();
                  };
                  _this2._view.addEventListener('animationend', animationEnd);
                });

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
     *
     * @param {String} html - HTML to load in the view
     */

  }, {
    key: 'enter',
    value: function () {
      var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(node) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                get(AnimationTransition.prototype.__proto__ || Object.getPrototypeOf(AnimationTransition.prototype), 'enter', this).call(this, node);
                _context2.next = 3;
                return new Promise(function (resolve) {
                  var animationEnd = function animationEnd(e) {
                    if (e.target !== _this3._view) return;
                    _this3._view.removeEventListener('animationend', animationEnd);
                    resolve();
                  };
                  _this3._view.addEventListener('animationend', animationEnd);
                });

              case 3:
              case 'end':
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
}(Transition);

lipgloss.init({
  defaultHints: ['main', 'navigation'],
  transitions: {
    main: AnimationTransition,
    lightbox: AnimationTransition
  }
});

}());
