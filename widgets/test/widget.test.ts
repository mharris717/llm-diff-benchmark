import { describe, it, expect } from "vitest";
import { Widget } from "../src/widget";

describe("Widget", () => {
  it("exists", () => {
    const w = new Widget(10, "red");
    expect(w.price).toEqual(10);
  });

  it("Rename Widget#price to Widget#dollarPrice", () => {
    const w = new Widget(10, "red") as any;
    expect(w.dollarPrice).toEqual(10);
  });

  it("Add a new Widget#isGreen method that returns true if the widget's color is green", () => {
    const w = new Widget(10, "green") as any;
    expect(w.isGreen()).toEqual(true);
  });
});
