export function countUp(node: HTMLElement, options: { target: number; duration?: number; prefix?: string; suffix?: string } = { target: 0 }) {
    const { target, duration = 2000, prefix = '', suffix = '' } = options;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        node.textContent = `${prefix}${target}${suffix}`;
        return { destroy() {} };
    }

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            animate();
            observer.disconnect();
        }
    }, { threshold: 0.5 });

    observer.observe(node);

    function animate() {
        const start = performance.now();

        function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
            const current = Math.round(target * eased);

            node.textContent = `${prefix}${current}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    return {
        destroy() {
            observer.disconnect();
        }
    };
}
