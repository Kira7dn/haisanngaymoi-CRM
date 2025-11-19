import Link from "next/link"
import { getCurrentUserAction } from "../../_shared/actions/auth-actions"
import { TrendingUp, Users, Trophy, BarChart3, ArrowRight, Target } from "lucide-react"

export default async function AnalyticsHomePage() {
  const user = await getCurrentUserAction()

  const analyticsModules = [
    {
      href: "/admin/analytics/revenue",
      title: "Revenue Analytics",
      description: "Track revenue trends, top products, and financial metrics across customizable time periods",
      icon: TrendingUp,
      color: "emerald",
      features: [
        "Period comparison & trends",
        "Top performing products",
        "Order status distribution",
        "Average order value tracking"
      ],
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/analytics/customer",
      title: "Customer Behavior Analytics",
      description: "Understand customer lifecycle, segment by value, and detect churn risks",
      icon: Users,
      color: "cyan",
      features: [
        "RFM segmentation (11 segments)",
        "Churn risk detection",
        "Cohort retention analysis",
        "Purchase pattern insights"
      ],
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/analytics/campaign",
      title: "Campaign Performance Analytics",
      description: "Track ROI, compare campaigns, and optimize marketing spend across platforms",
      icon: Target,
      color: "purple",
      features: [
        "Campaign ROI tracking",
        "Multi-campaign comparison",
        "Platform performance breakdown",
        "UTM parameter analytics"
      ],
      roles: ["admin", "sale"]
    },
    {
      href: "/admin/analytics/staff",
      title: "Staff Performance Analytics",
      description: "Monitor team performance, rankings, and individual staff activity",
      icon: Trophy,
      color: "amber",
      features: [
        "Team performance metrics",
        "Staff leaderboard & rankings",
        "Performance tier classification",
        "Daily activity tracking"
      ],
      roles: ["admin"]
    },
  ].filter(module => module.roles.includes(user?.role || ""))

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconText: "text-emerald-600 dark:text-emerald-400",
      hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600"
    },
    cyan: {
      bg: "bg-cyan-50 dark:bg-cyan-900/20",
      border: "border-cyan-200 dark:border-cyan-800",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconText: "text-cyan-600 dark:text-cyan-400",
      hoverBorder: "hover:border-cyan-400 dark:hover:border-cyan-600"
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconText: "text-amber-600 dark:text-amber-400",
      hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Analytics & Business Intelligence
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive reporting and analytics platform for data-driven decision making
          </p>
        </div>

        {/* Analytics Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {analyticsModules.map((module) => {
            const Icon = module.icon
            const colors = colorClasses[module.color as keyof typeof colorClasses]

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group"
              >
                <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-xl ${colors.hoverBorder} hover:-translate-y-1`}>
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${colors.iconBg} p-3 rounded-lg`}>
                      <Icon className={`w-8 h-8 ${colors.iconText}`} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {module.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {module.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Key Features
                    </p>
                    <ul className="space-y-1">
                      {module.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className={`${colors.iconText} mr-2 mt-0.5`}>•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className={`text-sm font-medium ${colors.iconText} group-hover:underline`}>
                      View Analytics →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  About Analytics Module
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The Analytics & Reports module provides comprehensive business intelligence
                  across revenue, customer behavior, and team performance. All analytics use
                  real-time data from your CRM system with customizable date ranges and
                  interactive visualizations.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Real-time Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Custom Date Ranges</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Interactive Charts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
