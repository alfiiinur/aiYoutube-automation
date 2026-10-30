"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Seluruh efek GSAP landing page. Semua animasi memakai pola `from`
 * sehingga konten tetap terlihat jika animasi dimatikan — dan seluruh
 * efek dilewati saat pengguna memilih prefers-reduced-motion.
 */
export function useLandingFx(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      /* ---------- nav: blur setelah scroll ---------- */
      ScrollTrigger.create({
        start: 24,
        toggleClass: { targets: "[data-nav]", className: "is-scrolled" },
      });

      /* ---------- hero: entrance ---------- */
      gsap.from("[data-hero-item]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.1,
      });

      /* ---------- hero: parallax saat scroll ---------- */
      gsap.to("[data-hero-visual]", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      });

      /* ---------- hero: 3D tilt mengikuti mouse ---------- */
      const stage = scope.querySelector<HTMLElement>("[data-tilt-stage]");
      const card = scope.querySelector<HTMLElement>("[data-tilt-card]");
      if (stage && card) {
        gsap.set(card, { transformPerspective: 1400 });
        const rX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" });
        const rY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" });
        const chips = gsap.utils.toArray<HTMLElement>("[data-chip]");
        const move = (e: MouseEvent) => {
          const r = stage.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rY(px * 16);
          rX(-py * 12);
          chips.forEach((chip, i) => {
            const depth = (i + 1) * 9;
            gsap.to(chip, { x: px * depth, y: py * depth, duration: 0.7, ease: "power3.out" });
          });
        };
        const leave = () => {
          rX(0);
          rY(0);
          chips.forEach((chip) => gsap.to(chip, { x: 0, y: 0, duration: 0.7, ease: "power3.out" }));
        };
        stage.addEventListener("mousemove", move);
        stage.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          stage.removeEventListener("mousemove", move);
          stage.removeEventListener("mouseleave", leave);
        });
      }

      /* ---------- hero: chip mengambang ---------- */
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((elm, i) => {
        gsap.to(elm, {
          y: -9 - i * 2,
          duration: 2.4 + i * 0.35,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      /* ---------- angka statistik: count-up ---------- */
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((elm) => {
        const parsed = Number(elm.dataset.count ?? "0");
        const target = Number.isFinite(parsed) ? parsed : 0;
        const suffix = elm.dataset.suffix || "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: elm, start: "top 88%", once: true },
          onUpdate: () => {
            elm.textContent = `${Math.round(obj.v).toLocaleString("id-ID")}${suffix}`;
          },
        });
      });

      /* ---------- fitur: kartu flip 3D saat masuk viewport ---------- */
      gsap.utils.toArray<HTMLElement>("[data-flip]").forEach((elm, i) => {
        gsap.from(elm, {
          rotationY: i % 2 === 0 ? -50 : 50,
          opacity: 0,
          y: 48,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: elm, start: "top 88%", once: true },
        });
      });

      /* ---------- cara kerja: kartu menumpuk + menyusut saat discroll ---------- */
      const stacks = gsap.utils.toArray<HTMLElement>("[data-stack]");
      stacks.forEach((elm, i) => {
        if (i === stacks.length - 1) return;
        gsap.to(elm, {
          scale: 0.92,
          rotationX: 5,
          opacity: 0.5,
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: { trigger: stacks[i + 1], start: "top bottom", end: "top top+=140", scrub: true },
        });
      });

      /* ---------- showcase: horizontal scroll dengan pin ---------- */
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const track = scope.querySelector<HTMLElement>("[data-htrack]");
        if (!track) return;
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hwrap]",
            start: "top top",
            end: () => `+=${track.scrollWidth - window.innerWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-hinner]").forEach((inner) => {
          gsap.fromTo(
            inner,
            { xPercent: -6 },
            {
              xPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: "[data-hwrap]",
                start: "top top",
                end: () => {
                  const t = scope.querySelector<HTMLElement>("[data-htrack]");
                  return `+=${(t?.scrollWidth ?? window.innerWidth) - window.innerWidth}`;
                },
                scrub: 1,
              },
            },
          );
        });
      });

      /* ---------- fade naik generik ---------- */
      gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((elm) => {
        gsap.from(elm, {
          y: 48,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: elm, start: "top 90%", once: true },
        });
      });

      /* ---------- headline CTA: parallax huruf ---------- */
      gsap.from("[data-cta-line]", {
        yPercent: 60,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-cta]", start: "top 80%", once: true },
      });
    }, scope);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [root]);
}
