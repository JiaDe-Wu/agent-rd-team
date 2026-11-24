// Brand motion: implement it from the README, "Motion interface". Here it is a placeholder with no animation: pages work, just without motion.
export const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Change el's text to text (for changing digits)
export function flip(el, text) {
  if (el) el.textContent = text
}

// Cards and list items appear one after another (add is-in to each)
export function reveal(items) {
  for (const it of items) it.classList.add('is-in')
}

// Tap feedback: make el bounce
export function bump(el) {}

// Play a celebration on the full-screen canvas
export function celebrate(canvas) {}
