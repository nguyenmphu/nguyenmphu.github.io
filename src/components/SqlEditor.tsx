import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { sql } from "@codemirror/lang-sql"
import { EditorView } from "@codemirror/view"
import { Box } from "@mantine/core"
import { PointerEvent, useEffect, useRef, useState } from "react"

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: Record<string, string[]>
}

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
  },
  ".cm-scroller": {
    overflow: "auto",
    scrollbarGutter: "stable",
  },
  ".cm-content": {
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
  },
})

export default function SqlEditor({ value, onChange, schema }: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const [viewport, setViewport] = useState({ top: 0, height: 100 })
  const schemaConfig = schema
    ? Object.fromEntries(
        Object.entries(schema).map(([table, columns]) => [table, columns])
      )
    : undefined

  useEffect(() => {
    const container = containerRef.current
    const scroller = editorRef.current?.view?.scrollDOM
    if (!container || !scroller) return
    const observedScroller = scroller

    let animationFrame = 0
    function updateMeasurements() {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        editorRef.current?.view?.requestMeasure()
        const scrollHeight = Math.max(observedScroller.scrollHeight, 1)
        setViewport({
          top: (observedScroller.scrollTop / scrollHeight) * 100,
          height: Math.min(100, (observedScroller.clientHeight / scrollHeight) * 100),
        })
      })
    }

    const resizeObserver = new ResizeObserver(updateMeasurements)

    resizeObserver.observe(container)
    observedScroller.addEventListener("scroll", updateMeasurements, { passive: true })
    animationFrame = requestAnimationFrame(updateMeasurements)

    return () => {
      resizeObserver.disconnect()
      observedScroller.removeEventListener("scroll", updateMeasurements)
      cancelAnimationFrame(animationFrame)
    }
  }, [value])

  const sourceLines = value.split("\n")
  const minimapLines = sourceLines.length <= 300
    ? sourceLines
    : Array.from(
        { length: 300 },
        (_, index) => sourceLines[Math.floor((index / 300) * sourceLines.length)],
      )
  const longestLine = Math.max(1, ...minimapLines.map((line) => line.length))

  function handleMinimapPointer(event: PointerEvent<HTMLDivElement>) {
    const view = editorRef.current?.view
    if (!view) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
    const documentPosition = Math.round(ratio * view.state.doc.length)
    view.dispatch({
      effects: EditorView.scrollIntoView(documentPosition, { y: "center" }),
    })
  }

  return (
    <Box ref={containerRef} h="100%" style={{ display: "flex", minWidth: 0 }}>
      <Box h="100%" style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          style={{ height: "100%" }}
          theme={baseTheme}
          extensions={[
            sql({
              schema: schemaConfig,
              upperCaseKeywords: true,
            }),
          ]}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            indentOnInput: true,
          }}
        />
      </Box>

      <Box
        role="scrollbar"
        aria-label="SQL document minimap"
        aria-orientation="vertical"
        w={92}
        h="100%"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          handleMinimapPointer(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            handleMinimapPointer(event)
          }
        }}
        style={{
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
          cursor: "pointer",
          borderLeft: "1px solid var(--mantine-color-default-border)",
          background: "var(--mantine-color-gray-0)",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {minimapLines.map((line, index) => (
          <Box
            key={`${index}-${line.length}`}
            h={1}
            bg="var(--mantine-color-gray-5)"
            style={{
              position: "absolute",
              top: `${((index + 0.5) / Math.max(minimapLines.length, 1)) * 100}%`,
              left: 6,
              width: `${Math.max(5, (line.length / longestLine) * 78)}%`,
              opacity: line.trim() ? 0.65 : 0.18,
            }}
          />
        ))}
        <Box
          style={{
            position: "absolute",
            top: `${viewport.top}%`,
            right: 2,
            left: 2,
            height: `${viewport.height}%`,
            minHeight: 12,
            pointerEvents: "none",
            border: "1px solid var(--mantine-primary-color-filled)",
            borderRadius: 2,
            background: "var(--mantine-primary-color-light)",
            opacity: 0.55,
          }}
        />
      </Box>
    </Box>
  )
}
