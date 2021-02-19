import onEventMixin from "../src/oneventmixin";

function click(target) {
  const event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
}

// Triggers "foo" on click
class BasicEvents extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", () => {
      this.dispatchEvent(new Event("foo"));
    });
  }
}

customElements.define("basic-events", onEventMixin(BasicEvents, ["foo"]));

// Triggers "foo" and "bar" on click
class ExtendedBasicEvents extends BasicEvents {
  constructor() {
    super();
    this.addEventListener("click", () => {
      this.dispatchEvent(new Event("bar"));
    });
  }
}

customElements.define(
  "extended-basic-events",
  onEventMixin(ExtendedBasicEvents, ["bar"])
);

describe("basic events", () => {
  test("initializes on-event properties", () => {
    const target = document.createElement("basic-events");
    expect(target.onfoo).toBe(null);
  });

  test("initializes on-event properties from attributes", () => {
    const target = document.createElement("basic-events");
    target.setAttribute("onfoo", "console.log(42)");
    expect(typeof target.onfoo).toBe("function");
  });

  test("triggers dom property event handlers", () => {
    const onclick = jest.fn();
    const onfoo = jest.fn();
    const target = document.createElement("basic-events");
    target.onclick = onclick;
    target.onfoo = onfoo;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(onfoo.mock.calls.length).toBe(1);
  });

  test("triggers html attribute event handlers", () => {
    window.fooAttributeCount = 0;
    const onclick = jest.fn();
    const target = document.createElement("basic-events");
    target.setAttribute("onfoo", "window.fooAttributeCount++");
    target.onclick = onclick;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(window.fooAttributeCount).toBe(1);
  });

  test("disables dom property event handlers by setting them to null", () => {
    const onclick = jest.fn();
    const onfoo = jest.fn();
    const target = document.createElement("basic-events");
    target.onclick = onclick;
    target.onfoo = onfoo;
    target.onfoo = null;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(onfoo.mock.calls.length).toBe(0);
  });

  test("disables html attribute event handlers by setting the dom property to null", () => {
    window.thisShouldRemainZero = 0;
    const onclick = jest.fn();
    const target = document.createElement("basic-events");
    target.setAttribute("onfoo", "window.thisShouldRemainZero++");
    target.onclick = onclick;
    target.onfoo = null;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(window.thisShouldRemainZero).toBe(0);
  });
});

describe("extended classes", () => {
  test("initializes on-event properties from the extended and the extending class", () => {
    const target = document.createElement("extended-basic-events");
    expect(target.onfoo).toBe(null);
    expect(target.onbar).toBe(null);
  });

  test("triggers dom property event handlers for both events", () => {
    const onclick = jest.fn();
    const onfoo = jest.fn().mockName("onfoo");
    const onbar = jest.fn().mockName("onbar");
    const target = document.createElement("extended-basic-events");
    target.onclick = onclick;
    target.onfoo = onfoo;
    target.onbar = onbar;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(onfoo.mock.calls.length).toBe(1);
    expect(onbar.mock.calls.length).toBe(1);
  });

  test("triggers html attribute event handlers for both", () => {
    window.extendedFooAttributeCount = 0;
    window.extendedBarAttributeCount = 0;
    const onclick = jest.fn();
    const target = document.createElement("extended-basic-events");
    target.setAttribute("onfoo", "window.extendedFooAttributeCount++");
    target.setAttribute("onbar", "window.extendedBarAttributeCount++");
    target.onclick = onclick;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(window.extendedFooAttributeCount).toBe(1);
    expect(window.extendedBarAttributeCount).toBe(1);
  });
});

describe("you're holding it wrong", () => {
  test("does not do anything unexpected when applying the mixin twice", () => {
    customElements.define(
      "mixin-twice",
      onEventMixin(
        onEventMixin(
          class extends HTMLElement {
            constructor() {
              super();
              this.addEventListener("click", () => {
                this.dispatchEvent(new Event("foo"));
              });
            }
          },
          ["foo"]
        ),
        ["foo"]
      )
    );
    const onclick = jest.fn();
    const onfoo = jest.fn();
    const target = document.createElement("mixin-twice");
    target.onclick = onclick;
    target.onfoo = onfoo;
    click(target);
    expect(onclick.mock.calls.length).toBe(1);
    expect(onfoo.mock.calls.length).toBe(1);
  });

  test("explodes in a controlled fashion when the first argument goes MIA", () => {
    expect(() => onEventMixin()).toThrow(TypeError);
  });

  test("explodes in a controlled fashion when the second argument is a not an iterable, non-string event list", () => {
    expect(() =>
      onEventMixin(class TestElement extends HTMLElement {})
    ).toThrow(TypeError);
    expect(() =>
      onEventMixin(class TestElement extends HTMLElement {}, null)
    ).toThrow(TypeError);
    expect(() =>
      onEventMixin(class TestElement extends HTMLElement {}, undefined)
    ).toThrow(TypeError);
    expect(() =>
      onEventMixin(class TestElement extends HTMLElement {}, "hello")
    ).toThrow(TypeError);
    expect(() =>
      onEventMixin(class TestElement extends HTMLElement {}, 42)
    ).toThrow(TypeError);
  });

  test("does not do anything with an empty event name list", () => {
    const Ctor = class extends HTMLElement {};
    expect(onEventMixin(Ctor, [])).toBe(Ctor);
  });
});