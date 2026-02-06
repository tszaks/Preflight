import { useMemo } from 'react'

type AgeRatingValue = Record<string, number | boolean | undefined>;

interface AgeRatingProps {
    value: AgeRatingValue;
    onChange: (value: AgeRatingValue) => void;
}

const RATING_QUESTIONS = [
    {
        id: 'cartoonViolence',
        label: 'Does your app show cartoon or fantasy violence?',
        hint: 'Think: comic-style punches, magical attacks, cartoon fights',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'realisticViolence',
        label: 'Does your app show realistic violence?',
        hint: 'Think: realistic fighting, blood, weapons',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'prolongedViolence',
        label: 'Does your app show graphic or intense violence?',
        hint: 'Think: gore, torture, extremely violent scenes',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'sexualContent',
        label: 'Does your app contain sexual content or nudity?',
        hint: 'Think: explicit images, sexual themes, nudity',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'Suggestive' },
            { value: 2, label: 'Explicit' }
        ]
    },
    {
        id: 'matureSuggestive',
        label: 'Does your app have mature or suggestive themes?',
        hint: 'Think: dating themes, romance, innuendo',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'profanity',
        label: 'Does your app contain swearing or crude humor?',
        hint: 'Think: curse words, off-color jokes, bathroom humor',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'alcoholDrugs',
        label: 'Does your app reference alcohol, tobacco, or drugs?',
        hint: 'Think: drinking scenes, smoking, drug use/references',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'References' },
            { value: 2, label: 'Regular use' }
        ]
    },
    {
        id: 'gamblingSimulated',
        label: 'Does your app have gambling mechanics (no real money)?',
        hint: 'Think: casino games, slot machines, poker with fake chips',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'horrorFear',
        label: 'Does your app have horror or scary content?',
        hint: 'Think: jump scares, creepy themes, horror imagery',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'A little' },
            { value: 2, label: 'A lot' }
        ]
    },
    {
        id: 'medicalTreatment',
        label: 'Does your app provide medical or health advice?',
        hint: 'Think: treatment suggestions, diagnosis info, health recommendations',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'General info' },
            { value: 2, label: 'Specific advice' }
        ]
    },
    {
        id: 'gamblingContests',
        label: 'Can users gamble real money or enter paid contests?',
        hint: 'Think: betting, fantasy sports, casino with real prizes',
        options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'Yes' },
            { value: 2, label: 'Major feature' }
        ]
    },
]

const BOOLEAN_FLAGS = [
    { id: 'unrestrictedWebAccess', label: 'Can users browse any website in your app?', desc: 'e.g., an in-app web browser that goes anywhere' },
    { id: 'madeForKids', label: 'Is this app designed specifically for kids under 13?', desc: 'Triggers stricter rules under COPPA' },
]

export function AgeRating({ value, onChange }: AgeRatingProps) {
    const calculateRating = (a: AgeRatingValue): string => {
        const getNumberValue = (key: string): number => {
            const raw = a[key];
            return typeof raw === 'number' ? raw : 0;
        };

        // 17+ triggers (per Apple's Age Rating questionnaire)
        if (getNumberValue('prolongedViolence') === 2 ||
            getNumberValue('sexualContent') === 2 ||
            getNumberValue('gamblingSimulated') === 2 ||
            getNumberValue('gamblingContests') > 0) {
            return "17+"
        }
        // 12+ triggers
        if (getNumberValue('realisticViolence') > 0 ||
            getNumberValue('sexualContent') > 0 ||
            getNumberValue('matureSuggestive') === 2 ||
            getNumberValue('alcoholDrugs') === 2 ||
            getNumberValue('gamblingSimulated') > 0) {
            return "12+"
        }
        // 9+ triggers
        if (getNumberValue('cartoonViolence') === 2 ||
            getNumberValue('matureSuggestive') > 0 ||
            getNumberValue('profanity') === 2 ||
            getNumberValue('horrorFear') === 2) {
            return "9+"
        }
        // Default 4+
        return "4+"
    }

    const rating = useMemo(() => calculateRating(value), [value])

    const handleChange = (questionId: string, optionValue: number) => {
        const newValue = { ...value, [questionId]: optionValue }
        onChange(newValue)
    }

    const handleFlagChange = (flagId: string, checked: boolean) => {
        const newValue = { ...value, [flagId]: checked }
        onChange(newValue)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Age Rating</h2>
                    <p className="text-sm text-gray-500 font-light">Determine your app&apos;s suitable audience</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Calculated Rating</span>
                    <span className="text-2xl font-bold">{rating}</span>
                </div>
            </div>

            <div className="grid gap-6">
                {RATING_QUESTIONS.map((q) => (
                    <div key={q.id} className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-300">{q.label}</label>
                            {q.hint && <p className="text-xs text-gray-500 mt-1">{q.hint}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {q.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleChange(q.id, opt.value)}
                                    className={`
                                        p-3 text-left rounded-md border text-sm transition-all
                                        {(typeof value[q.id] === 'number' ? value[q.id] : 0) === opt.value
                                            ? 'bg-white text-black border-white'
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Boolean Flags */}
            <div className="border-t border-white/10 pt-6 space-y-4">
                {BOOLEAN_FLAGS.map((flag) => (
                    <label key={flag.id} className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={value[flag.id] === true}
                            onChange={(e) => handleFlagChange(flag.id, e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{flag.label}</span>
                            <p className="text-xs text-gray-500">{flag.desc}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    )
}
