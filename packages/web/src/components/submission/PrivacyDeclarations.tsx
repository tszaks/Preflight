import { Lock, Eye } from 'lucide-react'

type PrivacyDataEntry = {
    collected: boolean;
    linked: boolean;
};

type PrivacyDeclarationsValue = {
    data?: Record<string, PrivacyDataEntry>;
    tracking?: boolean;
};

interface PrivacyDeclarationsProps {
    value: PrivacyDeclarationsValue;
    onChange: (value: PrivacyDeclarationsValue) => void;
}

const DATA_TYPES = [
    { id: 'contact', label: 'Contact Info', desc: 'Do you ask for their name, email, phone number, or address?' },
    { id: 'health', label: 'Health & Fitness', desc: 'Do you track workouts, steps, sleep, weight, or any medical info?' },
    { id: 'financial', label: 'Financial Info', desc: 'Do you store credit cards, payment info, or bank details?' },
    { id: 'location', label: 'Location', desc: 'Do you use their GPS location or ask where they are?' },
    { id: 'sensitive', label: 'Sensitive Info', desc: 'Do you collect info about race, religion, politics, or sexual orientation?' },
    { id: 'contacts', label: 'Contacts', desc: 'Do you access their phone contacts or address book?' },
    { id: 'content', label: 'User Content', desc: 'Can users upload photos, videos, or write posts/messages?' },
    { id: 'browsing', label: 'Browsing History', desc: 'Do you track which websites or pages they visit?' },
    { id: 'search', label: 'Search History', desc: 'Do you save what they search for in your app?' },
    { id: 'identifiers', label: 'Identifiers', desc: 'Do you create a user ID or track their device ID?' },
    { id: 'purchases', label: 'Purchases', desc: 'Do you track what they buy or their purchase history?' },
    { id: 'usage', label: 'Usage Data', desc: 'Do you track which buttons they tap or how they use your app?' },
    { id: 'diagnostics', label: 'Diagnostics', desc: 'Do you collect crash reports or performance data? (Firebase, Sentry, etc.)' },
    { id: 'other', label: 'Other Data', desc: 'Anything else not listed above that you store about users' },
]

export function PrivacyDeclarations({ value, onChange }: PrivacyDeclarationsProps) {
    // Get the data state for a type: { collected: boolean, linked: boolean }
    const getDataState = (id: string) => {
        const data = value.data || {}
        return data[id] || { collected: false, linked: false }
    }

    const handleCollectedToggle = (id: string) => {
        const data = value.data || {}
        const current = data[id] || { collected: false, linked: false }
        const newCollected = !current.collected
        onChange({
            ...value,
            data: {
                ...data,
                [id]: {
                    collected: newCollected,
                    linked: newCollected ? current.linked : false // Reset linked if uncollected
                }
            }
        })
    }

    const handleLinkedToggle = (id: string) => {
        const data = value.data || {}
        const current = data[id] || { collected: false, linked: false }
        onChange({
            ...value,
            data: {
                ...data,
                [id]: {
                    ...current,
                    linked: !current.linked
                }
            }
        })
    }

    const setTracking = (isTracking: boolean) => {
        onChange({ ...value, tracking: isTracking })
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold tracking-tight">Privacy & Data</h2>
                <p className="text-sm text-gray-500 font-light">Declare data collection and usage</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Data Collection
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {DATA_TYPES.map((type) => {
                        const state = getDataState(type.id)
                        const isCollected = state.collected
                        const isLinked = state.linked

                        return (
                            <div
                                key={type.id}
                                className={`
                                    rounded-lg border transition-all
                                    ${isCollected
                                        ? 'bg-white/[0.03] border-white/20'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'}
                                `}
                            >
                                <div
                                    onClick={() => handleCollectedToggle(type.id)}
                                    className="p-4 cursor-pointer flex items-start gap-3"
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center
                                        ${isCollected ? 'border-white bg-white text-black' : 'border-gray-600'}`}
                                    >
                                        {isCollected && <div className="w-2 h-2 bg-black rounded-sm" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium text-sm leading-none mb-1.5 ${isCollected ? 'text-white' : 'text-gray-400'}`}>
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-gray-500">{type.desc}</div>
                                    </div>
                                </div>

                                {/* Linked to User toggle - only show when collected */}
                                {isCollected && (
                                    <div
                                        onClick={() => handleLinkedToggle(type.id)}
                                        className="px-4 pb-4 pt-0 flex items-center gap-3 cursor-pointer group"
                                    >
                                        <div className="ml-7 flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center
                                                ${isLinked ? 'border-blue-400 bg-blue-400' : 'border-gray-600 group-hover:border-gray-400'}`}
                                            >
                                                {isLinked && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                            </div>
                                            <span className={`text-xs ${isLinked ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                                Can you tie this data to a specific person? (e.g., through their account)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Tracking
                </h3>
                <div className="vercel-card p-6 space-y-4">
                    <p className="text-sm text-gray-400">
                        Does this app use data to track the user across apps and websites owned by other companies?
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTracking(false)}
                            className={`px-6 py-2 rounded text-sm font-medium border transition-colors ${value.tracking === false
                                ? 'bg-white text-black border-white'
                                : 'border-white/20 hover:border-white text-gray-400'
                                }`}
                        >
                            No
                        </button>
                        <button
                            onClick={() => setTracking(true)}
                            className={`px-6 py-2 rounded text-sm font-medium border transition-colors ${value.tracking === true
                                ? 'bg-white text-black border-white'
                                : 'border-white/20 hover:border-white text-gray-400'
                                }`}
                        >
                            Yes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
