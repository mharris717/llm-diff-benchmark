import { Configuration, OpenAIApi } from "openai";
import { myLog, ticked } from "./util";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface PromptOps {
  lines: string[];
  data: { [k: string]: string };
}

export class SimplePrompt {
  lines: string[];
  data: { [k: string]: string };
  constructor({ lines, data }: PromptOps) {
    this.lines = lines;
    this.data = data;
  }
  toString() {
    const lineStr = this.lines.join("\n\n");
    const dataStr = Object.entries(this.data)
      .map(([k, v]) => `${k}:\n${ticked(v)}`)
      .join("\n\n");
    return `${lineStr}\n\n${dataStr}`;
  }

  ask() {
    return ask(this);
  }

  async askForCode() {
    const resp = await this.ask();
    return extractFromTicks(resp);
  }

  static withStandardInstructions(data: { [k: string]: string }) {
    return new SimplePrompt({ lines: LINES, data });
  }
}

// If resp has a block of code between 3 backticks, return the code
function extractFromTicks(resp: string) {
  const r = /```(.+)```\s*$/ms;
  const m = resp.match(r);
  if (m) {
    return m[1];
  }
  throw new Error(`No code found in response\n\n${resp}`);
}

const LINES = [
  "I want to make a change to my code. I will provide you with a description of the change, and the relevant files. You will provide me with the modified code.",
  "Reply with the modified full contents of the file that makes the change requested.",
  `Your reply should contain exactly the modified full contents of the file, and nothing else. Don't supply a label. Every single character in your reply needs to be valid code`,
];

export async function ask(prompt: SimplePrompt): Promise<string> {
  myLog("Asking GPT for updated code based on comment");
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt.toString(),
    max_tokens: 2000,
    temperature: 0,
  });
  const res = completion.data.choices[0].text;
  if (!res) {
    throw new Error("No response from OpenAI");
  }
  return res;
}
