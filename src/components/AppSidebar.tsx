import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from './ui/sidebar.tsx'

interface AppSidebarProps {
  activeTool: string
  onSelectTool: (tool: string) => void
}

const TOOLS = ['Base64', 'CheckSum']

export default function AppSidebar({ activeTool, onSelectTool }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {TOOLS.map((tool) => (
              <SidebarMenuItem key={tool}>
                <SidebarMenuButton
                  type="button"
                  isActive={activeTool === tool}
                  onClick={() => onSelectTool(tool)}
                >
                  {tool}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
