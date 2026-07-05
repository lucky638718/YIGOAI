import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagicRings from './components/MagicRings.js';
import ShapeGrid from './components/ShapeGrid.js';
import Strands from './components/Strands.js';
import { applySplitText, applyScrollFloat } from './components/TextAnimations.js';

gsap.registerPlugin(ScrollTrigger);

let activeInstances = [];


function destroyInstances() {
  activeInstances.forEach(inst => {
    if (inst && typeof inst.destroy === 'function') {
      inst.destroy();
    }
  });
  activeInstances = [];
}


const app = document.querySelector('#app');
const sidebar = document.querySelector('#pageSidebar');
const drawer = document.querySelector('#mobileDrawer');
const routeFlash = document.querySelector('.route-flash');
const menuButtons = document.querySelectorAll('.nav-toggle, .floating-menu');

const navItems = [
  ['/about', 'About'],
  ['/features', 'Features'],
  ['/pricing', 'Pricing'],
  ['/how-to-install', 'How To Install'],
  ['/guide', 'Guide'],
  ['/docs', 'Docs'],
  ['/support', 'Support'],
  ['/join', 'Join Us'],
];

const icon = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.8-1.6l9.9-10.2a.5.5 0 0 1 .9.5L12 8.7A1 1 0 0 0 13 10h7a1 1 0 0 1 .8 1.6l-9.9 10.2a.5.5 0 0 1-.9-.5l2-6A1 1 0 0 0 11 14z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19h8M4 17l6-6-6-6"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M7 2v2M17 2v2M7 20v2M17 20v2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="16" cy="8" r="6"/><path d="M13.7 17.7a6 6 0 1 1-7.4-7.4M15 6h1v4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
};

const sideGroups = [
  {
    label: 'Getting Started',
    links: [
      ['/docs', 'Overview', icon.book],
      ['/guide', 'Guide', icon.zap],
      ['/how-to-install', 'Install', icon.terminal],
    ],
  },
  {
    label: 'Features & Operations',
    links: [
      ['/features', 'Core Features', icon.terminal],
      ['/about', 'System Model', icon.cpu],
    ],
  },
  {
    label: 'Security & Licensing',
    links: [
      ['/support', 'Support', icon.shield],
      ['/pricing', 'Pro Tiers', icon.coin],
    ],
  },
];

const pages = {
  '/about': {
    title: 'About YIGO',
    eyebrow: 'Voice-first desktop AI',
    heading: 'CONTROL YOUR PC WITH <span>VOICE.</span>',
    body: 'YIGO turns natural speech into real desktop actions. It can open apps, organize files, read the screen, run commands, and keep working context across sessions.',
    side: 'System Model',
    html: () => `
      ${hero3d()}
      ${voicePanel()}
      ${featureGrid([
        ['Native Control', 'Control apps, files, browser, terminal, and desktop workflows from a single voice loop.'],
        ['Realtime Listening', 'Fast wake word flow, interruptible commands, and visible feedback for every action.'],
        ['Desktop Memory', 'Keep user preferences, recurring macros, and project context ready between sessions.'],
        ['Action Guardrails', 'Dangerous actions are confirmed before execution, with command history visible.'],
      ])}
      ${systemControl()}
    `,
  },
  '/features': {
    title: 'YIGO Features',
    eyebrow: 'Features & operations',
    heading: 'EVERYDAY TASKS. <span>AUTOMATED.</span>',
    body: 'A dedicated feature page for the real actions YIGO can run across your workstation.',
    side: 'Core Features',
    html: () => `
      ${mediaShowcase('Core Feature Matrix', '/Scroll/1.jpg')}
      ${featureGrid([
        ['Screen-aware clicking', 'Locate buttons and fields, then complete UI flows without manual navigation.'],
        ['Deep local search', 'Find files, folders, notes, screenshots, and app state using plain language.'],
        ['App management', 'Launch, focus, close, resize, and arrange apps as spoken commands.'],
        ['Mobile bridge', 'Push tasks to phone, sync quick commands, and keep notifications in one loop.'],
        ['Image generation', 'Create quick visuals, concepts, wallpapers, and generated assets.'],
        ['Inbox workflows', 'Draft, summarize, label, and triage messages with confirmation.'],
      ])}
      ${imageRail()}
    `,
  },
  '/pricing': {
    title: 'YIGO Pricing',
    eyebrow: 'Security & licensing',
    heading: 'CHOOSE YOUR <span>CONTROL LEVEL.</span>',
    body: 'Clear plans for local voice automation, from basic launcher commands to full desktop orchestration.',
    side: 'Pro Tiers',
    html: () => pricingPage(),
  },
  '/how-to-install': {
    title: 'Install YIGO',
    eyebrow: 'Easy setup',
    heading: 'INSTALL IN <span>MINUTES.</span>',
    body: 'Set up the local desktop engine, start the voice daemon, and connect your assistant.',
    side: 'Install',
    html: () => installPage(),
  },
  '/guide': {
    title: 'YIGO Guide',
    eyebrow: 'Usage guide',
    heading: 'SPEAK NATURALLY. <span>EXECUTE SAFELY.</span>',
    body: 'Use short commands for quick tasks and richer instructions for multi-step desktop workflows.',
    side: 'Guide',
    html: () => guidePage(),
  },
  '/docs': {
    title: 'YIGO Docs',
    eyebrow: 'Documentation core',
    heading: 'SYSTEM <span>OVERVIEW.</span>',
    body: 'YIGO is a voice-first desktop automation engine built to execute real operations on your local workstation.',
    side: 'Overview',
    html: () => docsPage(),
  },
  '/support': {
    title: 'YIGO Support',
    eyebrow: 'Support center',
    heading: 'HELP WHEN YOUR <span>WORKFLOW BREAKS.</span>',
    body: 'Get setup guidance, issue triage, and workflow recommendations for desktop automation.',
    side: 'Support',
    html: () => supportPage(),
  },
  '/join': {
    title: 'Join YIGO',
    eyebrow: 'Community',
    heading: 'BUILD WITH THE <span>EARLY CREW.</span>',
    body: 'Join the community, share macros, request integrations, and test new automation builds.',
    side: 'Join Us',
    html: () => joinPage(),
  },
  '/download': {
    title: 'Download YIGO',
    eyebrow: 'Desktop package',
    heading: 'DOWNLOAD <span>YIGO.</span>',
    body: 'Grab the desktop app, CLI core, and mobile bridge package from one dedicated page.',
    side: 'Download',
    html: () => downloadPage(),
  },
};

function hero3d() {
  return `
    <section class="hero-3d page-block">
      <div class="hero-copy">
        <div class="voice-chip"><span></span> Live desktop voice engine</div>
        <h2>Realtime assistant with a living 3D command core.</h2>
        <p>The 3D system view sits beside your docs and product pages so the site feels like a proper AI desktop product, not a flat brochure.</p>
        <div class="hero-actions">
          <a class="download-pill nav-route" href="/download" data-route="/download">Download YIGO</a>
          <a class="ghost-pill nav-route" href="/docs" data-route="/docs">${icon.book} Read Docs</a>
        </div>
      </div>
      <div class="spline-stage">
        <spline-viewer url="https://prod.spline.design/J3vF-eA7B3XWd1Gz/scene.splinecode"></spline-viewer>
        <div class="spline-fallback">
          <div class="orbit-core">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function pageIntro(page) {
  return `
    <section class="intro page-block">
      <div class="eyebrow">${icon.book}${page.eyebrow}</div>
      <h1>${page.heading}</h1>
      <p>${page.body}</p>
    </section>
  `;
}

function docsPage() {
  return `
    ${mediaShowcase('YIGO AI Documentation Banner', '/Scroll/laptop.jpg')}
    ${voicePanel()}
    ${featureGrid([
      ['Voice Input', 'Wake word and live speech enter a full-duplex command loop.'],
      ['AI Intent', 'The reasoning layer converts spoken goals into approved tool calls.'],
      ['Native OS Exec', 'Local tooling controls apps, windows, files, browser, and terminal tasks.'],
      ['Verification', 'YIGO checks results and reports status before moving to the next step.'],
    ])}
  `;
}

function voicePanel() {
  return `
    <section class="content-panel page-block">
      <div class="panel-heading">${icon.zap}<h2>What is Voice-First?</h2></div>
      <p>Traditional assistants wait for typed prompts. YIGO keeps the command loop spoken, fast, and interruptible: speak naturally, confirm actions, and let the desktop agent handle the repetitive work.</p>
      <div class="flow-grid">
        <div class="flow-step"><strong>1. Voice Input</strong><span>Full-duplex listening</span></div>
        <div class="flow-arrow">to</div>
        <div class="flow-step accent"><strong>2. AI Intent</strong><span>Reasoning and tools</span></div>
        <div class="flow-arrow">to</div>
        <div class="flow-step glow"><strong>3. Native OS Exec</strong><span>Desktop automation</span></div>
      </div>
    </section>
  `;
}

function mediaShowcase(label, src) {
  return `
    <section class="banner page-block" aria-label="${label}">
      <img src="${src}" alt="${label}" />
      <div class="banner-overlay"></div>
      <div class="banner-status"><span></span> Voice engine online</div>
    </section>
  `;
}

function featureGrid(items) {
  return `
    <section class="card-grid page-block">
      ${items.map(([title, text]) => `
        <article class="feature-card tilt-card">
          ${icon.spark}
          <h3>${title}</h3>
          <p>${text}</p>
        </article>
      `).join('')}
    </section>
  `;
}

function imageRail() {
  return `
    <section class="image-rail page-block">
      ${[1, 2, 3, 4, 5, 6].map((num) => `
        <article>
          <img src="/Scroll/${num}.jpg" alt="YIGO feature screenshot ${num}" />
          <span>Module ${String(num).padStart(2, '0')}</span>
        </article>
      `).join('')}
    </section>
  `;
}

function systemControl() {
  return `
    <section class="system-control page-block" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; align-items: center;">
      <div>
        <div class="eyebrow compact">${icon.cpu} Architecture</div>
        <h2>Total System Control.</h2>
        <p>Run terminals, automate UI, link your phone, and execute deep OS tasks hands-free.</p>
      </div>
      <div id="strands-container" aria-hidden="true" style="position: relative; width: 100%; height: 280px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.3);">
      </div>
    </section>
  `;
}

function pricingPage() {
  return `
    <section class="pricing-grid page-block" style="position: relative;">
      <div id="shape-grid-container" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:all; opacity: 0.5;"></div>
      ${[
        ['Free', '$0', 'Basic voice commands, app launch, standard support.'],
      ].map(([plan, price, text], index) => `
        <article class="pricing-card featured" style="max-width: 400px; margin: 0 auto; text-align: center;">
          <span>${plan}</span>
          <strong style="display: block; font-size: 3.5rem; margin: 1rem 0;">${price}<small style="font-size: 1rem;">/mo</small></strong>
          <p style="margin-bottom: 2rem;">${text}</p>
          <a class="download-pill nav-route" href="/download" data-route="/download" style="width: 100%;">Choose ${plan}</a>
        </article>
      `).join('')}
    </section>
  `;
}

function installPage() {
  return `
    <section class="split-section page-block">
      <div>
        <div class="eyebrow compact">${icon.terminal} Terminal setup</div>
        <h2>Install the local voice service.</h2>
        <p>Download the desktop package, start the voice listener, then connect the automation permissions you want YIGO to use.</p>
      </div>
      <div class="terminal-window">
        <div class="terminal-top"><span></span><span></span><span></span><strong>powershell - yigo-install</strong></div>
        <pre><code># Install the desktop assistant
winget install YIGO.Desktop

# Start the local voice service
yigo start --voice --desktop

status: listening, tools ready</code></pre>
        <button class="copy-command" type="button" data-copy="winget install YIGO.Desktop">${icon.book} Copy install</button>
      </div>
    </section>
    ${featureGrid([
      ['Step 1', 'Install the desktop build and allow microphone access.'],
      ['Step 2', 'Choose safe automation permissions for apps, files, and terminal.'],
      ['Step 3', 'Say the wake phrase and run your first command.'],
      ['Step 4', 'Create macros for tasks you repeat every day.'],
    ])}
  `;
}

function guidePage() {
  return `
    <section class="content-panel page-block">
      <div class="panel-heading">${icon.zap}<h2>Command Style</h2></div>
      <div class="guide-list">
        <div><strong>Quick action</strong><span>"Open Chrome and search my last project notes."</span></div>
        <div><strong>Multi-step task</strong><span>"Find invoices from June, move them to finance, and summarize totals."</span></div>
        <div><strong>Safe confirmation</strong><span>"Delete old temp files, but ask before removing anything permanent."</span></div>
      </div>
    </section>
    ${systemControl()}
  `;
}

function supportPage() {
  return `
    <section class="support-band page-block">
      <div>
        <div class="eyebrow compact">${icon.shield} Support</div>
        <h2>Setup help, bug reports, and workflow tuning.</h2>
        <p>Use the support page for install issues, app automation bugs, macro design, and beta feedback.</p>
      </div>
      <a class="download-pill nav-route" href="/join" data-route="/join">Join Support</a>
    </section>
    ${featureGrid([
      ['Install issues', 'Fix package, permissions, and voice listener startup problems.'],
      ['Automation bugs', 'Report mis-clicks, failed tools, and unreliable app flows.'],
      ['Macro review', 'Get help turning repetitive work into reusable commands.'],
      ['Roadmap requests', 'Ask for integrations and vote on upcoming modules.'],
    ])}
  `;
}

function joinPage() {
  return `
    <section class="join-hero page-block" style="position: relative; overflow: hidden; min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; background: url('/Scroll/bg-dark.jpg') center/cover no-repeat;">
      <div style="position: absolute; inset: 0; background: rgba(10, 10, 10, 0.75);"></div>
      <div id="magic-rings-container" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: 1; pointer-events:all; opacity: 0.6;"></div>
      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; padding: 2rem;">
        <div class="eyebrow">${icon.spark} Community access</div>
        <h2>Join the YIGO early access network.</h2>
        <p style="max-width: 600px;">Share macros, test new releases, and shape the desktop assistant with builders who actually automate their daily work.</p>
        <div class="hero-actions" style="justify-content: center;">
          <a class="download-pill nav-route" href="/download" data-route="/download">Get Early Access</a>
          <a class="ghost-pill nav-route" href="/docs" data-route="/docs">${icon.book} Read Docs</a>
        </div>
      </div>
    </section>
  `;
}

function downloadPage() {
  return `
    <section class="download-grid page-block" style="display: flex; justify-content: center;">
      ${[
        ['Desktop App', 'Windows voice assistant package with local automation service.'],
      ].map(([title, text]) => `
        <article class="download-card" style="width: 100%; max-width: 420px; text-align: center;">
          ${icon.arrow}
          <h3>${title}</h3>
          <p style="margin-bottom: 2rem;">${text}</p>
          <button type="button" class="download-pill" style="width: 100%;">Download</button>
        </article>
      `).join('')}
    </section>
  `;
}

function renderNavigation() {
  const links = navItems.map(([path, label]) => `<a class="nav-route" href="${path}" data-route="${path}">${label}</a>`).join('');
  drawer.innerHTML = `${links}<a class="download-pill nav-route" href="/download" data-route="/download">Download YIGO</a>`;

  sidebar.innerHTML = sideGroups.map((group) => `
    <div class="sidebar-group">
      <h2>${group.label}</h2>
      ${group.links.map(([path, label, svg]) => `
        <a class="side-link nav-route" href="${path}" data-route="${path}">
          ${svg}<span>${label}</span>
        </a>
      `).join('')}
    </div>
  `).join('');
}

function normalizeRoute(pathname) {
  if (pathname === '/' || pathname === '') return '/about';
  return pages[pathname] ? pathname : '/docs';
}

function closeDrawer() {
  drawer.classList.remove('open');
  document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
}

function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === route);
  });
}

function bindPageControls() {
  document.querySelectorAll('.copy-command').forEach((button) => {
    button.addEventListener('click', async () => {
      const original = button.textContent.trim();
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
      window.setTimeout(() => {
        button.innerHTML = `${icon.book} ${original}`;
      }, 1400);
    });
  });

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
      card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function animatePage() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // Animate sections as they scroll in
  document.querySelectorAll('.page-block').forEach((block) => {
    gsap.fromTo(
      block,
      { autoAlpha: 0, y: 40, filter: 'blur(12px)', scale: 0.97 },
      {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: block,
          start: 'top 88%',
        }
      }
    );
  });

  // Stagger cards inside grids
  document.querySelectorAll('.card-grid, .pricing-grid, .download-grid, .image-rail').forEach((grid) => {
    const cards = grid.querySelectorAll('.feature-card, .pricing-card, .download-card, article');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 30, filter: 'blur(5px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.65,
          ease: 'back.out(1.2)',
          stagger: 0.1,
          scrollTrigger: {
            trigger: grid,
            start: 'top 85%',
          }
        }
      );
    }
  });
}

function render(route, replace = false) {
  const page = pages[route] ?? pages['/docs'];
  document.title = `${page.title} - YIGO AI`;

  if (!replace) {
    gsap.fromTo(routeFlash, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.22, ease: 'power2.in' });
  }

  window.setTimeout(() => {
    destroyInstances();
    
    app.innerHTML = `${pageIntro(page)}${page.html()}${footer()}`;
    setActiveNav(route);
    bindPageControls();
    
    const ringsContainer = document.getElementById('magic-rings-container');
    if (ringsContainer) {
      activeInstances.push(new MagicRings(ringsContainer));
    }

    const shapeGridContainer = document.getElementById('shape-grid-container');
    if (shapeGridContainer) {
      activeInstances.push(new ShapeGrid(shapeGridContainer, { 
        hoverFillColor: '#21F1A8',
        borderColor: 'rgba(255, 255, 255, 0.06)'
      }));
    }

    const strandsContainer = document.getElementById('strands-container');
    if (strandsContainer) {
      activeInstances.push(new Strands(strandsContainer, {
        colors: ["#21F1A8","#140036","#135965"],
        count: 3,
        speed: 0.5,
        amplitude: 1,
        waviness: 1,
        thickness: 0.7,
        glow: 2.6,
        taper: 3,
        spread: 1,
        intensity: 0.6,
        saturation: 1.5,
        opacity: 1,
        scale: 1.5,
        glass: false,
        refraction: 1,
        dispersion: 1,
        glassSize: 1
      }));
    }

    animatePage();

    // Apply text animations to headings AFTER animatePage() kills old triggers
    app.querySelectorAll('h1').forEach(el => applySplitText(el));
    app.querySelectorAll('h2').forEach(el => applyScrollFloat(el));

    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: replace ? 'auto' : 'smooth' });
    gsap.to(routeFlash, { scaleX: 0, transformOrigin: 'right', duration: 0.34, ease: 'power2.out', delay: 0.04 });
  }, replace ? 0 : 160);
}

function footer() {
  return `
    <footer class="site-footer page-block">
      <div>
        <a class="brand footer-brand nav-route" href="/about" data-route="/about">
          <img src="/img/logo.png" alt="" class="brand-logo" />
          <span>YIGO</span>
        </a>
        <p>2026 YIGO AI. All rights reserved.</p>
        <p style="font-size: 0.6rem; margin-top: 0.2rem; color: var(--accent); opacity: 0.7; letter-spacing: 0.05em;">SARDAR JAPNAM SINGH LALL</p>
      </div>
      <div class="footer-links">
        <a class="nav-route" href="/pricing" data-route="/pricing">Pricing & Tiers</a>
        <a class="nav-route" href="/download" data-route="/download">Download</a>
        <a class="nav-route" href="/join" data-route="/join">Join Us</a>
      </div>
      <div class="status-card">
        <div><span></span> Operational</div>
        <strong>YIGO Desktop v1.6.0</strong>
      </div>
    </footer>
  `;
}

function navigate(path, replace = false) {
  const route = normalizeRoute(path);
  if (!replace && route === normalizeRoute(window.location.pathname)) return;

  if (replace) {
    history.replaceState({ route }, '', route);
  } else {
    history.pushState({ route }, '', route);
  }

  closeDrawer();
  render(route, replace);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('.nav-route');
  if (!link) return;

  event.preventDefault();
  navigate(link.dataset.route || new URL(link.href).pathname);
});

menuButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', String(isOpen));
  });
});

window.addEventListener('popstate', () => {
  render(normalizeRoute(window.location.pathname), true);
});

renderNavigation();
navigate(window.location.pathname, true);

gsap.fromTo('.topbar', { y: -90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power4.out' });
gsap.fromTo('.docs-sidebar', { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', delay: 0.15 });


function initHackerCanvas() {
  const canvas = document.getElementById('hacker-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  const characters = 'YIGO AI SYSTEM 010101 MATRIX HACK COMMAND OVERRIDE ENCRYPT'.split('');
  const fontSize = 14;
  let columns = width / fontSize;
  let drops = [];
  for (let x = 0; x < columns; x++) { drops[x] = 1; }
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = width / fontSize;
    drops = [];
    for (let x = 0; x < columns; x++) { drops[x] = 1; }
  });
  function draw() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(33, 241, 168, 0.25)';
    ctx.font = fontSize + 'px "Orbitron"';
    for (let i = 0; i < drops.length; i++) {
      const text = characters[Math.floor(Math.random() * characters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > height && Math.random() > 0.975) { drops[i] = 0; }
      drops[i]++;
    }
  }
  setInterval(draw, 35);
}

initHackerCanvas();
