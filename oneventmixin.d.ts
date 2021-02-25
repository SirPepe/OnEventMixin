declare module "@sirpepe/oneventmixin" {
  type TupleToUnion<T extends string[]> = T[number];

  type Mixin<EventNames extends string> = {
    [EventName in EventNames as `on${EventName}`]: (event: Event) => any;
  };

  type AnyConstructor = { new (...args: any[]): any };

  type ExtendCtor<Ctor extends AnyConstructor, Events extends string> = {
    new(...args: ConstructorParameters<Ctor>): InstanceType<Ctor> & Mixin<Events>;
  }

  export default function OnEventMixin<
    Ctor extends AnyConstructor,
    Events extends string
  >(target: Ctor, events: Events[]): ExtendCtor<Ctor, Events>;
}
