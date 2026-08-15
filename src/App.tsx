import { lazy, Suspense, useState } from 'react'

import './App.css'
import AppSidebar from './components/AppSidebar.tsx'
import Base64Tool from './components/Base64Tool.tsx'
import ChecksumTool from './components/ChecksumTool.tsx'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar.tsx'

const PrettifyTool = lazy(() => import('./components/PrettifyTool.tsx'))
const QrCodeTool = lazy(() => import('./components/QrCodeTool.tsx'))

function App() {
  const [activeTool, setActiveTool] = useState('Base64')

  return (
    <SidebarProvider>
      <AppSidebar activeTool={activeTool} onSelectTool={setActiveTool} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <SidebarTrigger />
        </div>
        {activeTool === 'Base64' && <Base64Tool />}
        {activeTool === 'Checksum' && <ChecksumTool />}
        {activeTool === 'Prettify' && (
          <Suspense fallback={<div className="grid flex-1 place-items-center text-sm text-muted-foreground">Loading formatter…</div>}>
            <PrettifyTool />
          </Suspense>
        )}
        {activeTool === 'QR Generator' && (
          <Suspense fallback={<div className="grid flex-1 place-items-center text-sm text-muted-foreground">Loading QR generator…</div>}>
            <QrCodeTool />
          </Suspense>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
