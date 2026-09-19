import { useState } from 'react'
import { Check, Clipboard, FileText, Type } from 'lucide-react'
import {
  ActionIcon,
  Box,
  Button,
  Code,
  FileInput,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
type InputMode = 'text' | 'file'

const ALGORITHMS: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function wordsToHex(words: number[]) {
  return words.map((word) => {
    let result = ''

    for (let index = 0; index < 4; index += 1) {
      result += ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, '0')
    }

    return result
  }).join('')
}

function md5(bytes: Uint8Array) {
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  const bitLength = bytes.length * 8
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true)

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]
  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) | 0,
  )

  let a0 = 0x67452301
  let b0 = 0xefcdab89 | 0
  let c0 = 0x98badcfe | 0
  let d0 = 0x10325476

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) =>
      view.getInt32(offset + index * 4, true),
    )
    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let mixed: number
      let wordIndex: number

      if (index < 16) {
        mixed = (b & c) | (~b & d)
        wordIndex = index
      } else if (index < 32) {
        mixed = (d & b) | (~d & c)
        wordIndex = (5 * index + 1) % 16
      } else if (index < 48) {
        mixed = b ^ c ^ d
        wordIndex = (3 * index + 5) % 16
      } else {
        mixed = c ^ (b | ~d)
        wordIndex = (7 * index) % 16
      }

      const nextD = d
      d = c
      c = b
      const sum = (a + mixed + constants[index] + words[wordIndex]) | 0
      b = (b + ((sum << shifts[index]) | (sum >>> (32 - shifts[index])))) | 0
      a = nextD
    }

    a0 = (a0 + a) | 0
    b0 = (b0 + b) | 0
    c0 = (c0 + c) | 0
    d0 = (d0 + d) | 0
  }

  return wordsToHex([a0, b0, c0, d0])
}

async function createChecksum(bytes: Uint8Array, algorithm: Algorithm) {
  if (algorithm === 'MD5') return md5(bytes)

  const digest = await crypto.subtle.digest(algorithm, bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ChecksumTool() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256')
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [checksum, setChecksum] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const hasInput = inputMode === 'text' ? Boolean(text) : Boolean(file)

  function handleModeChange(mode: InputMode) {
    setInputMode(mode)
    setChecksum('')
    setIsCopied(false)
  }

  function handleFileChange(selectedFile: File | null) {
    setFile(selectedFile)
    setChecksum('')
    setIsCopied(false)
  }

  async function handleCalculate() {
    if (!hasInput) return

    setIsCalculating(true)
    setIsCopied(false)

    try {
      const bytes = inputMode === 'text'
        ? new TextEncoder().encode(text)
        : new Uint8Array(await file!.arrayBuffer())
      setChecksum(await createChecksum(bytes, algorithm))
    } finally {
      setIsCalculating(false)
    }
  }

  async function handleCopy() {
    if (!checksum) return
    await navigator.clipboard.writeText(checksum)
    setIsCopied(true)
  }

  return (
    <Stack gap="lg" h="100%" style={{ overflowY: 'auto' }}>
      <Stack gap={4}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={2}>Developer tool</Text>
        <Title order={1}>Checksum</Title>
        <Text c="dimmed" maw={720}>
          Generate a digest from text or a local file. Files are processed entirely in your browser.
        </Text>
      </Stack>

      <Paper withBorder style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack p="md">
          <Text size="sm" fw={600}>Algorithm</Text>
          <SegmentedControl
            value={algorithm}
            onChange={(value) => {
              setAlgorithm(value as Algorithm)
              setChecksum('')
            }}
            data={ALGORITHMS}
          />
        </Stack>

        <Stack p="md" style={{ flex: 1, borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <SegmentedControl
            value={inputMode}
            onChange={(value) => handleModeChange(value as InputMode)}
            data={[
              { label: <Group gap={6}><Type size={15} />Text</Group>, value: 'text' },
              { label: <Group gap={6}><FileText size={15} />File</Group>, value: 'file' },
            ]}
          />

          {inputMode === 'text' ? (
            <Textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setChecksum('')
              }}
              placeholder="Enter text to calculate its checksum…"
              minRows={10}
              autosize
              styles={{ input: { fontFamily: 'monospace' } }}
            />
          ) : (
            <Box p="xl" style={{ border: '1px dashed var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
              <FileInput label="Local file" placeholder="Choose a file from your device" onChange={handleFileChange} />
              {file && <Text size="xs" c="dimmed" mt="xs">{file.name} · {formatFileSize(file.size)}</Text>}
            </Box>
          )}
        </Stack>

        <Group p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Button onClick={handleCalculate} disabled={!hasInput} loading={isCalculating}>
            {isCalculating ? 'Calculating…' : `Generate ${algorithm}`}
          </Button>
          {checksum && (
            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <Code block style={{ flex: 1, overflowX: 'auto' }}>{checksum}</Code>
              <ActionIcon variant="subtle" onClick={handleCopy} aria-label="Copy checksum">
                {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              </ActionIcon>
            </Group>
          )}
        </Group>
      </Paper>
    </Stack>
  )
}
