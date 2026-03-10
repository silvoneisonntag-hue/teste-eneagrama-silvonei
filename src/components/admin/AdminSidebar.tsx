import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Settings,
  CreditCard,
  Coins,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoSrc from "@/assets/logo.png";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Relatórios", url: "/admin/relatorios", icon: FileText },
  { title: "Notificações", url: "/admin/notificacoes", icon: Bell },
];

const configItems = [
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
  { title: "Plano", url: "/admin/plano", icon: CreditCard },
  { title: "Comprar Créditos", url: "/admin/creditos", icon: Coins },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.url)}
          tooltip={collapsed ? item.title : undefined}
        >
          <NavLink
            to={item.url}
            end={item.url === "/admin"}
            className="hover:bg-sidebar-accent/50"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <img src={logoSrc} alt="Logo" className="w-8 h-8 rounded-lg" />
          {!collapsed && (
            <div>
              <p className="font-heading text-sm font-bold text-sidebar-foreground leading-tight">
                Eneagrama
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                Painel de Controle
              </p>
            </div>
          )}
        </div>

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Config Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(configItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-3 border-t border-sidebar-border">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-heading">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Usuário"}
              </p>
              <p className="text-[10px] text-muted-foreground font-body truncate">
                {user?.email || ""}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
