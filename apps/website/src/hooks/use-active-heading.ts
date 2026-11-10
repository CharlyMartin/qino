import type { MarkdownToc } from "@qino/cms";
import { useEffect, useState } from "react";

// Leeway below a heading's scroll margin, so a heading jumped to counts as read.
const READ_LINE_SLACK = 16;

/** The id of the last heading scrolled past the sticky header. */
export function useActiveHeading(toc: MarkdownToc) {
  const [activeId, setActiveId] = useState(toc[0]?.id);

  useEffect(() => {
    const headings = toc
      .map(({ id }) => document.getElementById(id))
      .filter((heading) => heading != null);
    let frame = 0;

    function update() {
      frame = 0;
      const { scrollY, innerHeight } = window;
      // Short last sections never reach the top, so the bottom selects them.
      const atBottom =
        scrollY > 0 &&
        scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
      const passed = atBottom
        ? headings
        : headings.filter((heading) => {
            const margin = Number.parseFloat(
              getComputedStyle(heading).scrollMarginTop,
            );
            return (
              heading.getBoundingClientRect().top <= margin + READ_LINE_SLACK
            );
          });

      setActiveId((passed.at(-1) ?? headings[0])?.id);
    }

    function scheduleUpdate() {
      if (frame == 0) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [toc]);

  return activeId;
}
