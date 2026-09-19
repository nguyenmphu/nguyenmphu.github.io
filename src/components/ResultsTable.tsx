import { Download } from "lucide-react"
import {
  Box,
  Button,
  Center,
  Group,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core"

interface ResultsTableProps {
  columns: string[]
  rows: Record<string, unknown>[]
  duration: number
}

export default function ResultsTable({ columns, rows, duration }: ResultsTableProps) {
  function handleExportCsv() {
    if (!columns.length) return

    const header = columns.join(",")
    const body = rows
      .map((row) =>
        columns
          .map((col) => {
            const val = row[col]
            const str = val === null || val === undefined ? "" : String(val)
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query_results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!columns.length) {
    return (
      <Center h="100%">
        <Text size="sm" c="dimmed">Run a query to see results</Text>
      </Center>
    )
  }

  return (
    <Box h="100%" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Group justify="space-between" px="md" py="xs" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Text size="xs" c="dimmed">
          {rows.length} {rows.length === 1 ? "row" : "rows"} &middot; {duration.toFixed(1)}ms
        </Text>
        <Button variant="subtle" size="xs" leftSection={<Download size={14} />} onClick={handleExportCsv}>
          Export CSV
        </Button>
      </Group>
      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <Table striped highlightOnHover withRowBorders stickyHeader fz="xs">
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th key={col} style={{ whiteSpace: "nowrap" }}>
                  {col}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={i}>
                {columns.map((col) => (
                  <Table.Td key={col} ff="monospace" style={{ whiteSpace: "nowrap" }}>
                    {row[col] === null || row[col] === undefined ? (
                      <Text span c="dimmed" fs="italic">NULL</Text>
                    ) : (
                      String(row[col])
                    )}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Box>
  )
}
