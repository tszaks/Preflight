import CLIAuthForm from './cli-auth-form'

export default async function CLIAuthPage({
    searchParams,
}: {
    searchParams: Promise<{ redirect_to?: string; error?: string }>
}) {
    const { redirect_to, error } = await searchParams

    return <CLIAuthForm redirectTo={redirect_to} error={error} />
}
