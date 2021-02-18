# OnEventMixin

Add **old-school inline event handler attributes and properties** to your custom
elements with one simple mixin! By default, inline event attributes only work
with built-in events (such as `onclick` for `click` events and `onfocus` for
`focus` events), but that's very easy to change with OnEventMixin:

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
* Easy to use
* Patches the component class in non-destructive way

## Why?

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

```
tbd
```

The mixin creates all necessary DOM properties and attribute monitoring required
for inline event handlers and DOM properties from the list of event names. It
patches the properties into the class, modifies everything else that needs to be
modified (namely)

The list of event

### How it works

tbd

## License

`OnEventMixin` is dual-licensed:

* For open-source and personal projects [GPLv3 license](https://opensource.org/licenses/gpl-3.0.html) applies. Download the software and do with it what you want, as long as derivative work is licensed under an equivalent license.
* If you want to use OnEventMixin for something else [just talk to me](https://www.peterkroener.de/kontakt/) and we can figure something out. I'll probably grant you a free license if your project is small.
