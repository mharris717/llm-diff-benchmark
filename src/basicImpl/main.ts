import fs from "fs";
import { registerContestant } from "../benchmark";
import { extractFromTicks, LINES, SimplePrompt } from "./prompt";

const invoke = async (path: string, goal: string) => {
  console.log("Goal", goal);
  const body = fs.readFileSync(`${path}/src/widget.ts`).toString();
  const prompt = new SimplePrompt({
    lines: LINES,
    data: {
      goal,
      "widget.js": body,
    },
  });
  const reply = await prompt.ask();
  const code = extractFromTicks(reply);
  fs.writeFileSync(`${path}/src/widget.ts`, code);
};

function main() {
  console.log("Starting");
  return registerContestant(invoke);
}

if (require.main === module) {
  main();
}
