#!/usr/bin/env node

const { ESLint } = require("eslint");
const path = require("path");

function tryParse(d) {
  try {
    return JSON.parse(d);
  } catch (e) {
    return d;
  }
}
const ARGS = {
  ext: "js,ts,jsx,tsx",
  dir: path.join(__dirname, "src"),
  ...process.argv
    .slice(2)
    .map((a) => a.trim())
    .map((d) => (d.match(/--([\w|-|_]+?)=(.+)/) || []).slice(1, 3))
    .filter((arg) => !!arg.length)
    .reduce((p, [k, v]) => ({ ...p, [k]: tryParse(v) }), {}),
};
const { ext, dir, ...rest } = ARGS;
(async function main() {
  const eslint = new ESLint({
    useEslintrc: false,
    extensions: ARGS.ext
      .replace(/\*|\./g, "")
      .split(",")
      .map((ext) => "." + ext),
    baseConfig: {
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 6,
        ecmaFeatures: {
          jsx: true,
        },
      },
      parser: "@typescript-eslint/parser",
      plugins: ["query"],
      rules: {
        "query/query": [
          2,
          {
            queries: {
              "JSXElement[closingElement.name.name='T'][children.0.expression.type='TemplateLiteral']": {
                template:
                  "TemplateLiteral detected in i18n JSX <T> component `${result}...`",
              },
              "CallExpression[callee.name='t'][arguments]:has(TemplateLiteral)": {
                template:
                  "TemplateLiteral detected in i18n t() function `${result.slice(0,45)}...`",
              },
            },
          },
        ],
      },
    },
    overrideConfig: rest,
  });
  const results = await eslint.lintFiles(ARGS.dir);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  console.log(resultText);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
