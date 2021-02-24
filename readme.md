# OnEventMixin

Add **old-school inline event handler attributes and properties** to your custom
elements with one simple mixin! By default, inline event handler attributes only
work with [built-in events](https://html.spec.whatwg.org/#globaleventhandlers)
(such as `onclick` for `click` events and `onchange` for `change` events), but
that's very easy to change with OnEventMixin:

```html
<script type="module">
  import OnEventMixin from "./oneventmixin.js";

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

Open `demo.html` in a new-ish browser to see this in action. The dist folder
provides pre-build bundles of the mixin function for all browsers newer than
IE11 in both ESM and minified UMD flavour.

Notable features:

* Adds inline event handler support for any custom event that you need,
  implementing the same behavior as seen in build-in events and elements
* Patches the component class in non-destructive way
* Supports extended component classes
* Supports bubbling events for nested custom elements (see [limitations](#limitations))
* Easy to use, hard to misuse

The last point obviously depends on whether you think that old-school inline
event handler attributes and properties should even exist on web components.

## I do indeed think that that's a bad features to have! Why on earth would I want to use this!?

[While inline event handlers are usually considered to be a bad idea for good reasons](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#inline_event_handlers_%E2%80%94_dont_use_these),
I still like to use event handler attributes for quick prototypes and tests. I
also believe that every good web component should strive to be as close to a
built-in HTML element as possible and this requires support for inline event
handlers and their associated DOM properties.

[The interplay between inline event handlers and attributes is non-trivial](https://html.spec.whatwg.org/#events) and it
would be exhausting to re-implement the behavior by hand, for each web
component, over and over again. Hence this mixin.

## How it works & how to use

### Guide

Pass the class that implements your custom element through `OnEventMixin()` and
supply the list of names of non-standard events that the custom element can
fire:

```javascript
class MyWebComponent extends HTMLElement {
  // some logic that can fire "foo" and "bar" events
}

// Patch all logic required for "onfoo" and "onbar" event properties and
// attributes into the component class. This modifies the class itself!
import OnEventMixin from "./oneventmixin.js";
OnEventMixin(MyWebComponent, ["foo"]);

// Register the custom element as usual
window.customElements.define("my-web-component", MyWebComponent);

const componentInstance = document.createElement("my-web-component");

// Event handler attribute (code string gets eval'd - use with caution)
componentInstance.setAttribute("onfoo", "window.alert(23)");

// Event handler DOM property (must be a function)
componentInstance.onbar = () => window.alert(42);
```

The first argument must be the component class, the second argument must be an
iterable non-string object of strings (eg. an array, set or other list-like
object of strings).

The mixin creates all necessary DOM properties and attribute monitoring required
for inline event handlers and DOM properties from the list of event names. It
patches the properties into the class, modifies everything else that needs to be
modified (namely `observedAttributes` and `attributeChangedCallback`) in a
non-destructive way. A component instance created by a class that the mixin
applied to it should be indistinguishable from a vanilla component instance in
everyday use (apart from the extra on-event properties).

The mixin works with extended component classes just fine:

```javascript
import OnEventMixin from "./oneventmixin.js";

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

It is not necessary to re-apply the mixin logic for events that were already
taken care of in the base class (eg.
`OnEventMixin(MyOtherWebComponent, ["foo", "bar"])`), but nothing will happen if
you do so by accident. Conversely, if the mixin has not been applied to the base
class, you must list all events that the base class fires when using the mixin
on the extending class (at least if you want to use the on-event properties and
attributes).

### How it works

The mixin patches getters and setters for on-event properties into the target
class - one pair of getters and setters per event. Their value is managed by
objects that implement the aforementioned non-trivial behavior of on-event
properties and attributes. These objects live on a secret property (implemented
via a symbol) on the target elements and are lazily initiated once the relevant
getter or setter is used for the first time. To support on-event content
attributes, the mixin also patches the target's `observedAttributes` and
`attributeChangedCallback()` callback by extending the list of
observedAttributes and delegating calls to `attributeChangedCallback()` that
were *not* targeted by the original `observedAttributes` to just the event
handler logic. From your perspective, the `attributeChangedCallback()` behaves
just like before, the Symbol for the event manager object is effectively
invisible and the additional on-event properties on class instances are just
what you ordered.

## Limitations

Built-in event handlers for `onclick` and the like are implemented
[on HTMLElement](https://html.spec.whatwg.org/#htmlelement). Therefore, every
element can listen to every event, even if the element itself can't
possibly trigger the event in question. This is somewhat useful for dealing with
bubbling events:

```html
<div onchange="window.alert('Child changed!')">
  <input type="text" value="Change me!">
</div>
```

There is no way to replicate this exact behavior (event handlers for all custom
events on *all HTML elements*) with JavaScript due to the lack of synchronous
attribute monitoring outside of a custom element's `attributeChangedCallback()`.
This mixin only enables event handlers for the element classes the mixin was
applied to.

You can still nest _custom elements_ and use their custom inline event handlers
for this purpose:

```html
<receives-foo onfoo="window.alert('Foo happened on child!')">
  <triggers-foo></triggers-foo>
</receives-foo>
```

If the mixin for a foo `event` was applied to both `receives-foo` and
`triggers-foo`, everything will work just fine, just don't expect
vanilla `div` elements to be able to take the place of `receives-foo`.

## License

`OnEventMixin` is dual-licensed:

* For open-source and personal projects [GPLv3 license](https://opensource.org/licenses/gpl-3.0.html) applies. Download the software and do with it what you want, as long as derivative work is licensed under an equivalent license.
* If you want to use OnEventMixin for something else [just talk to me](https://www.peterkroener.de/kontakt/) and we can figure something out. I'll probably grant you a free license if your project is small.
