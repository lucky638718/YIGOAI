import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function processNode(node, charElements, isScrollFloat = false) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (!text.trim()) return node.cloneNode(true);

    const fragment = document.createDocumentFragment();
    const words = text.split(/(\s+)/);

    words.forEach(word => {
      if (word.trim() === '') {
        fragment.appendChild(document.createTextNode(word));
        return;
      }

      const wordDiv = document.createElement('div');
      wordDiv.className = isScrollFloat ? 'scroll-float-word' : 'split-word';
      wordDiv.style.display = 'inline-block';
      wordDiv.style.whiteSpace = 'nowrap';

      word.split('').forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.className = isScrollFloat ? 'char' : 'split-char';
        charDiv.style.display = 'inline-block';
        charDiv.style.willChange = 'transform, opacity';
        charDiv.textContent = char;
        wordDiv.appendChild(charDiv);
        charElements.push(charDiv);
      });

      fragment.appendChild(wordDiv);
    });
    return fragment;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const newElement = node.cloneNode(false);
    // ensure spans inside remain inline-block so characters don't stack
    if (newElement.tagName.toLowerCase() === 'span') {
      newElement.style.display = 'inline-block';
    }
    Array.from(node.childNodes).forEach(child => {
      newElement.appendChild(processNode(child, charElements, isScrollFloat));
    });
    return newElement;
  }
  return node.cloneNode(true);
}

export function applySplitText(element, options = {}) {
  const {
    delay = 50,
    duration = 1.25,
    ease = 'power3.out',
    from = { opacity: 0, y: 40 },
    to = { opacity: 1, y: 0 },
    threshold = 0.1,
    rootMargin = '-100px',
  } = options;

  const charElements = [];
  const newContent = processNode(element, charElements, false);
  element.innerHTML = '';
  element.appendChild(newContent);

  const startPct = (1 - threshold) * 100;
  const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
  const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
  const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
  const sign = marginValue === 0 ? '' : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
  const start = `top ${startPct}%${sign}`;

  gsap.fromTo(charElements, from, {
    ...to,
    duration,
    ease,
    stagger: delay / 1000,
    scrollTrigger: {
      trigger: element,
      start,
      once: true,
      fastScrollEnd: true,
      anticipatePin: 0.4,
    },
    force3D: true,
  });
}

export function applyScrollFloat(element, options = {}) {
  const {
    animationDuration = 1,
    ease = 'back.inOut(2)',
    scrollStart = 'center bottom+=50%',
    scrollEnd = 'bottom bottom-=40%',
    stagger = 0.03
  } = options;

  const charElements = [];
  const newContent = processNode(element, charElements, true);
  element.innerHTML = '';
  element.classList.add('scroll-float-container');
  element.style.overflow = 'hidden';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'scroll-float-text';
  wrapper.style.display = 'inline-block';
  wrapper.appendChild(newContent);
  element.appendChild(wrapper);

  gsap.fromTo(charElements, {
    opacity: 0,
    yPercent: 120,
    scaleY: 2.3,
    scaleX: 0.7,
    transformOrigin: '50% 0%',
  }, {
    duration: animationDuration,
    ease: ease,
    opacity: 1,
    yPercent: 0,
    scaleY: 1,
    scaleX: 1,
    stagger: stagger,
    scrollTrigger: {
      trigger: element,
      start: scrollStart,
      end: scrollEnd,
      scrub: true,
    }
  });
}
