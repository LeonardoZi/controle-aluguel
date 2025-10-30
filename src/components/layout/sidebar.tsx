"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const PackageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ShoppingCartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const BarChart2Icon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

interface SidebarProps {
  open: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: {
    title: string;
    href: string;
  }[];
}

export function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/products": true,
    "/purchases": false,
    "/sales": false,
  });

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <HomeIcon />,
    },
    {
      title: "Produtos",
      href: "/products",
      icon: <PackageIcon />,
      submenu: [
        { title: "Listar Produtos", href: "/products" },
        { title: "Cadastrar Produto", href: "/products/new" },
        { title: "Categorias", href: "/products/categories" },
      ],
    },
    {
      title: "Estoque",
      href: "/inventory",
      icon: <BarChart2Icon />,
    },
    {
      title: "Compras",
      href: "/purchases",
      icon: <ShoppingCartIcon />,
      submenu: [
        { title: "Listar Compras", href: "/purchases" },
        { title: "Nova Compra", href: "/purchases/new" },
      ],
    },
    {
      title: "Vendas",
      href: "/sales",
      icon: <ShoppingCartIcon />,
      submenu: [
        { title: "Listar Vendas", href: "/sales" },
        { title: "Nova Venda", href: "/sales/new" },
      ],
    },
    {
      title: "Clientes",
      href: "/customers",
      icon: <UsersIcon />,
    },
    {
      title: "Fornecedores",
      href: "/suppliers",
      icon: <TruckIcon />,
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: <SettingsIcon />,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-full bg-white border-r border-gray-200 z-20 transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-0 md:w-16",
        "overflow-hidden"
      )}
    >
      <nav className="py-4 h-full overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              {/* Item principal */}
              <div className="relative">
                <Link
                  href={item.submenu ? "#" : item.href}
                  onClick={
                    item.submenu ? () => toggleExpand(item.href) : undefined
                  }
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm rounded-md gap-3 hover:bg-gray-100 transition-colors",
                    isActive(item.href) &&
                      "bg-blue-50 text-blue-600 font-medium",
                    !open && "justify-center md:px-3"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={cn("truncate", !open && "hidden md:hidden")}>
                    {item.title}
                  </span>

                  {item.submenu && open && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpand(item.href);
                      }}
                    >
                      {expandedItems[item.href] ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </button>
                  )}
                </Link>
              </div>

              {/* Submenu */}
              {item.submenu && expandedItems[item.href] && open && (
                <ul className="mt-1 ml-8 space-y-1">
                  {item.submenu.map((subitem) => (
                    <li key={subitem.href}>
                      <Link
                        href={subitem.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                          isActive(subitem.href) && "text-blue-600 font-medium"
                        )}
                      >
                        {subitem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
