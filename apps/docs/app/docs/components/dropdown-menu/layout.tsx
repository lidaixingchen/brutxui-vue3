import { Metadata } from 'next';
import { componentsSEO, generateComponentMetadata } from '@/config/seo';

export const metadata: Metadata = generateComponentMetadata(componentsSEO['dropdown-menu']);

export default function DropdownMenuLayout({ children }: { children: React.ReactNode }) {
    return children;
}
