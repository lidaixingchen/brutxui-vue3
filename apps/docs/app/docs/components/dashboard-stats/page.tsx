'use client';

import { DashboardStats, Badge } from '@/components/ui';
import { ComponentPreview } from '@/components/component-preview';
import { InstallationTabs } from '@/components/installation-tabs';

export default function DashboardStatsPage() {
    return (
        <div>
            <Badge variant="primary" className="mb-4">
                Block Component
            </Badge>
            <h1>Dashboard Stats</h1>

            <p>Premium dashboard stat metrics, trends indicators, and visual target/progress limits with a heavy neo-brutalist theme.</p>

            <h2>Preview</h2>
            <ComponentPreview align="stretch">
                <DashboardStats />
            </ComponentPreview>

            <h2>Installation</h2>
            <InstallationTabs componentName="dashboard-stats" />

            <h2>Usage</h2>
            <pre className="bg-gray-900 text-white p-4 border-3 border-black dark:border-white shadow-brutal overflow-x-auto text-sm">
                {`import { DashboardStats } from "@/components/ui/dashboard-stats"
import { TrendingUp, Award, Activity } from "lucide-react"

<DashboardStats />

const myStats = [
  {
    title: "Page Performance",
    value: "99/100",
    description: "Lighthouse core web vitals",
    change: "+4.5%",
    trend: "up" as const,
    icon: TrendingUp,
    accentColor: "#FFE66D",
    progress: 99
  },
  {
    title: "Server Health",
    value: "99.98%",
    description: "Average weekly uptime",
    change: "+0.02%",
    trend: "up" as const,
    icon: Activity,
    accentColor: "#4ECDC4",
    progress: 100
  }
];

<DashboardStats
  stats={myStats}
  title="Real-Time Health Status"
  subtitle="Crucial indicators representing the real-time wellness of backend workloads."
/>`}
            </pre>
        </div>
    );
}
