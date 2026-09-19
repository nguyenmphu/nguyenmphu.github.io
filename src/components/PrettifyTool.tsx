import { useState } from "react";
import { Check, Clipboard, Eraser, Sparkles } from "lucide-react";
import { format as formatSql } from "sql-formatter";
import { Plugin } from "prettier";
import {
  Alert,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";

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
  let parser: string;
  let plugins: Plugin[];

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
    <Stack gap="lg" h="100%" style={{ overflowY: "auto" }}>
      <Stack gap={4}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={2}>Developer tool</Text>
        <Title order={1}>Prettify</Title>
        <Text c="dimmed" maw={720}>
          Turn compact or inconsistent source into clean, readable code directly
          in your browser.
        </Text>
      </Stack>

      <Paper withBorder style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Group justify="space-between" p="md">
          <SegmentedControl
            aria-label="Source format"
            value={format}
            onChange={(value) => handleFormatChange(value as Format)}
            data={FORMATS}
          />
          <Button
            variant="subtle"
            color="gray"
            leftSection={<Eraser size={16} />}
            onClick={handleClear}
            disabled={!input && !output}
          >
            Clear
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" p="md" style={{ flex: 1, minHeight: 0, borderTop: "1px solid var(--mantine-color-default-border)" }}>
          <Stack gap="xs" h="100%">
            <Group h={30} align="center">
              <Text size="sm" fw={500}>Input</Text>
            </Group>
            <Textarea
              id="prettify-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setOutput("");
                setError("");
              }}
              placeholder={PLACEHOLDERS[format]}
              style={{ flex: 1 }}
              styles={{ root: { display: "flex", flex: 1, flexDirection: "column" }, wrapper: { flex: 1 }, input: { height: "100%", minHeight: 240, resize: "none", fontFamily: "monospace" } }}
            />
            {error && <Alert color="red">{error}</Alert>}
          </Stack>

          <Stack gap="xs" h="100%">
            <Group h={30} justify="space-between" align="center">
              <Text size="sm" fw={500}>Formatted {format}</Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={isCopied ? <Check size={14} /> : <Clipboard size={14} />}
                onClick={handleCopy}
                disabled={!output}
              >
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </Group>
            <Textarea
              id="prettify-output"
              value={output}
              readOnly
              placeholder="Formatted output will appear here…"
              style={{ flex: 1 }}
              styles={{ root: { display: "flex", flex: 1, flexDirection: "column" }, wrapper: { flex: 1 }, input: { height: "100%", minHeight: 240, resize: "none", fontFamily: "monospace" } }}
            />
          </Stack>
        </SimpleGrid>

        <Group p="md" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
          <Button
            onClick={handlePrettify}
            disabled={!input || isFormatting}
            loading={isFormatting}
            leftSection={!isFormatting ? <Sparkles size={16} /> : undefined}
          >
            {isFormatting ? "Formatting…" : `Prettify ${format}`}
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
