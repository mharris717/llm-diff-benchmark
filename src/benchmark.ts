import childProcess from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const cases: BenchmarkCase[] = [
  {
    goal: "Rename Widget#price to Widget#dollarPrice",
  },
  {
    goal: "Add a new Widget#isGreen method that returns true if the widget's color is green",
  },
];

interface BenchmarkCase {
  goal: string;
  testName?: string; // if testName is missing, testName and goal are the same
}

type Invoke = (sourcePath: string, userPrompt: string) => Promise<void>;

// const widgetPath = "/Users/mharris717/code/orig/diff-benchmark-widget-repo";

// set a const for widgets directory based on path of this file
// const baseWidgetsPath = path.join(__dirname, "..", "widgets");

function randInt() {
  return Math.floor(Math.random() * 1000000000000);
}

function freshCopyOfSelf() {
  const root = path.join(os.tmpdir(), `${randInt()}`);
  fs.mkdirSync(root);
  const self = path.join(__dirname, "..", "..");
  childProcess.execSync(`cp -r ${self} ${root}`);
  return path.join(root, "llm-diff-benchmark");
}

class RunBenchmark {
  tmpWidgetsPath: string;

  constructor(
    readonly benchmarkCase: BenchmarkCase,
    readonly invoke: Invoke,
    readonly sourceRepoPath: string
  ) {
    this.tmpWidgetsPath = path.join(freshCopyOfSelf(), "widgets");
  }

  async run() {
    await this.invoke(this.tmpWidgetsPath, this.benchmarkCase.goal);
    const res = this.runTests();
    return res;
  }

  async runTests() {
    try {
      childProcess.execSync(
        `cd ${this.tmpWidgetsPath} && npm install && npm run test -- --run --testNamePattern "${this.benchmarkCase.goal}"`
      );
      return true;
    } catch {
      return false;
    }
  }
}

class RunBenchmarks {
  constructor(
    readonly benchmarkCases: BenchmarkCase[],
    readonly invoke: Invoke,
    readonly sourceRepoPath: string
  ) {}

  async run() {
    const results: { [k: string]: boolean } = {};
    for (const benchmarkCase of this.benchmarkCases) {
      const runBenchmark = new RunBenchmark(
        benchmarkCase,
        this.invoke,
        this.sourceRepoPath
      );
      const result = await runBenchmark.run();
      results[benchmarkCase.goal] = result;
    }
    return results;
  }
}

export async function registerContestant(invoke: Invoke) {
  const runner = new RunBenchmarks(cases, invoke, "dfgd");
  const results = await runner.run();
  console.log("results", results);
}

function replaceInFile(f: string, orig: string, newStr: string) {
  let body = fs.readFileSync(f).toString();
  for (let i = 0; i < 20; i++) {
    body = body.replace(orig, newStr);
  }
  fs.writeFileSync(f, body);
}

function main() {
  registerContestant(async (sourcePath, userPrompt) => {
    console.log("userPrompt", userPrompt);
    const f = `${sourcePath}/src/widget.ts`;
    replaceInFile(f, "price", "dollarPrice");
  });
}

if (require.main === module) {
  main();
}
