export function reveal(node: HTMLElement, options: { threshold?: number; delay?: number; duration?: number } = {}) {
    const { threshold = 0.15, delay = 0, duration = 600 } = options;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        return { destroy() {} };
    }

    node.style.opacity = '0';
    node.style.transform = 'translateY(24px)';
    node.style.transition = `opacity ${duration}ms var(--ease-out-expo) ${delay}ms, transform ${duration}ms var(--ease-out-expo) ${delay}ms`;

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
            observer.disconnect();
        }
    }, { threshold });

    observer.observe(node);

    return {
        destroy() {
            observer.disconnect();
        }
    };
}
