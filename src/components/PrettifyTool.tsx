import { useState } from "react";
import { Check, Clipboard, Eraser, Sparkles } from "lucide-react";
import { format as formatSql } from "sql-formatter";

import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";

type Format = "JSON" | "YAML" | "SQL" | "HTML" | "CSS" | "Markdown";

const FORMATS: Format[] = ["JSON", "YAML", "SQL", "HTML", "CSS", "Markdown"];

const PLACEHOLDERS: Record<Format, string> = {
  JSON: '{"name":"Dev Toolbox","tools":["Base64","Checksum"]}',
  YAML: "name: Dev Toolbox\ntools:\n  - Base64\n  - Checksum",
  SQL: "select id,name from users where active=true order by name;",
  HTML: "<main><h1>Dev Toolbox</h1><p>Browser utilities</p></main>",
  CSS: ".toolbox{display:flex;color:var(--foreground)}",
  Markdown: "# Dev Toolbox\n\n- Base64\n- Checksum",
};

async function prettifySource(source: string, format: Format) {
  if (format === "SQL") {
    return formatSql(source, {
      language: "sql",
      keywordCase: "upper",
      tabWidth: 2,
    });
  }

  const prettier = await import("prettier/standalone");
  let parser = "";
  let plugins = [];

  if (format === "JSON") {
    const [babelPlugin, estreePlugin] = await Promise.all([
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]);
    parser = "json-stringify";
    plugins = [babelPlugin.default, estreePlugin.default];
  } else if (format === "YAML") {
    const yamlPlugin = await import("prettier/plugins/yaml");
    parser = "yaml";
    plugins = [yamlPlugin.default];
  } else if (format === "HTML") {
    const htmlPlugin = await import("prettier/plugins/html");
    parser = "html";
    plugins = [htmlPlugin.default];
  } else if (format === "CSS") {
    const postcssPlugin = await import("prettier/plugins/postcss");
    parser = "css";
    plugins = [postcssPlugin.default];
  } else {
    const markdownPlugin = await import("prettier/plugins/markdown");
    parser = "markdown";
    plugins = [markdownPlugin.default];
  }

  return prettier.format(source, {
    parser,
    plugins,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
  });
}

export default function PrettifyTool() {
  const [format, setFormat] = useState<Format>("JSON");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function handlePrettify() {
    if (!input) return;

    setIsFormatting(true);
    setError("");
    setIsCopied(false);

    try {
      setOutput(await prettifySource(input, format));
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Unable to format this ${format} input.`,
      );
    } finally {
      setIsFormatting(false);
    }
  }

  function handleFormatChange(nextFormat: Format) {
    setFormat(nextFormat);
    setOutput("");
    setError("");
    setIsCopied(false);
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError("");
    setIsCopied(false);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setIsCopied(true);
  }

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto px-4 py-5 sm:px-6 lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Developer tool
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
          Prettify
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Turn compact or inconsistent source into clean, readable code directly
          in your browser.
        </p>
      </header>

      <div className="w-full min-w-0 border border-border bg-card lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-2" aria-label="Source format">
            {FORMATS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={format === item ? "default" : "outline"}
                onClick={() => handleFormatChange(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!input && !output}
          >
            <Eraser data-icon="inline-start" /> Clear
          </Button>
        </div>

        <div className="grid min-w-0 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
          <div className="min-w-0 space-y-3 border-b border-border p-4 lg:flex lg:min-h-0 lg:flex-col lg:border-r lg:border-b-0 lg:p-5">
            <div className="flex h-7 items-center">
              <label
                htmlFor="prettify-input"
                className="text-xs font-semibold tracking-wider uppercase"
              >
                Input
              </label>
            </div>
            <Textarea
              id="prettify-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setOutput("");
                setError("");
              }}
              placeholder={PLACEHOLDERS[format]}
              aria-invalid={Boolean(error)}
              className="min-h-48 font-mono md:min-h-64 lg:min-h-0 lg:flex-1 lg:resize-none"
            />
            {error && (
              <p
                role="alert"
                className="max-h-20 overflow-auto text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <div className="min-w-0 space-y-3 p-4 lg:flex lg:min-h-0 lg:flex-col lg:p-5">
            <div className="flex h-7 items-center justify-between gap-3">
              <label
                htmlFor="prettify-output"
                className="text-xs font-semibold tracking-wider uppercase"
              >
                Formatted {format}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                disabled={!output}
              >
                {isCopied ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Clipboard data-icon="inline-start" />
                )}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Textarea
              id="prettify-output"
              value={output}
              readOnly
              placeholder="Formatted output will appear here…"
              className="min-h-48 font-mono md:min-h-64 lg:min-h-0 lg:flex-1 lg:resize-none"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-4 md:px-5">
          <Button
            type="button"
            onClick={handlePrettify}
            disabled={!input || isFormatting}
          >
            <Sparkles data-icon="inline-start" />
            {isFormatting ? "Formatting…" : `Prettify ${format}`}
          </Button>
        </div>
      </div>
    </section>
  );
}
