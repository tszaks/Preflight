import { useState, useEffect } from 'react'

interface AgeRatingProps {
    value: any;
    onChange: (value: any) => void;
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
    const [rating, setRating] = useState<string>("4+")

    useEffect(() => {
        calculateRating(value)
    }, [value])

    const calculateRating = (a: any) => {
        // 17+ triggers (per Apple's Age Rating questionnaire)
        if (a.prolongedViolence === 2 ||
            a.sexualContent === 2 ||
            a.gamblingSimulated === 2 ||
            a.gamblingContests > 0) {
            setRating("17+")
            return
        }
        // 12+ triggers
        if (a.realisticViolence > 0 ||
            a.sexualContent > 0 ||
            a.matureSuggestive === 2 ||
            a.alcoholDrugs === 2 ||
            a.gamblingSimulated > 0) {
            setRating("12+")
            return
        }
        // 9+ triggers
        if (a.cartoonViolence === 2 ||
            a.matureSuggestive > 0 ||
            a.profanity === 2 ||
            a.horrorFear === 2) {
            setRating("9+")
            return
        }
        // Default 4+
        setRating("4+")
    }

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
                    <p className="text-sm text-gray-500 font-light">Determine your app's suitable audience</p>
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
                                        ${(value[q.id] || 0) === opt.value
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
                            checked={value[flag.id] || false}
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
