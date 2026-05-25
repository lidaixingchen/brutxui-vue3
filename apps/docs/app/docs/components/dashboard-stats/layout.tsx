import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO['dashboard-stats']);

export default function DashboardStatsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
