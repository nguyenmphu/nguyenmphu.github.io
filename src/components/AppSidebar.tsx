import { Binary, Braces, Hash, Laptop } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from './ui/sidebar.tsx'

interface AppSidebarProps {
  activeTool: string
  onSelectTool: (tool: string) => void
}

const TOOLS = [
  {
    name: 'Base64',
    description: 'Encode and decode text',
    icon: Binary,
  },
  {
    name: 'Checksum',
    description: 'Verify file integrity',
    icon: Hash,
  },
]

export default function AppSidebar({ activeTool, onSelectTool }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 shrink-0 justify-center gap-0 border-b border-sidebar-border px-3 py-0 group-data-[collapsible=icon]:px-2">
        <div className="flex min-w-0 items-center gap-3" title="Dev Toolbox">
          <div className="grid size-9 shrink-0 place-items-center bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8">
            <Braces className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight">Dev Toolbox</p>
            <p className="truncate text-xs text-sidebar-foreground/55">Browser utilities</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {TOOLS.map((tool) => (
              <SidebarMenuItem key={tool.name}>
                <SidebarMenuButton
                  type="button"
                  size="lg"
                  tooltip={tool.name}
                  isActive={activeTool === tool.name}
                  onClick={() => onSelectTool(tool.name)}
                  className="h-auto min-h-12 gap-3 px-3 py-2.5 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground group-data-[collapsible=icon]:min-h-8! group-data-[collapsible=icon]:justify-center"
                >
                  <tool.icon className="size-4" aria-hidden="true" />
                  <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="block truncate text-sm font-medium normal-case tracking-normal">
                      {tool.name}
                    </span>
                    <span className="block truncate text-xs font-normal normal-case tracking-normal opacity-60">
                      {tool.description}
                    </span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0! data-horizontal:w-full!" />

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 px-1 py-2 text-sidebar-foreground/60" title="Runs locally — your data stays private">
          <Laptop className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium text-sidebar-foreground">Runs locally</p>
            <p className="truncate text-[11px]">Your data stays private</p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
