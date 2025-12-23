// ==UserScript==
// @name         Instagram Ghost Click Fix
// @namespace    https://www.noirangel.photo
// @version      1.1
// @description  Prevents the "ghost click" bug on Instagram mobile web where tapping the background overlay incorrectly triggers a click on the profile grid below.
// @author       Noir Angel
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/refs/heads/main/Tampermonkey/Instagram-Ghost-Click-Fix
// @downloadURL  https://raw.githubusercontent.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/refs/heads/main/Tampermonkey/Instagram-Ghost-Click-Fix
// @supportURL   https://github.com/Noir-Angel-Photography/Instagram-Web-UI-Fixes/issues
// ==/UserScript==

(function() {
    'use strict';

    let isCooldown = false;

    /**
     * The logic:
     * When you tap the background to close a popup, mobile browsers often
     * fire a "ghost click" ~300ms later on the element that is now visible.
     * This script catches and kills that click within a short window.
     */

    // 1. Kill any click event that occurs while the cooldown is active
    document.addEventListener('click', function(e) {
        if (isCooldown) {
            console.log('[Fix] Ghost click intercepted and blocked.');
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true); // "true" ensures we catch it in the capturing phase

    // 2. Watch for the initial touch to start the cooldown
    document.addEventListener('touchstart', function(e) {
        // Find the open post dialog
        const dialog = document.querySelector('div[role="dialog"]');
        
        // If no dialog is open, we don't need to do anything
        if (!dialog) return;

        // Check if we are tapping the overlay container identified earlier
        const overlay = e.target.closest('div.x1n2onr6.xzkaem6');

        // Logic: If we touched the overlay but NOT the actual content of the dialog
        if (overlay && !dialog.contains(e.target)) {
            console.log('[Fix] Background tap detected. Blocking clicks for 450ms.');
            
            isCooldown = true;
            
            // Set a timer to turn the grid back on after the browser's 
            // click-delay window has passed.
            setTimeout(() => {
                isCooldown = false;
                console.log('[Fix] Cooldown expired. Interface responsive.');
            }, 450);
        }
    }, { capture: true, passive: true });

})();
