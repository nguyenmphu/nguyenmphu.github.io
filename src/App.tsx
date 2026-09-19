import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  MantineProvider,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Binary, Hash, QrCode, Sparkles, Table2 } from "lucide-react";
import Base64Tool from "./components/Base64Tool.tsx";
import ChecksumTool from "./components/ChecksumTool.tsx";
import DataTool from "./components/DataTool.tsx";
import PrettifyTool from "./components/PrettifyTool.tsx";
import QrCodeTool from "./components/QrCodeTool.tsx";
import { theme } from "./theme";

const TOOL_GROUPS = [
  {
    label: "Text tools",
    tools: [
      {
        name: "Base64",
        description: "Encode and decode text",
        icon: Binary,
        component: Base64Tool,
      },
      {
        name: "Checksum",
        description: "Verify file integrity",
        icon: Hash,
        component: ChecksumTool,
      },
      {
        name: "Prettify",
        description: "Format structured data",
        icon: Sparkles,
        component: PrettifyTool,
      },
    ],
  },
  {
    label: "Data tools",
    tools: [
      {
        name: "Data",
        description: "Query files with SQL",
        icon: Table2,
        component: DataTool,
      },
    ],
  },
  {
    label: "Image tools",
    tools: [
      {
        name: "QR Generator",
        description: "Create QR codes from text",
        icon: QrCode,
        component: QrCodeTool,
      },
    ],
  },
];

const TOOL_STORAGE_KEY = "devtools-active-tool";
const NAVBAR_STORAGE_KEY = "devtools-navbar-open";
const TOOL_NAMES = new Set(
  TOOL_GROUPS.flatMap((group) => group.tools.map((tool) => tool.name)),
);

function getInitialToolName() {
  const savedToolName = localStorage.getItem(TOOL_STORAGE_KEY);
  return savedToolName && TOOL_NAMES.has(savedToolName)
    ? savedToolName
    : "Base64";
}

function getInitialNavbarOpened() {
  return localStorage.getItem(NAVBAR_STORAGE_KEY) !== "false";
}

const App = () => {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(
    getInitialNavbarOpened(),
  );
  const [activeToolName, setActiveToolName] = useState(getInitialToolName);
  const activeTool = TOOL_GROUPS.flatMap((group) => group.tools).find(
    (tool) => tool.name === activeToolName,
  );
  const ActiveTool = activeTool?.component ?? Base64Tool;

  const handleSelectTool = (toolName: string) => {
    setActiveToolName(toolName);
    localStorage.setItem(TOOL_STORAGE_KEY, toolName);
    closeMobile();
  };

  const handleToggleDesktop = () => {
    localStorage.setItem(NAVBAR_STORAGE_KEY, String(!desktopOpened));
    toggleDesktop();
  };

  return (
    <MantineProvider theme={theme}>
      <AppShell
        h="100dvh"
        padding="md"
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
      >
        <AppShell.Header>
          <Box
            h="100%"
            px="md"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
            }}
          >
            <Group>
              <Burger
                opened={desktopOpened}
                onClick={handleToggleDesktop}
                visibleFrom="sm"
              />
              <Burger onClick={toggleMobile} hiddenFrom="sm" />
            </Group>

            <Box
              component="a"
              href="/"
              aria-label="DevTools home"
              style={{ display: "flex" }}
            >
              <img
                src="/devtools-logo.svg"
                alt="DevTools"
                width="125"
                height="32"
              />
            </Box>

            <ActionIcon
              component="a"
              href="https://github.com/nguyenmphu/nguyenmphu.github.io"
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              color="gray"
              aria-label="View source on GitHub"
              style={{ justifySelf: "end" }}
            >
              <svg width="24" height="24" aria-hidden="true">
                <use href="/icons.svg#github-icon" />
              </svg>
            </ActionIcon>
          </Box>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <AppShell.Section mb="md">
            <Text fw={700}>Developer tools</Text>
            <Text size="xs" c="dimmed">
              Fast utilities that run in your browser
            </Text>
          </AppShell.Section>

          <AppShell.Section grow component={ScrollArea}>
            <Stack gap="lg">
              {TOOL_GROUPS.map((group) => (
                <Box key={group.label}>
                  <Text size="xs" fw={600} c="dimmed" mb={4} px="sm">
                    {group.label}
                  </Text>
                  <Stack gap={2}>
                    {group.tools.map((tool) => (
                      <NavLink
                        key={tool.name}
                        label={tool.name}
                        description={tool.description}
                        leftSection={<tool.icon size={18} />}
                        active={activeToolName === tool.name}
                        onClick={() => handleSelectTool(tool.name)}
                        variant="light"
                        bdrs="md"
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </AppShell.Section>

          <AppShell.Section
            mt="md"
            pt="md"
            style={{
              borderTop: "1px solid var(--mantine-color-default-border)",
            }}
          >
            <Text size="xs" c="dimmed">
              nguyenmphu © 2026 DevTools
            </Text>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main
          h="100dvh"
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ActiveTool />
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
};

export default App;
