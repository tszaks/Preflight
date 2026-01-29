<script lang="ts">
    let { data } = $props();

    type FeedbackRow = {
        title: string;
        category: string;
        severity: string;
        helpful: number;
        false_positive: number;
        total: number;
        fp_rate: number;
    };

    let feedbackData: FeedbackRow[] = $derived(data.feedbackData ?? []);

    function rateColor(rate: number): string {
        if (rate > 50) return 'text-red-500';
        if (rate >= 20) return 'text-orange-400';
        return 'text-green-400';
    }
</script>

<div class="max-w-6xl mx-auto px-6 py-10">
    <header class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">Feedback Dashboard</h1>
        <p class="text-sm text-gray-400 mt-1">False positive rates by finding title</p>
        {#if feedbackData.length > 0}
            <p class="text-xs text-gray-500 mt-2">{feedbackData.length} finding titles with feedback</p>
        {/if}
    </header>

    {#if feedbackData.length === 0}
        <div class="text-center py-20 text-gray-500">
            <p class="text-lg">No feedback data yet</p>
            <p class="text-sm mt-2">Feedback will appear here once users mark findings as helpful or false positive.</p>
        </div>
    {:else}
        <div class="overflow-x-auto rounded-lg border border-gray-700">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-800 text-gray-300 uppercase text-xs tracking-wider">
                    <tr>
                        <th class="px-4 py-3">Title</th>
                        <th class="px-4 py-3">Category</th>
                        <th class="px-4 py-3 text-center">Helpful</th>
                        <th class="px-4 py-3 text-center">False Positive</th>
                        <th class="px-4 py-3 text-center">Total</th>
                        <th class="px-4 py-3 text-center">FP Rate</th>
                        <th class="px-4 py-3">Severity</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    {#each feedbackData as row (row.category + '::' + row.title)}
                        <tr class="hover:bg-gray-800/50 transition-colors">
                            <td class="px-4 py-3 font-medium text-gray-200">{row.title}</td>
                            <td class="px-4 py-3 text-gray-400">{row.category}</td>
                            <td class="px-4 py-3 text-center text-green-400">{row.helpful}</td>
                            <td class="px-4 py-3 text-center text-red-400">{row.false_positive}</td>
                            <td class="px-4 py-3 text-center text-gray-300">{row.total}</td>
                            <td class="px-4 py-3 text-center font-bold {rateColor(row.fp_rate)}">{row.fp_rate}%</td>
                            <td class="px-4 py-3">
                                <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase
                                    {row.severity === 'critical' ? 'bg-red-900/40 text-red-400' :
                                     row.severity === 'warning' ? 'bg-yellow-900/40 text-yellow-400' :
                                     row.severity === 'info' ? 'bg-blue-900/40 text-blue-400' :
                                     'bg-green-900/40 text-green-400'}">
                                    {row.severity}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
