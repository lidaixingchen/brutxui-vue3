'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './card';
import { Badge } from './badge';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, Zap, Wallet, MoreHorizontal } from 'lucide-react';

export interface StatItem {
    title: string;
    value: string;
    description: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    progress?: number;
}

const defaultStats: StatItem[] = [
    {
        title: 'Monthly Recurring Revenue',
        value: '$24,890',
        description: 'Total subscription earnings',
        change: '+14.2%',
        trend: 'up',
        icon: Wallet,
        accentColor: '#FF6B6B',
        progress: 78,
    },
    {
        title: 'Active Subscribers',
        value: '1,429',
        description: 'Subscribed active users',
        change: '+8.3%',
        trend: 'up',
        icon: Users,
        accentColor: '#4ECDC4',
        progress: 62,
    },
    {
        title: 'API Request Load',
        value: '4.8M',
        description: 'Requests in the last 24h',
        change: '-2.1%',
        trend: 'down',
        icon: Zap,
        accentColor: '#FFE66D',
        progress: 45,
    },
];

export interface DashboardStatsProps extends React.HTMLAttributes<HTMLDivElement> {
    stats?: StatItem[];
    title?: string;
    subtitle?: string;
}

export function DashboardStats({
    stats = defaultStats,
    title = 'Overview Performance',
    subtitle = 'Real-time telemetry and operational growth metrics.',
    className,
    ...props
}: DashboardStatsProps) {
    return (
        <div
            className={`w-full py-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-950 text-black dark:text-white ${
                className || ''
            }`}
            {...props}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-8 w-8 text-[#FF6B6B] stroke-[3]" />
                            {title}
                        </h2>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
                            {subtitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="cursor-pointer hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black">
                            Last 30 Days
                        </Badge>
                        <Badge variant="primary" className="cursor-pointer hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                            Export PDF
                        </Badge>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;

                        return (
                            <Card
                                key={idx}
                                variant="interactive"
                                className="bg-white dark:bg-gray-900 border-3 border-brutal shadow-brutal hover:shadow-brutal-lg flex flex-col justify-between"
                            >
                                <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {stat.title}
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-xs font-semibold">
                                            {stat.description}
                                        </CardDescription>
                                    </div>
                                    <div
                                        className="p-3 border-3 border-brutal shadow-brutal-sm flex items-center justify-center"
                                        style={{ backgroundColor: stat.accentColor }}
                                    >
                                        <Icon className="h-5 w-5 text-black stroke-[3]" />
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 pt-2">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <span className="text-4xl font-black tracking-tight">{stat.value}</span>
                                        <Badge
                                            variant={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'danger' : 'default'}
                                            className="font-black text-xs border-2 gap-1"
                                        >
                                            {stat.trend === 'up' ? (
                                                <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
                                            ) : (
                                                <ArrowDownRight className="h-3.5 w-3.5 stroke-[3]" />
                                            )}
                                            {stat.change}
                                        </Badge>
                                    </div>

                                    {/* Mini visual indicator (Progress Bar) */}
                                    {stat.progress !== undefined && (
                                        <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-800">
                                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                                <span className="text-gray-500 dark:text-gray-400">TARGET LIMIT</span>
                                                <span>{stat.progress}%</span>
                                            </div>
                                            <div className="w-full h-3 border-2 border-brutal bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                <div
                                                    className="h-full border-r-2 border-brutal transition-all duration-500"
                                                    style={{
                                                        width: `${stat.progress}%`,
                                                        backgroundColor: stat.accentColor,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Footer Insight Block */}
                <div className="mt-8 p-5 bg-[#4ECDC4] text-black border-3 border-black shadow-brutal flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <span className="font-black uppercase mr-2 text-xs border-2 border-black px-2 py-0.5 bg-white">
                            INSIGHT
                        </span>
                        <span className="font-black text-sm">
                            Operational status is outstanding. Request volume is running 12% below cluster threshold limit.
                        </span>
                    </div>
                    <button className="flex items-center gap-1 font-black text-xs uppercase border-3 border-black px-3 py-1.5 bg-white shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all">
                        Details <MoreHorizontal className="h-4 w-4 stroke-[3]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
DashboardStats.displayName = 'DashboardStats';
