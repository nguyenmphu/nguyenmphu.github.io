import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  FileUp,
  Play,
  Plus,
  Table2,
  Trash2,
  X,
} from "lucide-react"
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Center,
  FileButton,
  Flex,
  Group,
  Loader,
  Paper,
  Popover,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core"

import { getDuckDB, getSchema, registerFile, runQuery } from "../lib/duckdb.ts"
import type { QueryResult } from "../lib/duckdb.ts"
import {
  clearFiles,
  deleteFile,
  loadFiles,
  loadTabs,
  saveFile,
  saveTabs,
} from "../lib/persist.ts"
import SqlEditor from "./SqlEditor.tsx"
import ResultsTable from "./ResultsTable.tsx"

interface Tab {
  id: string
  name: string
  query: string
  result: QueryResult | null
  error: string
  isRunning: boolean
}

function createTab(name?: string, query?: string): Tab {
  return {
    id: crypto.randomUUID(),
    name: name ?? "Query 1",
    query: query ?? "",
    result: null,
    error: "",
    isRunning: false,
  }
}

export default function DataTool() {
  const [tabs, setTabs] = useState<Tab[]>(() => [createTab("Query 1")])
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id)
  const [dbState, setDbState] = useState<"loading" | "ready" | "error">("loading")
  const [loadError, setLoadError] = useState("")
  const [schema, setSchema] = useState<Record<string, string[]>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [loadedFiles, setLoadedFiles] = useState<string[]>([])
  const [editorHeight, setEditorHeight] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [tabNameDraft, setTabNameDraft] = useState("")
  const splitPaneRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef({ y: 0, height: 300 })
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  // Init DuckDB + restore persisted data
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await getDuckDB()
        if (cancelled) return

        // Restore files from IndexedDB
        const storedFiles = await loadFiles()
        const db = await getDuckDB()
        for (const f of storedFiles) {
          await db.registerFileBuffer(f.name, new Uint8Array(f.buffer))
        }
        if (cancelled) return

        setDbState("ready")

        // Restore tabs from localStorage
        const savedTabs = loadTabs()
        if (savedTabs && savedTabs.tabs.length > 0) {
          const restored = savedTabs.tabs.map((t) => createTab(t.name, t.query))
          setTabs(restored)
          setActiveTabId(
            restored.find((t) => t.name === savedTabs.activeTabId)?.id
              ?? restored[0].id
          )
        }

        // Load schema
        const s = await getSchema()
        if (!cancelled) {
          setSchema(s)
          setLoadedFiles(storedFiles.map((f) => f.name))
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to initialize DuckDB WASM"
          )
          setDbState("error")
        }
      }
    })()

    return () => { cancelled = true }
  }, [])

  // Persist tabs to localStorage on change
  useEffect(() => {
    if (dbState !== "ready") return
    const serialized = tabs.map((t) => ({ name: t.name, query: t.query }))
    saveTabs(serialized, tabs.find((t) => t.id === activeTabId)?.name ?? "")
  }, [tabs, activeTabId, dbState])

  useEffect(() => {
    if (!isResizing) return

    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = "row-resize"
    document.body.style.userSelect = "none"

    function handlePointerMove(event: PointerEvent) {
      const paneHeight = splitPaneRef.current?.clientHeight ?? 640
      const maximumHeight = Math.max(160, paneHeight - 220)
      const nextHeight = resizeStartRef.current.height
        + event.clientY
        - resizeStartRef.current.y
      setEditorHeight(Math.min(maximumHeight, Math.max(160, nextHeight)))
    }

    function handlePointerUp() {
      setIsResizing(false)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
    }
  }, [isResizing])

  function updateTab(id: string, patch: Partial<Tab>) {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function handleAddTab() {
    const newTab = createTab(`Query ${tabs.length + 1}`)
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  function handleOpenRename(tab: Tab) {
    setActiveTabId(tab.id)
    setTabNameDraft(tab.name)
    setRenamingTabId(tab.id)
  }

  function handleRenameTab() {
    const nextName = tabNameDraft.trim()
    if (!nextName || !renamingTabId) return
    updateTab(renamingTabId, { name: nextName })
    setRenamingTabId(null)
  }

  function handleCloseTab(id: string) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (next.length === 0) {
        const fresh = createTab("Query 1")
        setActiveTabId(fresh.id)
        return [fresh]
      }
      if (id === activeTabId) {
        setActiveTabId(next[Math.max(0, prev.findIndex((t) => t.id === id) - 1)].id)
      }
      return next
    })
  }

  function handleQueryChange(value: string) {
    updateTab(activeTabId, { query: value, error: "" })
  }

  async function handleRun() {
    if (!activeTab.query.trim() || activeTab.isRunning) return

    updateTab(activeTabId, { isRunning: true, error: "", result: null })

    try {
      const result = await runQuery(activeTab.query)
      updateTab(activeTabId, { result, isRunning: false })
      const updatedSchema = await getSchema()
      setSchema(updatedSchema)
    } catch (err) {
      updateTab(activeTabId, {
        error: err instanceof Error ? err.message : "Query failed",
        isRunning: false,
      })
    }
  }

  async function handleFiles(files: FileList | File[]) {
    if (dbState !== "ready") return
    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        await registerFile(file, file.name)
        // Persist to IndexedDB
        const buffer = await file.arrayBuffer()
        await saveFile(file.name, file.type, buffer)
      }
      setLoadedFiles((prev) => [
        ...prev,
        ...Array.from(files).map((f) => f.name).filter((n) => !prev.includes(n)),
      ])
      const updatedSchema = await getSchema()
      setSchema(updatedSchema)
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load file"
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteFile(name: string) {
    try {
      const db = await getDuckDB()
      const conn = await db.connect()
      await conn.query(`DROP TABLE IF EXISTS "${name}"`)
      await conn.close()
      await deleteFile(name)
      setLoadedFiles((prev) => prev.filter((n) => n !== name))
      const updatedSchema = await getSchema()
      setSchema(updatedSchema)
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to delete file"
      )
    }
  }

  async function handleClearAll() {
    try {
      const db = await getDuckDB()
      const conn = await db.connect()
      const tables = await conn.query("SHOW ALL TABLES")
      for (const row of tables.toArray()) {
        await conn.query(`DROP TABLE IF EXISTS "${row["name"]}"`)
      }
      await conn.close()
      await clearFiles()
      setLoadedFiles([])
      setSchema({})
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to clear data"
      )
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDragOver(false)
    if (event.dataTransfer.files.length) {
      handleFiles(event.dataTransfer.files)
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleInsertTableName(table: string) {
    const snippet = `SELECT * FROM ${table} LIMIT 100`
    updateTab(activeTabId, { query: snippet })
  }

  if (dbState === "loading") {
    return (
      <Center h="100%" mih={400}>
        <Group c="dimmed"><Loader size="sm" /><Text size="sm">Loading DuckDB WASM engine…</Text></Group>
      </Center>
    )
  }

  if (loadError) {
    return (
      <Center h="100%" mih={400}>
        <Alert color="red" icon={<AlertCircle size={18} />}>{loadError}</Alert>
      </Center>
    )
  }

  return (
    <Paper
      withBorder
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        outline: isDragOver ? "2px solid var(--mantine-primary-color-filled)" : undefined,
        outlineOffset: -2,
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Group justify="space-between" p="md" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Box>
          <Title order={3}>Data Explorer</Title>
          <Text size="xs" c="dimmed">Query local files with DuckDB</Text>
        </Box>
        <Group>
          <Button
            variant="subtle"
            color="red"
            size="sm"
            leftSection={<Trash2 size={16} />}
            onClick={handleClearAll}
            disabled={loadedFiles.length === 0}
          >
            Clear All
          </Button>
          <FileButton
            multiple
            accept=".csv,.parquet,.json,.tsv,.xlsx,.xls,.arrow,.feather"
            onChange={handleFiles}
          >
            {(props) => (
              <Button {...props} variant="default" size="sm" loading={isUploading} leftSection={!isUploading ? <FileUp size={16} /> : undefined}>
                Upload File
              </Button>
            )}
          </FileButton>
        </Group>
      </Group>

      <Flex style={{ minHeight: 0, flex: 1 }}>
        <ScrollArea w={230} visibleFrom="lg" p="md" style={{ borderRight: "1px solid var(--mantine-color-default-border)" }}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">Files</Text>
          {loadedFiles.length === 0 ? (
            <Text size="xs" c="dimmed">No files loaded</Text>
          ) : (
            <Stack gap={2} mb="lg">
              {loadedFiles.map((name) => (
                <Group key={name} gap="xs" wrap="nowrap">
                  <Table2 size={14} />
                  <Text size="xs" truncate style={{ flex: 1 }}>{name}</Text>
                  <ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleDeleteFile(name)} aria-label={`Remove ${name}`}>
                    <X size={12} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}

          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" mt="lg">Tables</Text>
          {Object.keys(schema).length === 0 ? (
            <Text size="xs" c="dimmed">No tables yet</Text>
          ) : (
            <Stack gap="xs">
              {Object.entries(schema).map(([table, columns]) => (
                <Box key={table}>
                  <Button variant="subtle" color="gray" size="compact-sm" fullWidth justify="flex-start" leftSection={<Table2 size={13} />} onClick={() => handleInsertTableName(table)}>
                    <Text size="xs" truncate>{table}</Text>
                  </Button>
                  <Stack gap={1} ml="xl" mt={2}>
                    {columns.map((col) => (
                      <Text key={col} size="xs" c="dimmed" truncate>{col}</Text>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </ScrollArea>

        <Box
          ref={splitPaneRef}
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <Tabs value={activeTabId} onChange={(value) => value && setActiveTabId(value)}>
            <Group gap={0} wrap="nowrap" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
              <Tabs.List style={{ flex: 1, overflowX: "auto", flexWrap: "nowrap" }}>
            {tabs.map((tab) => (
                  <Popover
                    key={tab.id}
                    opened={renamingTabId === tab.id}
                    onChange={(opened) => {
                      if (!opened) setRenamingTabId(null)
                    }}
                    position="bottom-start"
                    withArrow
                    shadow="md"
                  >
                    <Popover.Target>
                      <Tabs.Tab
                        value={tab.id}
                        onDoubleClick={(event) => {
                          event.stopPropagation()
                          handleOpenRename(tab)
                        }}
                        rightSection={tabs.length > 1 ? (
                          <ActionIcon size="xs" variant="transparent" color="gray" onClick={(event) => { event.stopPropagation(); handleCloseTab(tab.id) }} aria-label={`Close ${tab.name}`}>
                            <X size={12} />
                          </ActionIcon>
                        ) : undefined}
                      >
                        {tab.name}
                      </Tabs.Tab>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <TextInput
                          label="Tab name"
                          value={tabNameDraft}
                          onChange={(event) => setTabNameDraft(event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleRenameTab()
                            if (event.key === "Escape") setRenamingTabId(null)
                          }}
                          autoFocus
                        />
                        <Group justify="flex-end" gap="xs">
                          <Button size="xs" variant="subtle" color="gray" onClick={() => setRenamingTabId(null)}>
                            Cancel
                          </Button>
                          <Button size="xs" onClick={handleRenameTab} disabled={!tabNameDraft.trim()}>
                            Rename
                          </Button>
                        </Group>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
            ))}
              </Tabs.List>
              <ActionIcon m="xs" variant="subtle" onClick={handleAddTab} aria-label="Add query tab"><Plus size={16} /></ActionIcon>
            </Group>
          </Tabs>

          <Box
            h={editorHeight}
            mih={160}
            style={{
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <SqlEditor
              value={activeTab.query}
              onChange={handleQueryChange}
              schema={schema}
            />
          </Box>

          <Box
            role="separator"
            aria-label="Resize SQL editor and results"
            aria-orientation="horizontal"
            aria-valuenow={Math.round(editorHeight)}
            tabIndex={0}
            h={9}
            onPointerDown={(event) => {
              resizeStartRef.current = {
                y: event.clientY,
                height: editorHeight,
              }
              setIsResizing(true)
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault()
                const change = event.key === "ArrowUp" ? -16 : 16
                const paneHeight = splitPaneRef.current?.clientHeight ?? 640
                const maximumHeight = Math.max(160, paneHeight - 220)
                setEditorHeight((height) =>
                  Math.min(maximumHeight, Math.max(160, height + change)),
                )
              }
            }}
            style={{
              position: "relative",
              flexShrink: 0,
              cursor: "row-resize",
              borderTop: "1px solid var(--mantine-color-default-border)",
              borderBottom: "1px solid var(--mantine-color-default-border)",
              background: isResizing
                ? "var(--mantine-primary-color-light)"
                : "var(--mantine-color-default-hover)",
            }}
          >
            <Box
              w={40}
              h={3}
              bg="var(--mantine-color-dimmed)"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                borderRadius: 999,
                opacity: 0.45,
                transform: "translate(-50%, -50%)",
              }}
            />
          </Box>

          <Group justify="space-between" p="xs" bg="var(--mantine-color-default-hover)" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={!activeTab.query.trim() || activeTab.isRunning || dbState !== "ready"}
              loading={activeTab.isRunning}
              leftSection={!activeTab.isRunning ? <Play size={15} /> : undefined}
            >
              {activeTab.isRunning ? "Running…" : "Run"}
            </Button>
            {activeTab.error && (
              <Group gap="xs" c="red"><AlertCircle size={14} /><Text size="xs" maw={420} truncate>{activeTab.error}</Text></Group>
            )}
          </Group>

          <Box style={{ flex: 1, minHeight: 160, overflow: "hidden" }}>
            {activeTab.result ? (
              <ResultsTable
                columns={activeTab.result.columns}
                rows={activeTab.result.rows}
                duration={activeTab.result.duration}
              />
            ) : (
              <Center h="100%">
                {isDragOver ? (
                  <Stack align="center" c="dimmed"><FileUp size={32} /><Text>Drop files here</Text></Stack>
                ) : (
                  <Stack align="center" c="dimmed" gap="xs">
                    <Table2 size={32} opacity={0.5} />
                    <Text size="sm">Upload CSV, Parquet, JSON or other files to query them</Text>
                    <Text size="xs">You can also drag and drop files anywhere</Text>
                  </Stack>
                )}
              </Center>
            )}
          </Box>
        </Box>
      </Flex>
    </Paper>
  )
}
