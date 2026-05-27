import * as React from 'react';
import {
    LayoutDashboard,
    Settings,
    Users,
    Layers,
    Bell,
    Search,
    Menu,
    LogOut,
    TrendingUp,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Badge } from './badge';
import { Button } from './button';

export interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
    userEmail?: string;
    onSignOutClick?: () => void;
}

const mockTransactions = [
    { id: 'TX-901', name: 'Alpha Agency', status: 'completed', amount: '$1,299.00', date: 'May 24, 2026' },
    { id: 'TX-902', name: 'Beta Labs', status: 'pending', amount: '$499.00', date: 'May 23, 2026' },
    { id: 'TX-903', name: 'Delta Studio', status: 'completed', amount: '$2,800.00', date: 'May 22, 2026' },
    { id: 'TX-904', name: 'Gamma Corp', status: 'failed', amount: '$99.00', date: 'May 20, 2026' },
];

export function DashboardShell({
    userEmail = 'creator@brutxui.site',
    onSignOutClick,
    className,
    ...props
}: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    return (
        <div
            className={`min-h-[600px] flex bg-brutal-bg text-brutal-fg border-3 border-brutal transition-colors duration-200 overflow-hidden ${className || ''}`}
            {...props}
        >
            <aside
                className={`w-64 border-r-3 border-brutal bg-gray-50 dark:bg-gray-900 transition-all duration-200 flex flex-col shrink-0 ${sidebarOpen ? 'block' : 'hidden md:flex'}`}
            >
                <div className="p-4 border-b-3 border-brutal flex items-center justify-between bg-brutal-accent/20">
                    <div className="flex items-center space-x-2 font-black text-xl">
                        <div className="w-6 h-6 border-2 border-brutal bg-brutal-primary rounded-none rotate-[-2deg]" />
                        <span>BrutxConsole</span>
                    </div>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 bg-brutal-primary text-black border-3 border-brutal font-black text-sm text-left shadow-none transition-all">
                        <LayoutDashboard className="h-4 w-4 stroke-[3]" />
                        <span>Overview</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-brutal-muted text-brutal-fg font-bold text-sm text-left border-3 border-transparent transition-all">
                        <Layers className="h-4 w-4 stroke-[2.5]" />
                        <span>Deployments</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-brutal-muted text-brutal-fg font-bold text-sm text-left border-3 border-transparent transition-all">
                        <Users className="h-4 w-4 stroke-[2.5]" />
                        <span>Team Access</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-brutal-muted text-brutal-fg font-bold text-sm text-left border-3 border-transparent transition-all">
                        <Settings className="h-4 w-4 stroke-[2.5]" />
                        <span>System Settings</span>
                    </button>
                </nav>

                <div className="p-4 border-t-3 border-brutal bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black truncate">{userEmail}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Owner Account</span>
                        </div>
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        className="w-full gap-2 py-4 font-black"
                        onClick={onSignOutClick}
                    >
                        <LogOut className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </aside>

            <div className="flex-grow flex flex-col min-w-0 bg-white dark:bg-gray-800/20">
                <header className="h-16 border-b-3 border-brutal flex items-center justify-between px-6 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-1.5 border-3 border-brutal bg-white text-black shadow-brutal-sm active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            <Menu className="h-4 w-4 stroke-[3]" />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 stroke-[2.5]" />
                            <input
                                placeholder="Global workspace search..."
                                className="pl-9 pr-4 py-1.5 border-3 border-brutal bg-gray-50 text-sm font-bold text-black focus:outline-none w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="relative p-1.5 border-3 border-brutal bg-white text-black shadow-brutal-sm active:translate-y-[2px] active:shadow-none transition-all">
                            <Bell className="h-4 w-4 stroke-[3]" />
                            <span className="absolute top-[-4px] right-[-4px] h-3.5 w-3.5 bg-brutal-destructive rounded-full border-2 border-brutal" />
                        </button>
                        <div className="w-8 h-8 rounded-full border-3 border-brutal bg-brutal-accent flex items-center justify-center font-black text-sm text-black">
                            C
                        </div>
                    </div>
                </header>

                <main className="flex-grow p-6 space-y-6 overflow-y-auto max-w-[1200px] w-full mx-auto">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-3 border-brutal bg-white dark:bg-gray-800 shadow-brutal rounded-none p-4">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-wider text-gray-500">Monthly Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-brutal-success stroke-[3]" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-3xl font-black">$12,492.00</div>
                                <p className="text-xs font-bold text-brutal-success flex items-center gap-1">
                                    <span>+18.2% from previous billing cycle</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-3 border-brutal bg-white dark:bg-gray-800 shadow-brutal rounded-none p-4">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-wider text-gray-500">Active Licenses</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-brutal-primary stroke-[3]" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-3xl font-black">+428</div>
                                <p className="text-xs font-bold text-brutal-primary">+4.1% monthly net active users</p>
                            </CardContent>
                        </Card>

                        <Card className="border-3 border-brutal bg-white dark:bg-gray-800 shadow-brutal rounded-none p-4">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-wider text-gray-500">System Warnings</CardTitle>
                                <ShieldAlert className="h-4 w-4 text-brutal-accent stroke-[3]" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-3xl font-black">2 Warnings</div>
                                <p className="text-xs font-bold text-brutal-accent">SSL domain renewals pending config</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-3 border-brutal bg-white dark:bg-gray-800 shadow-brutal rounded-none">
                        <CardHeader className="border-b-3 border-brutal p-4 bg-gray-50 dark:bg-gray-900/50">
                            <CardTitle className="text-lg font-black leading-none">Recent Transaction Ledgers</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="border-b-3 border-brutal">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black text-black dark:text-white p-3">Receipt ID</TableHead>
                                        <TableHead className="font-black text-black dark:text-white">Account</TableHead>
                                        <TableHead className="font-black text-black dark:text-white">Status</TableHead>
                                        <TableHead className="font-black text-black dark:text-white">date</TableHead>
                                        <TableHead className="text-right font-black text-black dark:text-white p-3">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="border-b border-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                            <TableCell className="font-black text-sm p-3">{tx.id}</TableCell>
                                            <TableCell className="font-bold text-sm text-gray-700 dark:text-gray-300">{tx.name}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        tx.status === 'completed'
                                                            ? 'success'
                                                            : tx.status === 'pending'
                                                            ? 'accent'
                                                            : 'danger'
                                                    }
                                                    className="font-black text-xs px-2 py-0.5 border-2 border-brutal rounded-none"
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-sm text-gray-500">{tx.date}</TableCell>
                                            <TableCell className="text-right font-black text-sm p-3">{tx.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
