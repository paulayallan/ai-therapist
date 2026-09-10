/**
 * Offline verification: syntax, local import resolution, and named-export
 * agreement across the whole source tree. Not a substitute for `tsc`, but it
 * catches the failure modes that survive a careful read.
 *
 *   node scripts/verify.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const files = [...walk(SRC), join(ROOT, "middleware.ts"), join(ROOT, "next.config.ts")].filter(
  existsSync,
);

const problems = [];
const exportsByFile = new Map();

// Pass 1 — parse, and collect what each module exports.
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

  const diagnostics = source.parseDiagnostics ?? [];
  for (const diagnostic of diagnostics) {
    const { line, character } = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    problems.push(
      `SYNTAX ${relative(ROOT, file)}:${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        " ",
      )}`,
    );
  }

  const names = new Set();
  const visit = (node) => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      names.add(node.name.text);
      if (node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) names.add("default");
    }
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
    if (ts.isExportAssignment(node)) names.add("default");
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) names.add(element.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  exportsByFile.set(file, names);
}

function resolveLocal(specifier, importer) {
  const base = specifier.startsWith("@/")
    ? join(SRC, specifier.slice(2))
    : resolve(dirname(importer), specifier);

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// Pass 2 — every local import must resolve, and every named import must exist.
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const target = resolveLocal(specifier, file);
        if (!target) {
          problems.push(`UNRESOLVED ${relative(ROOT, file)} → "${specifier}"`);
        } else if (ts.isImportDeclaration(node) && node.importClause?.namedBindings) {
          const bindings = node.importClause.namedBindings;
          if (ts.isNamedImports(bindings)) {
            const available = exportsByFile.get(target) ?? new Set();
            for (const element of bindings.elements) {
              const name = (element.propertyName ?? element.name).text;
              if (!available.has(name)) {
                problems.push(
                  `MISSING EXPORT ${relative(ROOT, file)} imports "${name}" from "${specifier}"`,
                );
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

// Pass 3 — server-only modules must never be reachable from a client component.
const CLIENT_ONLY_GUARD = ["@/lib/data", "@/lib/ai/", "@/lib/supabase/server", "@/lib/supabase/admin"];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!/^["']use client["']/m.test(text)) continue;
  for (const guarded of CLIENT_ONLY_GUARD) {
    // Type-only imports are erased at build time and are safe.
    const pattern = new RegExp(`import\\s+(?!type\\s)[^;]*from\\s+["']${guarded}`, "m");
    if (pattern.test(text)) {
      problems.push(`SERVER IMPORT IN CLIENT ${relative(ROOT, file)} → ${guarded}`);
    }
  }
}

console.log(`Checked ${files.length} source files.`);
if (problems.length === 0) {
  console.log("No problems found.");
} else {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const problem of problems) console.log("  " + problem);
  process.exitCode = 1;
}
