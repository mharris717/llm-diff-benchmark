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

function randInt() {
  return Math.floor(Math.random() * 1000000000000);
}

function selfPath() {
  if (__filename.endsWith(".ts")) {
    return path.join(__dirname, "..");
  } else {
    return path.join(__dirname, "..", "..");
  }
}

function freshCopyOfSelf() {
  console.log("Creating fresh copy");
  const root = path.join(os.tmpdir(), `${randInt()}`);
  fs.mkdirSync(root);
  const self = selfPath();
  childProcess.execSync(`cp -r ${self} ${root}`);
  childProcess.execSync(
    `mv ${root}/diff-benchmark ${root}/llm-diff-benchmark || true`
  );
  const res = path.join(root, "llm-diff-benchmark");
  console.log(`Created fresh copy at ${res}`);
  return res;
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

function main() {
  function replaceInFile(f: string, orig: string, newStr: string) {
    let body = fs.readFileSync(f).toString();
    for (let i = 0; i < 20; i++) {
      body = body.replace(orig, newStr);
    }
    fs.writeFileSync(f, body);
  }

  registerContestant(async (sourcePath, userPrompt) => {
    console.log("userPrompt", userPrompt);
    const f = `${sourcePath}/src/widget.ts`;
    replaceInFile(f, "price", "dollarPrice");
  });
}

if (require.main === module) {
  main();
}
