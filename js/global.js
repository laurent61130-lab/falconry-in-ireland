document.addEventListener('alpine:init', () => {

    // =========================================================
    // STORE PRINCIPAL : app
    // Contient l'état global et les méthodes réutilisables
    // =========================================================
    Alpine.store('app', {

        // ---------------------------------------------------------
        // MOBILE MENU
        // ---------------------------------------------------------
        mobileMenuOpen: false,

        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
        },

        closeMobileMenu() {
            this.mobileMenuOpen = false;
            document.body.style.overflow = '';
        },

        // ---------------------------------------------------------
        // THEME : dark / light mode
        // Persisted in localStorage for returning visitors
        // ---------------------------------------------------------
        darkMode: false,

        initTheme() {
            const saved = localStorage.getItem('falconry-theme');
            if (saved) {
                this.darkMode = saved === 'dark';
            } else {
                this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            this.applyTheme();
        },

        toggleTheme() {
            this.darkMode = !this.darkMode;
            this.applyTheme();
            localStorage.setItem('falconry-theme', this.darkMode ? 'dark' : 'light');
        },

        applyTheme() {
            document.documentElement.classList.toggle('dark', this.darkMode);
        },

        // ---------------------------------------------------------
        // NOTIFICATION SYSTEM
        // Display transient messages across the site
        // ---------------------------------------------------------
        notifications: [],
        _notifCounter: 0,

        
        notify(message, type = 'info', duration = 4000) {
            const id = ++this._notifCounter;
            this.notifications.push({ id, message, type, visible: true });

            setTimeout(() => {
                this.dismissNotification(id);
            }, duration);
        },

        dismissNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications[index].visible = false;
                // Remove from array after fade-out transition (300ms)
                setTimeout(() => {
                    this.notifications = this.notifications.filter(n => n.id !== id);
                }, 350);
            }
        },

        // ---------------------------------------------------------
        // SMOOTH SCROLL
        // Scrolls to any element by CSS selector with offset support
        // ---------------------------------------------------------

        
        scrollTo(selector, offset = 80) {
            const target = document.querySelector(selector);
            if (!target) return;

            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });

            // Close mobile menu if open before navigating
            this.closeMobileMenu();
        },

        // ---------------------------------------------------------
        // SCROLL POSITION TRACKING
        // Useful for sticky header styles, back-to-top button, etc.
        // ---------------------------------------------------------
        scrollY: 0,
        isScrolled: false,
        scrollThreshold: 60,

        initScrollTracking() {
            const handleScroll = () => {
                this.scrollY = window.pageYOffset;
                this.isScrolled = this.scrollY > this.scrollThreshold;
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            // Run once on load to set initial state
            handleScroll();
        },

        // ---------------------------------------------------------
        // SCROLL-REVEAL ANIMATION
        // Uses IntersectionObserver to add 'is-visible' class to elements
        // with [data-reveal] attribute as they enter the viewport
        // ---------------------------------------------------------
        initScrollReveal() {
            if (!('IntersectionObserver' in window)) {
                // Fallback: make everything visible immediately
                document.querySelectorAll('[data-reveal]').forEach(el => {
                    el.classList.add('is-visible');
                });
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        // Stop observing once revealed (one-shot animation)
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.12,
                rootMargin: '0px 0px -40px 0px'
            });

            document.querySelectorAll('[data-reveal]').forEach(el => {
                observer.observe(el);
            });
        },

        // ---------------------------------------------------------
        // FORM VALIDATION UTILITIES
        // Lightweight helpers for the Contact / Booking forms
        // ---------------------------------------------------------
        validation: {

            isEmail(value) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
            },

            isPhone(value) {
                // Accepts Irish and international formats
                return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,5}[-\s\.]?[0-9]{4,8}$/.test(value.trim());
            },

            isRequired(value) {
                return value !== null && value !== undefined && String(value).trim().length > 0;
            },

            minLength(value, min) {
                return String(value).trim().length >= min;
            },

            maxLength(value, max) {
                return String(value).trim().length <= max;
            }
        },

        // ---------------------------------------------------------
        // BOOKING ENQUIRY STATE
        // Shared state for booking form used across multiple pages
        // ---------------------------------------------------------
        booking: {
            submitted: false,
            loading: false,
            error: null,

            reset() {
                this.submitted = false;
                this.loading = false;
                this.error = null;
            }
        },

        // ---------------------------------------------------------
        // GLOBAL INIT
        // Call this once on page load to wire up all features
        // ---------------------------------------------------------
        init() {
            this.initTheme();
            this.initScrollTracking();
            this.initScrollReveal();
        }

    });

});

// =========================================================
// AUTO-INITIALISATION
// Trigger global init after Alpine has fully started
// =========================================================
document.addEventListener('alpine:initialized', () => {
    Alpine.store('app').init();
});

// =========================================================
// CLOSE MOBILE MENU ON ESCAPE KEY
// Accessible keyboard interaction
// =========================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const store = Alpine.store('app');
        if (store && store.mobileMenuOpen) {
            store.closeMobileMenu();
        }
    }
});

// =========================================================
// CLOSE MOBILE MENU ON RESIZE TO DESKTOP
// Prevents menu staying open when viewport changes
// =========================================================
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        const store = Alpine.store('app');
        if (store && store.mobileMenuOpen) {
            store.closeMobileMenu();
        }
    }
}, { passive: true });