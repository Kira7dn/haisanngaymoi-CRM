"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutAction } from "../actions/auth-actions"
import { useState } from "react"
import Image from "next/image"

interface AdminHeaderProps {
  userName?: string
  userRole?: string
}

export function AdminHeader({ userName, userRole = 'sale' }: AdminHeaderProps) {

  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Tổng quan",
      icon: "🏠",
      roles: ["admin", "sale", "warehouse"]
    },
    {
      href: "/admin/dashboard/products",
      label: "Sản phẩm",
      icon: "📦",
      roles: ["admin", "sale", "warehouse"]
    },
    {
      href: "/admin/dashboard/orders",
      label: "Đơn hàng",
      icon: "🛒",
      roles: ["admin", "sale", "warehouse"]
    },
    {
      href: "/admin/dashboard/customers",
      label: "Khách hàng",
      icon: "👥",
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/dashboard/campaigns",
      label: "Chiến dịch",
      icon: "📢",
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/dashboard/categories",
      label: "Danh mục",
      icon: "🏷️",
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/dashboard/banners",
      label: "Banner",
      icon: "🖼️",
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/dashboard/posts",
      label: "Bài viết",
      icon: "📝",
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/users",
      label: "Người dùng",
      icon: "👤",
      roles: ["admin"]
    },
    {
      href: "/admin/analytics",
      label: "Analytics & Reports",
      icon: "📊",
      roles: ["admin", "sale"]
    },
  ].filter(item => item.roles.includes(userRole))

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin"
    }
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition">
              <Image src="/logo-full.png" alt="Logo" width={32} height={32} />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Hải Sản Ngày Mới
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Management
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(item.href)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu & Actions */}
          <div className="flex items-center space-x-4">
            {/* User Info - Hidden on small screens */}
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {userName || "Admin"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <span className="mr-1">🚪</span>
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 space-y-1">
            {/* User Info - Mobile */}
            <div className="px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {userName || "Admin"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole}
              </div>
            </div>

            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(item.href)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Logout Button - Mobile */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 mt-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
