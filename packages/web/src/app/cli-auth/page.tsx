import { Suspense } from 'react'
import CLIAuthForm from './cli-auth-form'

export default function CLIAuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-gray-500">Loading...</div>
            </div>
        }>
            <CLIAuthForm />
        </Suspense>
    )
}
