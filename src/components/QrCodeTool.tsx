import { useState } from 'react'
import { Check, Clipboard, Download, QrCode, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'

import { Button } from './ui/button.tsx'
import { Textarea } from './ui/textarea.tsx'

type ErrorCorrection = 'L' | 'M' | 'Q' | 'H'
type QrSize = 256 | 512 | 1024

const SIZES: QrSize[] = [256, 512, 1024]
const ERROR_LEVELS: ErrorCorrection[] = ['L', 'M', 'Q', 'H']

const ERROR_LABELS: Record<ErrorCorrection, string> = {
  L: 'Low',
  M: 'Medium',
  Q: 'Quartile',
  H: 'High',
}

export default function QrCodeTool() {
  const [text, setText] = useState('')
  const [size, setSize] = useState<QrSize>(512)
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>('M')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  async function handleGenerate() {
    if (!text) return

    setIsGenerating(true)
    setError('')
    setIsCopied(false)

    try {
      setImageUrl(await QRCode.toDataURL(text, {
        errorCorrectionLevel: errorCorrection,
        margin: 2,
        width: size,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      }))
    } catch (caughtError) {
      setImageUrl('')
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to generate this QR code.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleDownload() {
    if (!imageUrl) return

    const link = document.createElement('a')
    link.download = `qr-code-${size}.png`
    link.href = imageUrl
    link.click()
  }

  async function handleCopy() {
    if (!imageUrl) return

    try {
      const blob = await fetch(imageUrl).then((response) => response.blob())
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setIsCopied(true)
      setError('')
    } catch {
      setError('Image copying is not supported by this browser. You can download the PNG instead.')
    }
  }

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto px-4 py-5 sm:px-6 lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Image tool</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">QR Generator</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Turn text, links, or contact details into a downloadable QR code. Generation stays in your browser.
        </p>
      </header>

      <div className="grid w-full min-w-0 border border-border bg-card lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
        <div className="min-w-0 space-y-5 border-b border-border p-4 lg:flex lg:min-h-0 lg:flex-col lg:border-r lg:border-b-0 lg:p-5">
          <div className="space-y-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <label htmlFor="qr-content" className="text-xs font-semibold tracking-wider uppercase">Content</label>
            <Textarea
              id="qr-content"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setImageUrl('')
                setError('')
              }}
              placeholder="Enter text or paste a URL…"
              className="min-h-48 font-mono lg:min-h-0 lg:flex-1 lg:resize-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase">Image size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((item) => (
                  <Button key={item} type="button" size="sm" variant={size === item ? 'default' : 'outline'} onClick={() => setSize(item)}>
                    {item}px
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase">Error correction</p>
              <div className="flex flex-wrap gap-2">
                {ERROR_LEVELS.map((level) => (
                  <Button key={level} type="button" size="sm" variant={errorCorrection === level ? 'default' : 'outline'} onClick={() => setErrorCorrection(level)} title={ERROR_LABELS[level]}>
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button type="button" onClick={handleGenerate} disabled={!text || isGenerating} className="sm:w-fit">
            <Sparkles data-icon="inline-start" />
            {isGenerating ? 'Generating…' : 'Generate QR code'}
          </Button>
        </div>

        <div className="flex min-h-80 flex-col items-center justify-center gap-5 bg-muted/25 p-6">
          {imageUrl ? (
            <>
              <div className="border border-border bg-white p-3 shadow-sm">
                <img src={imageUrl} alt="Generated QR code" className="size-full max-h-80 max-w-80" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {isCopied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
                  {isCopied ? 'Copied' : 'Copy image'}
                </Button>
                <Button type="button" onClick={handleDownload}>
                  <Download data-icon="inline-start" /> Download PNG
                </Button>
              </div>
            </>
          ) : (
            <div className="max-w-xs space-y-3 text-center text-muted-foreground">
              <QrCode className="mx-auto size-16 stroke-1" aria-hidden="true" />
              <p className="text-sm">Your generated QR code will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
