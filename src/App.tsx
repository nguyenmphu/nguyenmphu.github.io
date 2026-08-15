import "./App.css";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}

export default App;
