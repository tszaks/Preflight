import type { SVGProps } from 'react'
import { ShieldAlert, Users, ShoppingCart } from 'lucide-react'

type ChecklistValue = Record<string, boolean | undefined>;

interface SelfChecklistProps {
    value: ChecklistValue;
    onChange: (value: ChecklistValue) => void;
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
    },
    {
        id: 'miniApps',
        label: 'Mini Apps / Plugins',
        desc: 'Does your app host mini games, chatbots, HTML5 games, or plugins?',
        icon: ShieldAlert
    },
    {
        id: 'euDistribution',
        label: 'Available in the EU',
        desc: 'Is your app distributed on the EU App Store?',
        icon: ShieldAlert
    },
    {
        id: 'externalPayments',
        label: 'External Payment Links (US)',
        desc: 'Do you link users to pay for digital goods outside of Apple?',
        icon: ShoppingCart
    },
    {
        id: 'screenshotsMatchUi',
        label: 'Screenshots Match Current UI',
        desc: 'Do your App Store screenshots accurately reflect the current app interface?',
        icon: ShieldAlert
    },
    {
        id: 'testedIpv6',
        label: 'Tested on IPv6 Network',
        desc: 'Has your app been tested on an IPv6-only network?',
        icon: ShieldAlert
    },
    {
        id: 'contextualPermissions',
        label: 'Contextual Permission Prompts',
        desc: 'Do you request permissions only when users trigger related features?',
        icon: ShieldAlert
    },
    {
        id: 'alternateIcons',
        label: 'Alternate App Icons',
        desc: 'Does your app include alternate icons users can choose?',
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
        showWhen: (v: ChecklistValue) => v.login === true
    },
    {
        id: 'restorePurchases',
        label: 'Restore Purchases Button',
        desc: 'Apple requires this! Is there a "Restore Purchases" button for returning users?',
        icon: ShoppingCart,
        showWhen: (v: ChecklistValue) => v.iap === true || v.subscriptions === true
    },
    {
        id: 'creatorAgeGate',
        label: 'Creator Age Verification',
        desc: 'Do you verify content creators are at least 13 years old?',
        icon: Users,
        showWhen: (v: ChecklistValue) => v.ugc === true
    },
    {
        id: 'ugcModeration',
        label: 'UGC Moderation Controls',
        desc: 'Do you provide reporting, blocking, and filtering for user-generated content?',
        icon: Users,
        showWhen: (v: ChecklistValue) => v.ugc === true
    },
    {
        id: 'healthDisclaimers',
        label: 'Health Disclaimers',
        desc: 'Do you include clear disclaimers for medical or health-related claims?',
        icon: ShieldAlert,
        showWhen: (v: ChecklistValue) => v.healthClaims === true
    },
    {
        id: 'aiContentFiltering',
        label: 'AI Output Filtering',
        desc: 'Do you filter AI-generated content for harmful, illegal, or explicit output?',
        icon: ShieldAlert,
        showWhen: (v: ChecklistValue) => v.aiContent === true
    },
    {
        id: 'miniAppsReviewed',
        label: 'Mini Apps Individually Reviewed',
        desc: 'Have all mini apps/plugins been submitted for individual Apple review?',
        icon: ShieldAlert,
        showWhen: (v: ChecklistValue) => v.miniApps === true
    },
    {
        id: 'euTraderDeclared',
        label: 'EU Trader Status Declared',
        desc: 'Have you declared your trader status in App Store Connect? (EU DSA)',
        icon: ShieldAlert,
        showWhen: (v: ChecklistValue) => v.euDistribution === true
    },
    {
        id: 'externalLinkCompliant',
        label: 'External Link API Compliance',
        desc: 'Do you use StoreKit External Link Account API with Apple&apos;s disclosure?',
        icon: ShoppingCart,
        showWhen: (v: ChecklistValue) => v.externalPayments === true
    },
    {
        id: 'subscriptionTerms',
        label: 'Subscription Terms on Paywall',
        desc: 'Do you display subscription price, billing period, and terms clearly on the paywall?',
        icon: ShoppingCart,
        showWhen: (v: ChecklistValue) => v.subscriptions === true
    },
    {
        id: 'subscriptionsWithoutLogin',
        label: 'Subscriptions Accessible Without Login',
        desc: 'Can users access subscription status without being forced to create an app account?',
        icon: ShoppingCart,
        showWhen: (v: ChecklistValue) => v.subscriptions === true
    },
    {
        id: 'sellsDigitalOutsideIap',
        label: 'Digital Goods Outside IAP',
        desc: 'Do you sell digital goods or features outside Apple In-App Purchase?',
        icon: ShoppingCart,
        showWhen: (v: ChecklistValue) => v.iap === true || v.subscriptions === true || v.externalPayments === true
    }
]

// Simple LockIcon since it was missing in imports
function LockIcon(props: SVGProps<SVGSVGElement>) {
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
                    ${isConditional ? 'border-l-2 border-l-white/20' : ''}
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
                <p className="text-sm text-gray-500 font-light">Confirm your app&apos;s capabilities</p>
            </div>

            <div className="grid gap-4">
                {ITEMS.map((item) => renderItem(item))}
                {visibleConditionalItems.map((item) => renderItem(item, true))}
            </div>
        </div>
    )
}
