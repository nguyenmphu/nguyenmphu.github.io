import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from "./ui/sidebar";

export default function AppSidebar() {
  const TOOLS = ["Base64", "CheckSum"];
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem></SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {TOOLS.map((tool) => (
              <SidebarMenuItem key={tool}>
                <SidebarMenuButton>{tool}</SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>{/*<User2 /> Username*/}</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
