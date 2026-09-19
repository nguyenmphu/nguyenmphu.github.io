import { useState } from 'react'
import { Check, Clipboard, Download, QrCode, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'
import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Image,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'

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
    <Stack gap="lg" h="100%" style={{ overflowY: 'auto' }}>
      <Stack gap={4}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={2}>Image tool</Text>
        <Title order={1}>QR Generator</Title>
        <Text c="dimmed" maw={720}>
          Turn text, links, or contact details into a downloadable QR code. Generation stays in your browser.
        </Text>
      </Stack>

      <Paper withBorder style={{ flex: 1 }}>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={0} h="100%">
          <Stack p="lg">
            <Textarea
              id="qr-content"
              label="Content"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setImageUrl('')
                setError('')
              }}
              placeholder="Enter text or paste a URL…"
              minRows={10}
              autosize
              styles={{ input: { fontFamily: 'monospace' } }}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Image size</Text>
                <SegmentedControl value={String(size)} onChange={(value) => setSize(Number(value) as QrSize)} data={SIZES.map((item) => ({ label: `${item}px`, value: String(item) }))} />
              </Stack>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Error correction</Text>
                <SegmentedControl value={errorCorrection} onChange={(value) => setErrorCorrection(value as ErrorCorrection)} data={ERROR_LEVELS.map((level) => ({ label: level, value: level }))} />
                <Text size="xs" c="dimmed">{ERROR_LABELS[errorCorrection]}</Text>
              </Stack>
            </SimpleGrid>

            {error && <Alert color="red">{error}</Alert>}

            <Button onClick={handleGenerate} disabled={!text} loading={isGenerating} leftSection={!isGenerating ? <Sparkles size={16} /> : undefined} style={{ alignSelf: 'flex-start' }}>
              {isGenerating ? 'Generating…' : 'Generate QR code'}
            </Button>
          </Stack>

          <Center p="xl" mih={380} bg="var(--mantine-color-default-hover)">
            {imageUrl ? (
              <Stack align="center">
                <Box bg="white" p="sm" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Image src={imageUrl} alt="Generated QR code" w="100%" maw={320} />
                </Box>
                <Group justify="center">
                  <Button variant="default" onClick={handleCopy} leftSection={isCopied ? <Check size={16} /> : <Clipboard size={16} />}>
                  {isCopied ? 'Copied' : 'Copy image'}
                </Button>
                  <Button onClick={handleDownload} leftSection={<Download size={16} />}>
                    Download PNG
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack align="center" c="dimmed">
                <QrCode size={64} strokeWidth={1} aria-hidden="true" />
                <Text size="sm" ta="center">Your generated QR code will appear here.</Text>
              </Stack>
            )}
          </Center>
        </SimpleGrid>
      </Paper>
    </Stack>
  )
}
