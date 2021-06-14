/*!
 * OnEventMixin | Copyright (C) 2021 Peter Kröner | peter@peterkroener.de | Dual license GPL-3.0-only/commercial
 */

import _defineProperty from '@babel/runtime/helpers/defineProperty';

function getSymbol(name) {
  return Symbol.for(`oneventmixin-${name}`);
} // Manages a single on-event property for a HTML element (not EventTargets in
// general). Note that this is NOT a verbatim implementation of event handling
// as defined in the specs, but should be close enough for most use cases. See
// https://html.spec.whatwg.org/#events


class EventManager {
  constructor(target, _event) {
    _defineProperty(this, "_eventTarget", void 0);

    _defineProperty(this, "_eventName", void 0);

    _defineProperty(this, "_handlerValue", void 0);

    _defineProperty(this, "_handler", event => {
      if (this._handlerValue) {
        this._handlerValue.call(this._eventTarget, event);
      }
    });

    this._eventTarget = target;
    this._eventName = _event;
    this.setAttribute(this._eventTarget.getAttribute(`on${this._eventName}`));
  }

  setProperty(value) {
    if (typeof value === "function") {
      this._handlerValue = value;

      this._eventTarget.addEventListener(this._eventName, this._handler);
    } else {
      this._eventTarget.removeEventListener(this._eventName, this._handler);

      this._handlerValue = null;
    }
  }

  setAttribute(value) {
    if (typeof value === "string") {
      const handlerValue = new Function("event", value);
      Object.defineProperty(handlerValue, "name", {
        value: `on${this._eventName}`
      });
      this._handlerValue = handlerValue;

      this._eventTarget.addEventListener(this._eventName, this._handler);
    } else {
      this._eventTarget.removeEventListener(this._eventName, this._handler);

      this._handlerValue = null;
    }
  }

  getValue() {
    return this._handlerValue;
  }

}

function getOrInitEventManagerLazily(target, eventName, attributeName) {
  if (!target[getSymbol(attributeName)]) {
    Object.defineProperty(target, getSymbol(attributeName), {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new EventManager(target, eventName)
    });
  }

  return target[getSymbol(attributeName)];
}

function OnEventMixin(targetConstructor, events) {
  if (typeof targetConstructor !== "function" || !targetConstructor.prototype) {
    throw new TypeError("First argument to OnEventMixin must be a custom element constructor");
  }

  if (!events || typeof events === "string" || !events[Symbol.iterator]) {
    throw new TypeError("Second argument to OnEventMixin must be an iterable list of event names");
  } // Map event attribute names to events, eg. onfoo -> foo


  const eventAttributeMap = new Map(Array.from(events).map(event => {
    event = String(event).toLowerCase();
    return [`on${event}`, event];
  })); // Don't mess up targetConstructor if there's no events

  if (eventAttributeMap.size === 0) {
    return targetConstructor;
  } // Patch the on-properties into the target's prototype to support getting and
  // setting dom properties. Getters and setter lazily initialize the actual
  // data property on the class, which can't be done at any earlier state for a
  // lack of access to "this". Take extra care to not add the same event handler
  // logic twice (which would not have worked anyway; re-defining a property
  // with Object.defineProperty throws a type error)


  for (const [attributeName, event] of eventAttributeMap) {
    if (attributeName in targetConstructor.prototype) {
      continue;
    }

    Object.defineProperty(targetConstructor.prototype, attributeName, {
      enumerable: false,
      configurable: false,

      get() {
        const manager = getOrInitEventManagerLazily(this, event, attributeName);
        return manager.getValue();
      },

      set(value) {
        const manager = getOrInitEventManagerLazily(this, event, attributeName);
        manager.setProperty(value);
      }

    });
  } // Extend the observed attributes with the additional on-event attributes. We
  // can't be less invasive and eg. monitor the attributes from the outside
  // using a MutationObserver, because observers are async.


  const oldObservedAttributes = (targetConstructor === null || targetConstructor === void 0 ? void 0 : targetConstructor.observedAttributes) || [];
  const allObservedAttributes = [...oldObservedAttributes, ...Array.from(eventAttributeMap.keys())];
  Object.defineProperty(targetConstructor, "observedAttributes", {
    enumerable: false,
    configurable: true,

    get() {
      return allObservedAttributes;
    }

  }); // Hack into the attributeChangedCallback (if any) to react to changes to any
  // on-event attributes. This again has to lazily initialize the event manager,
  // which may not exist when it it needed for the first time.

  const oldAttributeChangedCallback = targetConstructor.prototype.attributeChangedCallback;
  Object.defineProperty(targetConstructor.prototype, "attributeChangedCallback", {
    enumerable: false,
    configurable: true,
    writable: false,
    value: function attributeChangedCallback(name, oldValue, newValue) {
      if (eventAttributeMap.has(name)) {
        getOrInitEventManagerLazily(this, eventAttributeMap.get(name), name).setAttribute(newValue);
      }

      if (oldAttributeChangedCallback && oldObservedAttributes.includes(name)) {
        oldAttributeChangedCallback.call(this, name, oldValue, newValue);
      }
    }
  }); // This constructor proxy removes all own on-event properties from instances
  // and re-attaches them before returning the instance. This ensures that
  // deferred upgrades of custom elements subject existing on-event properties
  // to the same logic as already-upgraded custom elements do. Without this,
  // any on-event properties that were attached before the upgrade would
  // technically still exist after the upgrade, but they would not fire in the
  // expected manner.

  const ctorProxy = new Proxy(targetConstructor, {
    construct(target, args, newTarget) {
      const instance = Reflect.construct(target, args, newTarget);

      for (const [, event] of eventAttributeMap) {
        const property = `on${event}`;

        if (Object.prototype.hasOwnProperty.call(instance, property)) {
          const value = instance[property];
          delete instance[property];
          instance[property] = value;
        }
      }

      return instance;
    }

  });
  return ctorProxy;
}

export default OnEventMixin;
