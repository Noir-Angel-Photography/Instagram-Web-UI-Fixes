// ==UserScript==
// @name         Instagram Image Quality Fix + Extras
// @namespace    https://www.noirangel.photo
// @version      1
// @description  Prevents Instagram from using srcset attributes anywhere on the site to load downscaled, lower-quality images. Also adds an status icon, an informational overlay, and a lightbox view for viewing photos in a larger view.
// @author       Noir Angel
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/raw/refs/heads/main/Tampermonkey/Instagram-Image-Quality-Fix.user.js
// @downloadURL  https://github.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/raw/refs/heads/main/Tampermonkey/Instagram-Image-Quality-Fix.user.js
// @supportURL   https://github.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/issues
// ==/UserScript==

(function() {
    'use strict';

    const ZOOM_SPEED = 0.005;
    let lastPath = window.location.pathname;

    const style = document.createElement('style');
    style.innerHTML = `
        span[id="ig-hd-peer-wrapper"], div[id="ig-hd-main-btn"] {
            margin: 0 !important; padding: 0 !important; border: none !important;
            width: 40px !important; height: 40px !important; display: inline-flex !important;
            align-items: center !important; justify-content: center !important; position: relative !important;
        }
        .ig-hd-btn-text {
            font-size: 10px !important; font-weight: 800 !important; line-height: 1 !important;
            border: 1.5px solid currentColor; border-radius: 4px; padding: 2px 3px;
            text-transform: uppercase; transition: color 0.1s ease, border-color 0.1s ease;
        }
        .ig-hd-state-needed .ig-hd-btn-text { color: #0095f6 !important; border-style: solid; }
        .is-loaded.ig-hd-state-needed .ig-hd-btn-text { color: #00c853 !important; }
        .ig-hd-state-native .ig-hd-btn-text { color: #8e8e8e !important; opacity: 0.6; border-style: dotted; }
        #ig-hd-main-btn { cursor: pointer !important; transition: transform 0.1s ease-out !important; }
        #ig-hd-main-btn:hover { transform: scale(1.05) !important; }
        .ig-hd-tooltip {
            position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);
            background: #121212 !important; color: #ffffff !important; border: 1px solid #333 !important;
            padding: 5px 10px !important; border-radius: 6px !important; font-size: 11px !important;
            font-weight: 600 !important; white-space: nowrap !important; pointer-events: none !important;
            opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease; z-index: 10000 !important;
        }
        #ig-hd-main-btn:hover .ig-hd-tooltip { opacity: 1; transform: translateX(-50%) translateY(-12px); }
        .ig-hd-overlay {
            position: fixed; background: rgba(18, 18, 18, 0.95) !important; color: #fff !important;
            padding: 10px 14px !important; border-radius: 8px !important; font-family: sans-serif !important;
            font-size: 12px !important; font-weight: 700 !important; line-height: 1.4 !important;
            pointer-events: none !important; z-index: 2147483647 !important; border: 1px solid rgba(255, 255, 255, 0.2) !important;
            backdrop-filter: blur(8px) !important; display: none;
        }
        .ig-hd-overlay.is-visible { display: block; }
        .ig-hd-overlay span { display: block; color: #00c853; font-size: 10px; text-transform: uppercase; margin-bottom: 2px; }
        #ig-hd-lightbox {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.98); z-index: 2147483647;
            display: none; flex-direction: column; overflow: hidden;
            backdrop-filter: blur(30px); user-select: none; touch-action: none;
        }
        #ig-hd-lightbox.is-open { display: flex; }
        #ig-hd-lb-img { position: absolute; max-width: none; max-height: none; transform-origin: 0 0; will-change: transform; pointer-events: none; }
        .ig-hd-lb-ui { position: absolute; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 2147483648; }
        .ig-hd-lb-btn {
            background: rgba(30,30,30,0.95); color: white; border: 1px solid rgba(255,255,255,0.2);
            padding: 10px 18px; border-radius: 8px; cursor: pointer; font-family: sans-serif;
            font-size: 12px; font-weight: 700; transition: all 0.2s;
        }
        .ig-hd-lb-btn:hover { background: #0095f6; border-color: #fff; transform: translateY(-1px); }
    `;
    document.head.appendChild(style);

    let lightboxState = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0, initialDist: 0 };

    const updateTransform = () => {
        const img = document.getElementById('ig-hd-lb-img');
        if (img) img.style.transform = `translate(${lightboxState.x}px, ${lightboxState.y}px) scale(${lightboxState.scale})`;
    };

    const getTouchDist = (touches) => {
        return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    };

    const centerImage = (customScale = null) => {
        const img = document.getElementById('ig-hd-lb-img');
        if (!img || img.naturalWidth === 0) return;
        if (customScale) { lightboxState.scale = customScale; }
        else {
            const padding = 60;
            lightboxState.scale = Math.min((window.innerWidth - padding) / img.naturalWidth, (window.innerHeight - padding) / img.naturalHeight);
        }
        lightboxState.x = (window.innerWidth / 2) - (img.naturalWidth * lightboxState.scale / 2);
        lightboxState.y = (window.innerHeight / 2) - (img.naturalHeight * lightboxState.scale / 2);
        updateTransform();
    };

    const createLightbox = () => {
        if (document.getElementById('ig-hd-lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'ig-hd-lightbox';
        lb.innerHTML = `<div class="ig-hd-lb-ui"><button class="ig-hd-lb-btn" id="ig-lb-fit">Fit Screen</button><button class="ig-hd-lb-btn" id="ig-lb-actual">1:1 Pixels</button><button class="ig-hd-lb-btn" id="ig-lb-close" style="background:#cc3333; border:none;">Close (Esc)</button></div><img id="ig-hd-lb-img" src="">`;
        document.body.appendChild(lb);

        lb.querySelector('#ig-lb-close').onclick = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
        lb.querySelector('#ig-lb-fit').onclick = () => centerImage();
        lb.querySelector('#ig-lb-actual').onclick = () => centerImage(1);

        lb.onmousedown = (e) => { 
            lightboxState.isDragging = true; 
            lightboxState.startX = e.clientX - lightboxState.x; 
            lightboxState.startY = e.clientY - lightboxState.y; 
        };
        window.onmousemove = (e) => { 
            if (!lightboxState.isDragging || !lb.classList.contains('is-open')) return; 
            lightboxState.x = e.clientX - lightboxState.startX; 
            lightboxState.y = e.clientY - lightboxState.startY; 
            updateTransform(); 
        };

        // --- TOUCH EVENTS (v72 PINCH-TO-ZOOM) ---
        lb.ontouchstart = (e) => {
            if (e.touches.length === 1) {
                lightboxState.isDragging = true;
                lightboxState.startX = e.touches[0].clientX - lightboxState.x;
                lightboxState.startY = e.touches[0].clientY - lightboxState.y;
            } else if (e.touches.length === 2) {
                lightboxState.isDragging = false; // Stop dragging to prioritize zoom
                lightboxState.initialDist = getTouchDist(e.touches);
            }
        };

        window.ontouchmove = (e) => {
            if (!lb.classList.contains('is-open')) return;
            if (e.cancelable) e.preventDefault();

            if (e.touches.length === 1 && lightboxState.isDragging) {
                lightboxState.x = e.touches[0].clientX - lightboxState.startX;
                lightboxState.y = e.touches[0].clientY - lightboxState.startY;
                updateTransform();
            } else if (e.touches.length === 2) {
                const currentDist = getTouchDist(e.touches);
                const zoomFactor = currentDist / lightboxState.initialDist;
                
                const prevScale = lightboxState.scale;
                lightboxState.scale *= zoomFactor;
                lightboxState.scale = Math.min(Math.max(0.02, lightboxState.scale), 25);
                
                // Center zoom on the midpoint between fingers
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                const actualZoom = lightboxState.scale / prevScale;
                lightboxState.x = midX - (midX - lightboxState.x) * actualZoom;
                lightboxState.y = midY - (midY - lightboxState.y) * actualZoom;
                
                lightboxState.initialDist = currentDist;
                updateTransform();
            }
        };

        window.onmouseup = () => { lightboxState.isDragging = false; };
        window.ontouchend = () => { lightboxState.isDragging = false; lightboxState.initialDist = 0; };

        lb.onwheel = (e) => {
            e.preventDefault();
            const prevScale = lightboxState.scale;
            lightboxState.scale += (-e.deltaY) * ZOOM_SPEED * lightboxState.scale;
            lightboxState.scale = Math.min(Math.max(0.02, lightboxState.scale), 25);
            const zoomFactor = lightboxState.scale / prevScale;
            lightboxState.x = e.clientX - (e.clientX - lightboxState.x) * zoomFactor;
            lightboxState.y = e.clientY - (e.clientY - lightboxState.y) * zoomFactor;
            updateTransform();
        };
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) { e.stopImmediatePropagation(); lb.classList.remove('is-open'); document.body.style.overflow = ''; } }, true);
    };

    const openLightbox = (url) => {
        createLightbox();
        const lb = document.getElementById('ig-hd-lightbox');
        const img = lb.querySelector('#ig-hd-lb-img');
        img.src = url;
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        const prepare = () => { requestAnimationFrame(() => centerImage()); };
        if (img.complete) prepare(); else img.onload = prepare;
    };

    const clearActiveOverlay = () => {
        const overlay = document.getElementById('ig-hd-global-overlay');
        if (overlay) overlay.classList.remove('is-visible');
    };

    const getTrueIntrinsicSize = (url) => {
        return new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.onload = () => resolve({ width: tempImg.naturalWidth, height: tempImg.naturalHeight });
            tempImg.onerror = () => resolve({ width: 0, height: 0 });
            tempImg.src = url;
        });
    };

    const getVisibleImage = (btn) => {
        const hub = btn.closest('article') || btn.closest('[role="dialog"]') || btn.closest('.x1yvgwvq') || btn.closest('.html-div.xdj266r');
        if (!hub) return null;
        const mediaWrappers = Array.from(hub.querySelectorAll('div[style*="padding-bottom"]')).filter(div => div.style.paddingBottom.includes('%'));
        const mainImages = mediaWrappers.map(wrap => wrap.querySelector('img')).filter(img => img !== null);
        if (mainImages.length === 0) return null;
        const dots = hub.querySelectorAll('._acnb');
        if (dots.length > 1) {
            let activeDotIndex = 0;
            dots.forEach((dot, i) => { if (dot.classList.contains('_acnf')) activeDotIndex = i; });
            return activeDotIndex === 0 ? mainImages[0] : mainImages[1];
        }
        return mainImages[0];
    };

    const showOverlay = async (btn) => {
        const img = getVisibleImage(btn);
        if (!img) return;
        let overlay = document.getElementById('ig-hd-global-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ig-hd-global-overlay';
            overlay.className = 'ig-hd-overlay';
            document.body.appendChild(overlay);
        }
        const rect = img.getBoundingClientRect();
        overlay.style.top = `${rect.top + 15}px`;
        overlay.style.left = `${rect.left + 15}px`;
        overlay.innerHTML = `<span>Checking...</span>`;
        overlay.classList.add('is-visible');
        overlay.dataset.activeImg = img.src;
        const size = await getTrueIntrinsicSize(img.src);
        if (overlay.dataset.activeImg !== img.src || !overlay.classList.contains('is-visible')) return;
        if (size.width > 0 && size.height > 0) {
            const gcd = (a, b) => b ? gcd(b, a % b) : a;
            const divisor = gcd(size.width, size.height);
            overlay.innerHTML = `<span>Full Resolution</span>${size.width} x ${size.height}<br><span>Aspect Ratio</span>${size.width / divisor}:${size.height / divisor}`;
        }
    };

    const updateBadgeUI = (badge, wasNeeded, isLoaded = false) => {
        const tooltip = badge.querySelector('.ig-hd-tooltip');
        if (!tooltip) return;
        if (wasNeeded) {
            badge.classList.remove('ig-hd-state-native');
            badge.classList.add('ig-hd-state-needed');
            if (isLoaded) { badge.classList.add('is-loaded'); tooltip.innerText = "Full resolution image loaded"; }
            else { badge.classList.remove('is-loaded'); tooltip.innerText = "Forcing full resolution..."; }
        } else {
            badge.classList.remove('ig-hd-state-needed', 'is-loaded');
            badge.classList.add('ig-hd-state-native');
            tooltip.innerText = "Native quality: No intervention required";
        }
    };

    const startStatusWatchdog = (img, badge) => {
        let attempts = 0;
        const check = setInterval(() => {
            if (img.complete && img.naturalWidth > 0) {
                updateBadgeUI(badge, img.dataset.hdNeeded === 'true', true);
                clearInterval(check);
            } else if (attempts > 100) clearInterval(check);
            attempts++;
        }, 10);
    };

    const injectBadge = (img) => {
        const hub = img.closest('article') || img.closest('[role="dialog"]') || img.closest('.x1yvgwvq') || img.closest('.html-div.xdj266r');
        if (!hub) return null;

        let actionSection = null;
        const sections = hub.querySelectorAll('section');
        for (const s of sections) {
            if (s.closest('ul') || s.closest('li')) continue;
            if (s.querySelector('svg[aria-label*="ike" i]')) { actionSection = s; break; }
        }
        if (!actionSection) return null;

        const likeIcon = actionSection.querySelector('svg[aria-label*="ike" i]');
        const likeBtn = likeIcon.closest('button') || likeIcon.closest('div[role="button"]');
        if (!likeBtn) return null;

        if (actionSection.innerText.includes("Reply") || likeBtn.parentElement.innerText.includes("Reply")) return null;

        let currentAnchor = likeBtn.closest('span') || likeBtn;

        while (currentAnchor.nextElementSibling) {
            const next = currentAnchor.nextElementSibling;
            const nextSVG = next.querySelector('svg');
            const label = nextSVG ? nextSVG.getAttribute('aria-label') || "" : "";
            const isComment = /omment/i.test(label);
            const isShare = /hare/i.test(label) || /irect/i.test(label);
            if (isComment || isShare) currentAnchor = next; else break;
        }

        if (currentAnchor.parentElement.querySelector('#ig-hd-peer-wrapper')) return null;

        const hdSpan = document.createElement('span');
        hdSpan.id = 'ig-hd-peer-wrapper';
        hdSpan.className = (likeBtn.closest('span') || likeBtn).className;

        const hdBtn = document.createElement('div');
        hdBtn.id = 'ig-hd-main-btn';
        hdBtn.className = likeBtn.className;
        hdBtn.setAttribute('role', 'button');
        hdBtn.addEventListener('mouseenter', () => showOverlay(hdBtn));
        hdBtn.addEventListener('mouseleave', clearActiveOverlay);
        hdBtn.addEventListener('click', (e) => { 
            e.preventDefault(); e.stopPropagation(); 
            const imgEl = getVisibleImage(hdBtn); 
            if (imgEl) openLightbox(imgEl.src); 
        });

        const badgeText = document.createElement('span');
        badgeText.className = 'ig-hd-btn-text';
        badgeText.innerText = 'HD';
        const tooltip = document.createElement('div');
        tooltip.className = 'ig-hd-tooltip';
        hdBtn.append(badgeText, tooltip);
        hdSpan.appendChild(hdBtn);

        currentAnchor.insertAdjacentElement('afterend', hdSpan);
        updateBadgeUI(hdBtn, img.dataset.hdNeeded === 'true', img.complete && img.naturalWidth > 0);
        startStatusWatchdog(img, hdBtn);
        return hdBtn;
    };

    const auditAndClean = (img) => {
        if (img.width > 0 && img.width < 150) return;
        if (img.hasAttribute('srcset')) {
            img.dataset.hdNeeded = 'true';
            img.removeAttribute('srcset');
            clearActiveOverlay();
        }
        if (!img.hasAttribute('sizes') || img.getAttribute('sizes') !== '100vw') img.setAttribute('sizes', '100vw');
        const hub = img.closest('article') || img.closest('[role="dialog"]') || img.closest('.x1yvgwvq') || img.closest('.html-div.xdj266r');
        let existingBadge = hub?.querySelector('#ig-hd-main-btn');
        if (!existingBadge) {
            let attempts = 0;
            const interval = setInterval(() => { if (injectBadge(img) || attempts > 20) clearInterval(interval); attempts++; }, 50);
        } else startStatusWatchdog(img, existingBadge);
    };

    const observer = new MutationObserver(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            clearActiveOverlay();
        }
        document.querySelectorAll('img').forEach(auditAndClean);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['srcset', 'sizes', 'src', 'class'] });
    document.querySelectorAll('img').forEach(auditAndClean);
    window.addEventListener('scroll', clearActiveOverlay, { passive: true });
    window.addEventListener('resize', clearActiveOverlay, { passive: true });
})();
