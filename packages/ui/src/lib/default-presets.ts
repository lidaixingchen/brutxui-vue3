export interface ColorPreset {
    label: string
    value: string
    disabled?: boolean
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
    { label: 'Gray 50', value: '#F9FAFB' },
    { label: 'Gray 200', value: '#E5E7EB' },
    { label: 'Gray 500', value: '#6B7280' },
    { label: 'Gray 800', value: '#1F2937' },
    { label: 'Gray 900', value: '#111827' },

    { label: 'Red 50', value: '#FEF2F2' },
    { label: 'Red 200', value: '#FECACA' },
    { label: 'Red 500', value: '#EF4444' },
    { label: 'Red 800', value: '#991B1B' },

    { label: 'Orange 50', value: '#FFF7ED' },
    { label: 'Orange 200', value: '#FED7AA' },
    { label: 'Orange 500', value: '#F97316' },
    { label: 'Orange 800', value: '#9A3412' },

    { label: 'Yellow 50', value: '#FEFCE8' },
    { label: 'Yellow 200', value: '#FEF08A' },
    { label: 'Yellow 500', value: '#EAB308' },
    { label: 'Yellow 800', value: '#854D0E' },

    { label: 'Green 50', value: '#F0FDF4' },
    { label: 'Green 200', value: '#BBF7D0' },
    { label: 'Green 500', value: '#22C55E' },
    { label: 'Green 800', value: '#166534' },

    { label: 'Blue 50', value: '#EFF6FF' },
    { label: 'Blue 200', value: '#BFDBFE' },
    { label: 'Blue 500', value: '#3B82F6' },
    { label: 'Blue 800', value: '#1E40AF' },

    { label: 'Purple 50', value: '#FAF5FF' },
    { label: 'Purple 200', value: '#E9D5FF' },
    { label: 'Purple 500', value: '#A855F7' },
    { label: 'Purple 800', value: '#6B21A8' },

    { label: 'Pink 50', value: '#FDF2F8' },
    { label: 'Pink 200', value: '#FBCFE8' },
    { label: 'Pink 500', value: '#EC4899' },
    { label: 'Pink 800', value: '#9D174D' },
]
