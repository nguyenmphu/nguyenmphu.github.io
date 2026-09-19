import { useState } from "react";
import { ArrowDownUp, Check, Clipboard, Eraser } from "lucide-react";
import {
  ActionIcon,
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

type Mode = "encode" | "decode";

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64(value: string) {
  const normalizedValue = value.replace(/\s/g, "");
  const binary = atob(normalizedValue);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const isEncoding = mode === "encode";

  function handleConvert() {
    setError("");
    setIsCopied(false);

    if (!input) {
      setOutput("");
      return;
    }

    try {
      setOutput(isEncoding ? encodeBase64(input) : decodeBase64(input));
    } catch {
      setOutput("");
      setError("That is not valid Base64-encoded UTF-8 text.");
    }
  }

  function handleSwap() {
    setMode((currentMode) => (currentMode === "encode" ? "decode" : "encode"));
    setInput(output);
    setOutput(input);
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
        <Title order={1}>Base64</Title>
        <Text c="dimmed" maw={720}>
          Encode plain text to Base64 or decode Base64 back to UTF-8 text.
          Everything stays in your browser.
        </Text>
      </Stack>

      <Paper
        withBorder
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Group justify="space-between" p="md">
          <SegmentedControl
            aria-label="Conversion mode"
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            data={[
              { label: "Encode", value: "encode" },
              { label: "Decode", value: "decode" },
            ]}
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

        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing="md"
          p="md"
          style={{
            flex: 1,
            minHeight: 0,
            borderTop: "1px solid var(--mantine-color-default-border)",
          }}
        >
          <Stack gap="xs" h="100%">
            <Group h={30} align="center">
              <Text size="sm" fw={500}>
                {isEncoding ? "Plain text" : "Base64"}
              </Text>
            </Group>
            <Textarea
              id="base64-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                isEncoding ? "Enter text to encode…" : "Paste Base64 to decode…"
              }
              error={error || undefined}
              style={{ flex: 1 }}
              styles={{
                root: { display: "flex", flex: 1, flexDirection: "column" },
                wrapper: { flex: 1 },
                input: {
                  height: "100%",
                  minHeight: 240,
                  resize: "none",
                  fontFamily: "monospace",
                },
              }}
            />
          </Stack>

          <Stack gap="xs" h="100%">
            <Group h={30} justify="space-between" align="center">
              <Text size="sm" fw={500}>
                {isEncoding ? "Base64" : "Plain text"}
              </Text>
              <Button
                variant="subtle"
                size="xs"
                leftSection={
                  isCopied ? <Check size={14} /> : <Clipboard size={14} />
                }
                onClick={handleCopy}
                disabled={!output}
              >
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </Group>
            <Textarea
              id="base64-output"
              value={output}
              readOnly
              placeholder="The result will appear here…"
              style={{ flex: 1 }}
              styles={{
                root: { display: "flex", flex: 1, flexDirection: "column" },
                wrapper: { flex: 1 },
                input: {
                  height: "100%",
                  minHeight: 240,
                  resize: "none",
                  fontFamily: "monospace",
                },
              }}
            />
          </Stack>
        </SimpleGrid>

        {error && (
          <Alert color="red" m="md">
            {error}
          </Alert>
        )}
        <Group
          p="md"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <ActionIcon
            variant="default"
            size="lg"
            onClick={handleSwap}
            aria-label="Swap input and output"
          >
            <ArrowDownUp size={18} />
          </ActionIcon>
          <Button onClick={handleConvert} disabled={!input}>
            {isEncoding ? "Encode to Base64" : "Decode Base64"}
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
