import gsap from 'gsap';

/**
 * The header title's letters are `display:none` in the stylesheet and typed in
 * one by one after a beat.
 */
export function initTitleReveal() {
  const letters = document.querySelectorAll('.navigator-title .title span');
  if (!letters.length) return;
  gsap.to(letters, { delay: 1, display: 'inline', stagger: { amount: 1 } });
}

/**
 * The site menu is a plain hamburger dropdown: pages, contact details and
 * social links. It closes on Escape, on an outside click and on navigation.
 */
export function initMenu() {
  const button = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const dropdown = document.querySelector<HTMLElement>('#site-menu');
  if (!button || !dropdown) return;

  let open = false;

  function setOpen(next: boolean) {
    if (next === open) return;
    open = next;
    button!.setAttribute('aria-expanded', String(open));
    button!.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

    if (open) {
      dropdown!.hidden = false;
      gsap.fromTo(
        dropdown!,
        { autoAlpha: 0, y: -8 },
        { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    } else {
      gsap.to(dropdown!, {
        autoAlpha: 0,
        y: -8,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          dropdown!.hidden = true;
        },
      });
    }
  }

  button.addEventListener('click', () => setOpen(!open));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!open) return;
    const target = e.target as Node;
    if (dropdown.contains(target) || button.contains(target)) return;
    setOpen(false);
  });

  dropdown.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
}
