# OnEventMixin

Add **old-school inline event handler attributes and properties** to your custom elements with one simple mixin! By default, inline event handler attributes only work with [built-in events](https://html.spec.whatwg.org/#globaleventhandlers) (such as `onclick` for `click` events and `onchange` for `change` events), but that's very easy to change with OnEventMixin! Just install [the package](https://www.npmjs.com/package/@sirpepe/oneventmixin)...

```
$ npm install @sirpepe/oneventmixin
```

... and then apply the mixin to your custom element class:

```html
<script type="module">
  import OnEventMixin from "@sirpepe/oneventmixin";

  class MyFoo extends HTMLElement {
    // This just provides a way to trigger a custom event
    connectedCallback() {
      this.addEventListener("click", () => {
        this.dispatchEvent(new Event("stuffhappens"));
      });
    }
  }

  // Pass your class and a list of custom events to the mixin function
  window.customElements.define("my-foo", OnEventMixin(MyFoo, ["stuffhappens"]));
</script>

<my-foo onstuffhappens="window.alert('It works')">
  Click me to trigger stuffhappens event
</my-foo>
```

Open `demo.html` in a new-ish browser to see this in action. The dist folder provides pre-build bundles of the mixin function for all browsers newer than IE11 in both ESM and minified UMD flavour.

Notable features:

* Adds inline event handler support for any custom event that you need, implementing the same behavior as seen in build-in events and elements
* Patches the component class in a non-destructive way
* Works when element's upgrades are deferred
* Supports extended component classes
* Supports bubbling events (for nested _custom_ elements with _custom events_ only, see [limitations](#limitations))
* Easy to use, hard to misuse

The last point obviously depends on whether you think that old-school inline event handler attributes and properties should even exist on web components.

## I do indeed think that that's a bad features to have! Why on earth would I want to use this!?

[While inline event handlers are usually considered to be a bad idea for good reasons](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#inline_event_handlers_%E2%80%94_dont_use_these), I still like to use event handler attributes for quick prototypes and tests. I also believe that every good web component should strive to be as close to a built-in HTML element as possible and this requires support for inline event handlers and their associated DOM properties.

[The interplay between inline event handlers and attributes is non-trivial](https://html.spec.whatwg.org/#events) and it would be exhausting to re-implement the behavior by hand, for each web component, over and over again. Hence this mixin.

## How it works & how to use

### Guide

Pass the class that implements your custom element through `OnEventMixin()` and supply the list of names of non-standard events that the custom element can fire:

```javascript
class MyWebComponent extends HTMLElement {
  // some logic that can fire "foo" and "bar" events
}

// Patch all logic required for "onfoo" and "onbar" event properties and
// attributes into the component class. This modifies the class itself!
import OnEventMixin from "@sirpepe/oneventmixin";
OnEventMixin(MyWebComponent, ["foo"]);

// Register the custom element as usual
window.customElements.define("my-web-component", MyWebComponent);

const componentInstance = document.createElement("my-web-component");

// Event handler attribute (code string gets eval'd - use with caution)
componentInstance.setAttribute("onfoo", "window.alert(23)");

// Event handler DOM property (must be a function)
componentInstance.onbar = () => window.alert(42);
```

The first argument must be the component class, the second argument must be an iterable non-string object of strings (eg. an array, set or other list-like object of strings).

The mixin creates all necessary DOM properties and attribute monitoring required for inline event handlers and DOM properties from the list of event names. It patches the properties into the class, modifies everything else that needs to be modified (namely `observedAttributes` and `attributeChangedCallback`) in a non-destructive way. A component instance created by a class that the mixin applied to it should be indistinguishable from a vanilla component instance in everyday use (apart from the extra on-event properties).

The mixin works with extended component classes just fine:

```javascript
import OnEventMixin from "@sirpepe/oneventmixin";

class MyWebComponent extends HTMLElement {
  // some logic that can fire "foo" events
}

// Enable "onfoo" properties and attributes on MyWebComponent
OnEventMixin(MyFoo, ["foo"]);

class MyOtherWebComponent extends MyWebComponent {
  // some logic that can fire "bar" events (can also fire "foo" from base class)
}

// Enable "onbar" on the extending class in addition to "onfoo"
OnEventMixin(MyOtherWebComponent, ["bar"]);
```

It is not necessary to re-apply the mixin logic for events that were already taken care of in the base class (eg. `OnEventMixin(MyOtherWebComponent, ["foo", "bar"])`), but nothing will happen if you do so by accident. Conversely, if the mixin has not been applied to the base class, you must list all events that the base class fires when using the mixin on the extending class (at least if you want to use the on-event properties and attributes).

### How it works

The mixin patches getters and setters for on-event properties into the target class - one pair of getters and setters per event. Their value is managed by objects that implement the aforementioned non-trivial behavior of on-event properties and attributes. These objects live on a secret property (implemented via a symbol) on the target elements and are lazily initiated once the relevant getter or setter is used for the first time. A constructor proxy ensures that on-event properties that were set before the custom element upgrade (and that therefore a the element's own properties) get initialized properly.

To support on-event content attributes, the mixin also patches the target's `observedAttributes` and `attributeChangedCallback()` callback by extending the list of observedAttributes and delegating calls to `attributeChangedCallback()` that were *not* targeted by the original `observedAttributes` to just the event handler logic. From your perspective, the `attributeChangedCallback()` behaves just like before, the Symbol for the event manager object is effectively invisible and the additional on-event properties on class instances are just what you ordered.

## Limitations

Built-in event handlers for `onclick` and the like are implemented [on HTMLElement](https://html.spec.whatwg.org/#htmlelement). Therefore, every element can listen to every event, even if the element itself can't possibly trigger the event in question. This is somewhat useful for dealing with bubbling events:

```html
<div onchange="window.alert('Child changed!')">
  <input type="text" value="Change me!">
</div>
```

There is no way to replicate this exact behavior (event handlers for all custom events on *all HTML elements*) with JavaScript due to the lack of synchronous attribute monitoring outside of a custom element's `attributeChangedCallback()`. This mixin only enables event handlers for the element classes the mixin was applied to.

You can still nest _custom elements_ and use their custom inline event handlers for this purpose:

```html
<receives-foo onfoo="window.alert('Foo happened on child!')">
  <triggers-foo></triggers-foo>
</receives-foo>
```

If the mixin for a foo `event` was applied to both `receives-foo` and `triggers-foo`, everything will work just fine, just don't expect vanilla `div` elements to be able to take the place of `receives-foo`.

## Note for TypeScript users

The function `OnEventMixin` modifies its input class, which is not a behavior that TypeScript's type system can express - in TypeScript's world, classes just can't be updated on the fly! However, the function also returns its input class again and as a sort of compromise we can let TypeScript believe that the output class is distinct from the input class:

```typescript
class WithoutEvents extends HTMLElement {}

const WithEvents = OnEventMixin(WithoutEvents, ["foo"]);
// WithEvents is actually identical to to MyComponentClass, but TS can't model this

// <without-events> and <with-events> both support "onfoo", but TS can't model this
window.customElements.define("without-events", WithoutEvents);
window.customElements.define("with-events", WithEvents);

document.createElement("without-events").onfoo; // error (in TS, not in actuality)
document.createElement("with-events"); // works
```

This should not be a problem in most cases, as you are probably not going to be using the class `WithoutEvents` all that often - apart from feeding it into `OnEventMixin` of course. But there is another slight caveat: `OnEventMixin` returns a modified *constructor*, which is subtly different from a class. Consider the following class example:

```typescript
class A {}
let a: A = new A();
```

The object `A` is a constructor function but `A` is *also a type* that describes the objects that the constructor called `A` returns. We can't re-create this behavior without creating a new class, which, [as discussed above](#how-it-works), this library does not do (and if it did, this would still not help as this library is written in vanilla JS). The bottom line is that `OnEventMixin` essentially breaks the "class-ness" of its input:

```typescript
class WithoutEvents extends HTMLElement {}
window.customElements.define("without-events", WithoutEvents);
let a: WithoutEvents = document.createElement("without-events");

// "WithEvents" is the same class as WithoutEvents, but TS does not know this.
// The function type returns a extended version of the input classes'
// constructor as a workaround/compromise
const WithEvents = OnEventMixin(WithoutEvents, ["foo"]);
window.customElements.define("with-events", WithEvents);
let B: WithEvents = document.createElement("without-events"); // Error: WithEvents is a value, not a type
```

This makes a non-trivial amount of sense: classes are the only language construct in TypeScript that create a runtime object (the constructor) and a type that does *not* describe the same object (it rather describes the object the constructor constructs). And there is no way to replicate this behavior in any way but a full-featured class. But one workaround *can* restore the modified constructor's "class-ness":

```typescript
class WithoutEvents extends HTMLElement {}
class WithEvents extends OnEventMixin(WithoutEvents, ["foo"]) {}
window.customElements.define("with-events", WithEvents);
let element: WithEvents = document.createElement("with-events"); // Works!
element.onfoo = window.alert(42); // Works!
```

So: *if* you use TypeScript and *if* you need the class-ness of your custom elements to remain after they have been modified by the mixin, just create a new class that extends from the mixin result! If you export modified component classes from a module, it's best to restore the class-ness when you export them:

```typescript
class MyComponentClass extends HTMLElement {}
class MyComponentClassWithEvents extends OnEventMixin(MyComponentClass, ["foo"]) {};
export { MyComponentClassWithEvents as MyComponentClass };
```

Just be sure to leave a comment in your code to explain what you are doing.

## Changelog

* **0.0.3**: added support (via Proxy) for keeping on-event properties that were added before the element upgrade
* **0.0.2**: initial release

## License

OnEventMixin is available under two different licenses depending on how you plan to use it:

* For **open-source** projects the [GPLv3 license](https://opensource.org/licenses/gpl-3.0.html) applies. You can download OnEventMixin and do with it what you want, as long as derivative work is licensed under an equivalent license.
* If you want to use OnEventMixin for **commercial/closed source** projects [just talk to me](https://www.peterkroener.de/kontakt/) and we can figure something out. I'll probably grant you a free license with no strings attached if you ask nicely.
