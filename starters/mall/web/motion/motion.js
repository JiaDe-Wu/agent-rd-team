// Brand motion: the motion designer implements it from the README, "Motion interface". Here it is a placeholder with no animation: pages work, just without motion.
export const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Change el's text to text (for the countdown digits)
export function flip(el, text) {
  if (el) el.textContent = text
}

// Product cards appear one after another (add is-in to each)
export function reveal(cards) {
  for (const c of cards) c.classList.add('is-in')
}

// When something is added to the cart, make el (the cart badge) bounce
export function bump(el) {}

// When the sale goes live, play a celebration on the full-screen canvas
export function celebrate(canvas) {}
