declare module "oneventmixin" {
  export default function OnEventMixin<
    Ctor extends { new (...args: any[]): any }
  >(
    targetConstructor: Ctor,
    events: Iterable<string>
  ): Ctor;
}





