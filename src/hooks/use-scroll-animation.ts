import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation() {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        gsap.fromTo(
            element,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%", // Animation starts when top of element hits 85% of viewport height
                    toggleActions: "play none none none", // Animate once and stay visible
                },
            }
        );

        const handleLoad = () => {
            ScrollTrigger.refresh();
        };

        window.addEventListener("load", handleLoad);
        // Also refresh after a small delay to catch any late layout shifts
        const refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 500);

        return () => {
            window.removeEventListener("load", handleLoad);
            clearTimeout(refreshTimeout);
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
    }, []);

    return elementRef;
}
