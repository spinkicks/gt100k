import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const FORBIDDEN_IMPORTS = ["three", "react"] as const;
const FORBIDDEN_VIEW_FIELDS = new Set([
  "price",
  "currency",
  "score",
  "confidence",
  "passionScore",
  "rank",
  "percentile",
  "verdict",
  "outOf",
]);
const FIXED_LABEL = /you are (a|an|the) /i;

const sourceFiles = readdirSync(new URL("../src/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(new URL(`../src/${entry.name}`, import.meta.url), "utf8"),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const parsedSources = sourceFiles.map(({ name, source }) => ({
  name,
  source,
  tree: ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
}));

const locationOf = (name: string, tree: ts.SourceFile, node: ts.Node): string => {
  const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
  return `${name}:${line + 1}`;
};

const visit = (tree: ts.SourceFile, inspect: (node: ts.Node) => void): void => {
  const walk = (node: ts.Node): void => {
    inspect(node);
    ts.forEachChild(node, walk);
  };

  walk(tree);
};

const propertyNameOf = (node: ts.PropertySignature | ts.PropertyDeclaration): string | null => {
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }

  return null;
};

describe("interest-lab view static guardrails", () => {
  it("contains no Math.random call", () => {
    const violations: string[] = [];

    for (const { name, tree } of parsedSources) {
      visit(tree, (node) => {
        if (
          ts.isPropertyAccessExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "Math" &&
          node.name.text === "random"
        ) {
          violations.push(locationOf(name, tree, node));
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("imports no framework or GPU runtime", () => {
    const violations: string[] = [];

    for (const { name, tree } of parsedSources) {
      visit(tree, (node) => {
        if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
          return;
        }

        const imported = node.moduleSpecifier.text;
        if (
          FORBIDDEN_IMPORTS.includes(imported as (typeof FORBIDDEN_IMPORTS)[number]) ||
          imported.startsWith("@react-three/")
        ) {
          violations.push(`${locationOf(name, tree, node)} imports ${imported}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("declares no forbidden field in a view type", () => {
    const violations: string[] = [];

    for (const { name, tree } of parsedSources) {
      visit(tree, (node) => {
        if (!ts.isPropertySignature(node) && !ts.isPropertyDeclaration(node)) {
          return;
        }

        const propertyName = propertyNameOf(node);
        if (propertyName && FORBIDDEN_VIEW_FIELDS.has(propertyName)) {
          violations.push(`${locationOf(name, tree, node)} declares ${propertyName}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("authors no fixed-label copy literal", () => {
    const violations: string[] = [];

    for (const { name, tree } of parsedSources) {
      visit(tree, (node) => {
        if (
          (ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateHead(node) ||
            ts.isTemplateMiddle(node) ||
            ts.isTemplateTail(node)) &&
          FIXED_LABEL.test(node.text)
        ) {
          violations.push(`${locationOf(name, tree, node)} emits ${JSON.stringify(node.text)}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
