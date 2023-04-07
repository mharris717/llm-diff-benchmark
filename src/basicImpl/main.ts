import fs from "fs";
import { registerContestant } from "../benchmark";
import { SimplePrompt } from "./prompt";

const invoke = async (path: string, goal: string) => {
  console.log("Goal", goal);
  const srcFile = `${path}/src/widget.ts`;
  const body = fs.readFileSync(srcFile).toString();
  const prompt = SimplePrompt.withStandardInstructions({
    goal,
    "src/widget.js": body,
  });
  const code = await prompt.askForCode();
  fs.writeFileSync(srcFile, code);
};

function main() {
  console.log("Starting");
  return registerContestant(invoke);
}

if (require.main === module) {
  main();
}
