import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, RefreshCw, Truck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { supabase } from "@/integrations/supabase/client";
import { Route as AuthRoute } from "@/routes/_authenticated/route";

const ITENS = [
  { titulo: "Painel", url: "/painel", icon: LayoutDashboard },
  { titulo: "Fornecedores", url: "/fornecedores", icon: Truck },
  { titulo: "Sincronização", url: "/sincronizacao", icon: RefreshCw },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const recolhido = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = AuthRoute.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  const ativo = (url: string) =>
    pathname === url || (url === "/painel" && pathname.startsWith("/oportunidades"));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Logo compacto={recolhido} className="text-sidebar-accent-foreground" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoramento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITENS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={ativo(item.url)} tooltip={item.titulo}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!recolhido && (
          <p className="truncate px-2 text-xs text-sidebar-foreground/70" title={user.email ?? ""}>
            {user.email}
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void sair()} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
