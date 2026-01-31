import { ShieldAlert, Users, ShoppingCart } from 'lucide-react'

interface SelfChecklistProps {
    value: any;
    onChange: (value: any) => void;
}

const ITEMS = [
    {
        id: 'ugc',
        label: 'User Posts & Uploads',
        desc: 'Can people post comments, upload photos, or share anything in your app?',
        icon: Users
    },
    {
        id: 'login',
        label: 'Account / Login',
        desc: 'Do users need to sign up or log in to use your app?',
        icon: LockIcon
    },
    {
        id: 'iap',
        label: 'Pay to Unlock Features',
        desc: 'Can users pay once to unlock features, remove ads, or buy items?',
        icon: ShoppingCart
    },
    {
        id: 'subscriptions',
        label: 'Subscription / Recurring Payment',
        desc: 'Do users pay weekly, monthly, or yearly to keep using features?',
        icon: ShieldAlert
    },
    {
        id: 'ads',
        label: 'Ads in Your App',
        desc: 'Does your app show banner ads, video ads, or sponsored content?',
        icon: ShoppingCart
    },
    {
        id: 'thirdPartyLogin',
        label: 'Sign in with Apple / Google',
        desc: 'Can users log in using Apple, Google, Facebook, or other social accounts?',
        icon: Users
    },
    {
        id: 'aiContent',
        label: 'AI-Generated Content',
        desc: 'Does your app use ChatGPT, DALL-E, or similar AI to create text/images?',
        icon: ShieldAlert
    },
    {
        id: 'healthClaims',
        label: 'Health / Medical Advice',
        desc: 'Does your app claim to diagnose, treat, or cure health conditions?',
        icon: ShieldAlert
    },
    {
        id: 'crypto',
        label: 'Crypto / NFTs',
        desc: 'Does your app let users buy, sell, or trade cryptocurrency or NFTs?',
        icon: ShieldAlert
    }
]

// Conditional items that appear based on other selections
const CONDITIONAL_ITEMS = [
    {
        id: 'accountDeletion',
        label: 'Account Deletion Button',
        desc: 'Apple requires this! Is there a way for users to delete their account?',
        icon: ShieldAlert,
        showWhen: (v: any) => v.login === true
    },
    {
        id: 'restorePurchases',
        label: 'Restore Purchases Button',
        desc: 'Apple requires this! Is there a "Restore Purchases" button for returning users?',
        icon: ShoppingCart,
        showWhen: (v: any) => v.iap === true || v.subscriptions === true
    }
]

// Simple LockIcon since it was missing in imports
function LockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}

export function SelfChecklist({ value, onChange }: SelfChecklistProps) {
    const handleToggle = (id: string, currentVal: boolean) => {
        onChange({ ...value, [id]: !currentVal })
    }

    const renderItem = (item: typeof ITEMS[0], isConditional = false) => {
        const Icon = item.icon
        const isChecked = value[item.id] || false

        return (
            <div
                key={item.id}
                onClick={() => handleToggle(item.id, isChecked)}
                className={`
                    cursor-pointer border rounded-lg p-5 flex items-center justify-between transition-all group
                    ${isChecked ? 'bg-white border-white' : 'bg-black border-white/10 hover:border-white/30'}
                    ${isConditional ? 'border-l-2 border-l-blue-500/50' : ''}
                `}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${isChecked ? 'bg-black/10 text-black' : 'bg-white/5 text-gray-400'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`font-medium ${isChecked ? 'text-black' : 'text-white'}`}>{item.label}</h3>
                        <p className={`text-xs ${isChecked ? 'text-gray-600' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                </div>

                <div className={`
                    w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                    ${isChecked ? 'bg-black border-black' : 'border-white/20 group-hover:border-white/50'}
                `}>
                    {isChecked && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
            </div>
        )
    }

    // Filter conditional items that should be shown
    const visibleConditionalItems = CONDITIONAL_ITEMS.filter(item => item.showWhen(value))

    return (
        <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold tracking-tight">Feature Checklist</h2>
                <p className="text-sm text-gray-500 font-light">Confirm your app's capabilities</p>
            </div>

            <div className="grid gap-4">
                {ITEMS.map((item) => renderItem(item))}
                {visibleConditionalItems.map((item) => renderItem(item, true))}
            </div>
        </div>
    )
}
