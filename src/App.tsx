import { useState } from 'react'

import './App.css'
import AppSidebar from './components/AppSidebar.tsx'
import Base64Tool from './components/Base64Tool.tsx'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar.tsx'

function App() {
  const [activeTool, setActiveTool] = useState('Base64')

  return (
    <SidebarProvider>
      <AppSidebar activeTool={activeTool} onSelectTool={setActiveTool} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <SidebarTrigger />
        </div>
        {activeTool === 'Base64' ? (
          <Base64Tool />
        ) : (
          <div className="grid min-h-0 flex-1 place-items-center overflow-auto p-8 text-sm text-muted-foreground">
            CheckSum is coming soon.
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
