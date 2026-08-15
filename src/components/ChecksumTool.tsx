import { ChangeEvent, useState } from 'react'
import { Check, Clipboard, FileText, Type } from 'lucide-react'

import { Button } from './ui/button.tsx'
import { Input } from './ui/input.tsx'
import { Textarea } from './ui/textarea.tsx'

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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
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
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto px-4 py-5 sm:px-6 lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Developer tool</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">Checksum</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Generate a digest from text or a local file. Files are processed entirely in your browser.
        </p>
      </header>

      <div className="w-full min-w-0 border border-border bg-card lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="shrink-0 border-b border-border p-4 md:p-5">
          <p className="mb-3 text-xs font-semibold tracking-wider uppercase">Algorithm</p>
          <div className="flex flex-wrap gap-2">
            {ALGORITHMS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={algorithm === item ? 'default' : 'outline'}
                onClick={() => {
                  setAlgorithm(item)
                  setChecksum('')
                }}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <div className="mb-4 flex gap-1 bg-muted p-1 sm:w-fit">
            <Button type="button" size="sm" variant={inputMode === 'text' ? 'default' : 'ghost'} onClick={() => handleModeChange('text')}>
              <Type data-icon="inline-start" /> Text
            </Button>
            <Button type="button" size="sm" variant={inputMode === 'file' ? 'default' : 'ghost'} onClick={() => handleModeChange('file')}>
              <FileText data-icon="inline-start" /> File
            </Button>
          </div>

          {inputMode === 'text' ? (
            <div className="lg:flex lg:min-h-0 lg:flex-1">
              <Textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setChecksum('')
                }}
                placeholder="Enter text to calculate its checksum…"
                className="min-h-48 font-mono lg:min-h-0 lg:flex-1 lg:resize-none"
              />
            </div>
          ) : (
            <div className="border border-dashed border-input p-6 lg:grid lg:min-h-0 lg:flex-1 lg:place-content-center">
              <div className="w-full max-w-xl">
                <Input type="file" onChange={handleFileChange} className="cursor-pointer" />
                <p className="mt-3 text-xs text-muted-foreground">
                  {file ? `${file.name} · ${formatFileSize(file.size)}` : 'Choose a file from your device.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border p-4 md:p-5">
          <Button type="button" onClick={handleCalculate} disabled={!hasInput || isCalculating}>
            {isCalculating ? 'Calculating…' : `Generate ${algorithm}`}
          </Button>
          {checksum && (
            <div className="flex min-w-0 flex-1 items-center gap-2 border border-border bg-muted/40 px-3 py-2">
              <code className="min-w-0 flex-1 overflow-x-auto text-xs">{checksum}</code>
              <Button type="button" variant="ghost" size="icon-xs" onClick={handleCopy} aria-label="Copy checksum">
                {isCopied ? <Check /> : <Clipboard />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
