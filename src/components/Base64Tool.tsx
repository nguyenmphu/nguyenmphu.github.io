import { useState } from 'react'
import { ArrowDownUp, Check, Clipboard, Eraser } from 'lucide-react'

import { Button } from './ui/button.tsx'
import { Textarea } from './ui/textarea.tsx'

type Mode = 'encode' | 'decode'

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function decodeBase64(value: string) {
  const normalizedValue = value.replace(/\s/g, '')
  const binary = atob(normalizedValue)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const isEncoding = mode === 'encode'

  function handleConvert() {
    setError('')
    setIsCopied(false)

    if (!input) {
      setOutput('')
      return
    }

    try {
      setOutput(isEncoding ? encodeBase64(input) : decodeBase64(input))
    } catch {
      setOutput('')
      setError('That is not valid Base64-encoded UTF-8 text.')
    }
  }

  function handleSwap() {
    setMode((currentMode) => currentMode === 'encode' ? 'decode' : 'encode')
    setInput(output)
    setOutput(input)
    setError('')
    setIsCopied(false)
  }

  function handleClear() {
    setInput('')
    setOutput('')
    setError('')
    setIsCopied(false)
  }

  async function handleCopy() {
    if (!output) return

    await navigator.clipboard.writeText(output)
    setIsCopied(true)
  }

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto px-4 py-5 sm:px-6 lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Developer tool</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">Base64</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Encode plain text to Base64 or decode Base64 back to UTF-8 text. Everything stays in your browser.
        </p>
      </header>

      <div className="w-full min-w-0 border border-border bg-card lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex gap-1 bg-muted p-1" aria-label="Conversion mode">
            <Button
              type="button"
              size="sm"
              variant={isEncoding ? 'default' : 'ghost'}
              onClick={() => setMode('encode')}
            >
              Encode
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isEncoding ? 'default' : 'ghost'}
              onClick={() => setMode('decode')}
            >
              Decode
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!input && !output}>
            <Eraser data-icon="inline-start" />
            Clear
          </Button>
        </div>

        <div className="grid min-w-0 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3 p-4 lg:flex lg:min-h-0 lg:flex-col lg:p-5">
            <div className="flex h-7 items-center">
              <label htmlFor="base64-input" className="text-xs font-semibold tracking-wider uppercase">
                {isEncoding ? 'Plain text' : 'Base64'}
              </label>
            </div>
            <Textarea
              id="base64-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isEncoding ? 'Enter text to encode…' : 'Paste Base64 to decode…'}
              aria-invalid={Boolean(error)}
              className="min-h-48 font-mono md:min-h-64 lg:min-h-0 lg:flex-1 lg:resize-none"
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex items-center justify-center border-y border-border p-3 lg:border-x lg:border-y-0">
            <Button type="button" variant="outline" size="icon" onClick={handleSwap} aria-label="Swap input and output">
              <ArrowDownUp className="lg:rotate-90" />
            </Button>
          </div>

          <div className="min-w-0 space-y-3 p-4 lg:flex lg:min-h-0 lg:flex-col lg:p-5">
            <div className="flex h-7 items-center justify-between gap-3">
              <label htmlFor="base64-output" className="text-xs font-semibold tracking-wider uppercase">
                {isEncoding ? 'Base64' : 'Plain text'}
              </label>
              <Button type="button" variant="ghost" size="xs" onClick={handleCopy} disabled={!output}>
                {isCopied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Textarea
              id="base64-output"
              value={output}
              readOnly
              placeholder="The result will appear here…"
              className="min-h-48 font-mono md:min-h-64 lg:min-h-0 lg:flex-1 lg:resize-none"
            />
          </div>
        </div>

        <div className="border-t border-border p-4 md:px-6">
          <Button type="button" onClick={handleConvert} disabled={!input}>
            {isEncoding ? 'Encode to Base64' : 'Decode Base64'}
          </Button>
        </div>
      </div>
    </section>
  )
}
