// Single Page App Navigation
class WindsorLakeApp {
    constructor() {
        this.currentPage = 'home';
        this.contentArea = document.querySelector('.content-area');
        this.aboutWheelHandler = null;
        this.homeWheelHandler = null;
        this.contactWheelHandler = null;
        this.menuWheelHandler = null;
        this.isNavigating = false; // Global navigation lock
        this.swipeDirection = null; // Track swipe direction for animations
        this.init();
    }

    init() {
        // Set up navigation listeners
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.navigateTo(page);
            });
        });

        // Handle logo click to go home
        document.querySelector('.logo').addEventListener('click', () => {
            this.navigateTo('home');
        });

        // Handle home button click
        const homeButton = document.querySelector('.home-button');
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                this.navigateTo('home');
            });
        }

        // Mobile menu functionality
        this.initializeMobileMenu();

        // Initialize home page scroll listener
        this.initializeHomeScroll();

        // Fade in content on initial page load with directional animation
        setTimeout(() => {
            const body = document.body;
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            const isDesktop = window.innerWidth > 768;

            if (isDesktop) {
                // Add initial load animations (header down, content up)
                body.classList.add('initial-load');
                setTimeout(() => body.classList.remove('initial-load'), 800);
            }

            this.contentArea.classList.add('loaded');
            if (footer) footer.classList.add('loaded');
        }, 100);

        console.log('Windsor Lake App initialized');
    }

    initializeMobileMenu() {
        const hamburger = document.querySelector('.hamburger-menu');
        const menuOverlay = document.querySelector('.mobile-menu-overlay');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

        // Toggle menu when hamburger is clicked
        hamburger.addEventListener('click', () => {
            menuOverlay.classList.toggle('active');
        });

        // Close menu when clicking overlay (outside drawer)
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
            }
        });

        // Handle mobile navigation links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);

                // Close menu
                menuOverlay.classList.remove('active');

                // Navigate to page
                this.navigateTo(page);
            });
        });
    }

    async navigateTo(page, options = {}) {
        if (this.currentPage === page || this.isNavigating) return;

        this.isNavigating = true;
        console.log('Navigating to:', page);

        // Clean up about page wheel listener if leaving about page
        if (this.currentPage === 'about' && this.aboutWheelHandler) {
            document.removeEventListener('wheel', this.aboutWheelHandler);
            this.aboutWheelHandler = null;
        }

        // Clean up home page wheel listener if leaving home page
        if (this.currentPage === 'home' && this.homeWheelHandler) {
            document.removeEventListener('wheel', this.homeWheelHandler);
            this.homeWheelHandler = null;
        }

        // Clean up contact page wheel listener if leaving contact page
        if (this.currentPage === 'contact' && this.contactWheelHandler) {
            document.removeEventListener('wheel', this.contactWheelHandler);
            this.contactWheelHandler = null;
        }

        // Clean up menu page wheel listener if leaving menu page
        if (this.currentPage === 'menu' && this.menuWheelHandler) {
            document.removeEventListener('wheel', this.menuWheelHandler);
            this.menuWheelHandler = null;
        }

        const header = document.querySelector('header');
        const body = document.body;
        const isDesktop = window.innerWidth > 768;
        const isMobile = window.innerWidth <= 768;
        const isLeavingHome = this.currentPage === 'home' && page !== 'home';
        const isGoingHome = page === 'home';

        // Determine slide direction for mobile
        const pageOrder = ['home', 'about', 'contact', 'menu', 'order'];
        const currentIndex = pageOrder.indexOf(this.currentPage);
        const nextIndex = pageOrder.indexOf(page);
        const isMovingForward = nextIndex > currentIndex;

        // On mobile, use swipeDirection if set (from touch), otherwise use page order
        let slideDirection = null;
        if (isMobile) {
            if (this.swipeDirection) {
                slideDirection = this.swipeDirection;
            } else {
                slideDirection = isMovingForward ? 'left' : 'right';
            }
        }

        // Fade out background logo when returning to home
        if (isDesktop && isGoingHome) {
            body.classList.add('transitioning-content');
        }

        // Update menu indicator early for integrated animation
        // Add delay only when leaving home for the first time
        if (isLeavingHome) {
            setTimeout(() => this.updateMenuIndicator(page), 150);
        } else {
            // Immediate update for all other transitions
            this.updateMenuIndicator(page);
        }

        // Add slide-out class for mobile
        if (isMobile && slideDirection) {
            body.classList.add(`slide-out-${slideDirection}`);
        }

        // Fade out menu and current content
        await this.fadeOut();

        // Desktop-only transitions
        if (isDesktop) {
            if (isLeavingHome) {
                // Fade out header for transition
                header.classList.add('transitioning-out');
                await new Promise(resolve => setTimeout(resolve, 300));
            } else if (isGoingHome) {
                // Fade out compact header when going home
                header.classList.add('transitioning-out');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Load new page content
        this.loadPage(page, options);

        // Add/remove about page class for mobile footer hiding
        if (page === 'about') {
            body.classList.add('on-about-page');
        } else {
            body.classList.remove('on-about-page');
        }

        // Update layout mode (desktop only)
        if (isDesktop) {
            if (isGoingHome) {
                body.classList.remove('page-mode');
                header.classList.remove('compact', 'transitioning-out');
                // Add class to trigger home animation
                body.classList.add('returning-home');
                // Remove transitioning-content when going home
                body.classList.remove('transitioning-content');
                setTimeout(() => body.classList.remove('returning-home'), 800);
            } else if (isLeavingHome) {
                body.classList.add('transitioning-content');  // Add BEFORE page-mode to prevent instant opacity change
                body.classList.add('page-mode');
                header.classList.add('compact');
                header.classList.remove('transitioning-out');
            }
        }

        // Remove slide-out class and add slide-in class for mobile
        if (isMobile && slideDirection) {
            body.classList.remove(`slide-out-${slideDirection}`);
            // Slide in from opposite direction
            const slideInDirection = slideDirection === 'left' ? 'right' : 'left';
            body.classList.add(`slide-from-${slideInDirection}`);
        }

        // Wait for DOM to be ready before fading in
        await new Promise(resolve => setTimeout(resolve, 50));

        // Fade in new content and header
        await this.fadeIn(isLeavingHome && isDesktop);

        this.currentPage = page;

        // Clean up slide classes and reset swipe direction
        if (isMobile && slideDirection) {
            const slideInDirection = slideDirection === 'left' ? 'right' : 'left';
            setTimeout(() => {
                body.classList.remove(`slide-from-${slideInDirection}`);
                this.swipeDirection = null;
            }, 500);
        }

        // Release navigation lock after animations complete
        setTimeout(() => {
            this.isNavigating = false;
        }, 400);
    }

    fadeOut() {
        return new Promise(resolve => {
            const footer = document.querySelector('footer');

            this.contentArea.classList.remove('loaded');
            if (footer) footer.classList.remove('loaded');

            setTimeout(resolve, 300);
        });
    }

    fadeIn(shouldFadeInLogo = false) {
        return new Promise(resolve => {
            const footer = document.querySelector('footer');
            const body = document.body;

            this.contentArea.classList.add('loaded');
            if (footer) footer.classList.add('loaded');

            // Fade in background logo only when entering page-mode (leaving home)
            if (shouldFadeInLogo) {
                setTimeout(() => {
                    body.classList.remove('transitioning-content');
                }, 50);
            }

            setTimeout(resolve, 300);
        });
    }

    loadPage(page, options = {}) {
        switch (page) {
            case 'home':
                this.contentArea.innerHTML = this.getHomePage();
                this.reinitializeCarousel();
                this.initializeHomeScroll();
                break;
            case 'menu':
                this.contentArea.innerHTML = this.getMenuPage();
                this.initializeMenuScroll();
                break;
            case 'about':
                this.contentArea.innerHTML = this.getAboutPage();
                this.initializeAboutScroll(options.startAtLastSection);
                break;
            case 'contact':
                this.contentArea.innerHTML = this.getContactPage();
                this.initializeContactForm();
                this.initializeContactScroll();
                break;
            case 'order':
                this.contentArea.innerHTML = this.getOrderPage();
                break;
            default:
                this.contentArea.innerHTML = this.getHomePage();
                this.reinitializeCarousel();
                this.initializeHomeScroll();
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    initializeHomeScroll() {
        const isMobile = window.innerWidth <= 768;

        this.homeWheelHandler = (e) => {
            if (this.isNavigating) return;

            const delta = e.deltaY;

            // Only trigger on scroll down
            if (delta > 0) {
                e.preventDefault();
                this.navigateTo('about');
            }
        };

        document.addEventListener('wheel', this.homeWheelHandler, { passive: false });

        // Touch support for mobile ONLY - horizontal swipe navigation
        if (isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;

            const handleTouchStart = (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            };

            const handleTouchEnd = (e) => {
                if (this.isNavigating) return;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchStartX - touchEndX;
                const deltaY = Math.abs(touchStartY - touchEndY);

                // Only trigger if horizontal swipe is dominant (not vertical)
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
                    // Swipe left (right to left) - go forward to About
                    if (deltaX > 0) {
                        this.swipeDirection = 'left';
                        this.navigateTo('about');
                    }
                    // Swipe right (left to right) - would go back but we're on home
                }
            };

            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    }

    initializeAboutScroll(startAtLastSection = false) {
        const sections = document.querySelectorAll('.about-page section');
        const navDots = document.querySelectorAll('.section-nav-dot');
        let currentSectionIndex = startAtLastSection ? 3 : 0; // Start at section 3 if coming from Contact

        if (!sections.length || !navDots.length) return;

        // Function to show a specific section
        const showSection = (index) => {
            if (index < 0 || index >= sections.length) return;

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            sections[index].classList.add('active');

            // Update dots
            navDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            currentSectionIndex = index;
        };

        // If starting at last section, show it immediately
        if (startAtLastSection) {
            showSection(3);
        }

        // Handle dot clicks
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSection(index);
            });
        });

        // Handle mouse wheel scrolling
        let isScrolling = false;
        this.aboutWheelHandler = (e) => {
            if (isScrolling || this.isNavigating) return;

            const delta = e.deltaY;
            const activeSection = sections[currentSectionIndex];

            if (!activeSection) return;

            // Get the active section's position relative to viewport
            const sectionRect = activeSection.getBoundingClientRect();
            const sectionBottom = sectionRect.bottom;
            const sectionTop = sectionRect.top;
            const viewportHeight = window.innerHeight;

            // Check if we're at the bottom or top of the active section
            const isAtSectionBottom = sectionBottom <= viewportHeight + 10; // 10px threshold
            const isAtSectionTop = sectionTop >= -10; // 10px threshold

            // Scroll up from first section - go to home
            if (delta < 0 && currentSectionIndex === 0 && isAtSectionTop) {
                e.preventDefault();
                this.navigateTo('home');
                return;
            }

            // Scroll down from last section (section 3: "A hub for arts & community") - go to contact
            if (delta > 0 && currentSectionIndex === 3 && isAtSectionBottom) {
                e.preventDefault();
                this.navigateTo('contact');
                return;
            }

            // Only trigger section transitions if:
            // - Scrolling down: at bottom of current section
            // - Scrolling up: at top of current section
            if (delta > 0 && currentSectionIndex < sections.length - 1 && isAtSectionBottom) {
                // Scroll down to next section
                e.preventDefault();
                isScrolling = true;
                showSection(currentSectionIndex + 1);
                setTimeout(() => { isScrolling = false; }, 300);
            } else if (delta < 0 && currentSectionIndex > 0 && isAtSectionTop) {
                // Scroll up to previous section
                e.preventDefault();
                isScrolling = true;
                showSection(currentSectionIndex - 1);
                setTimeout(() => { isScrolling = false; }, 300);
            }
        };

        document.addEventListener('wheel', this.aboutWheelHandler, { passive: false });

        // Touch support for mobile ONLY - horizontal swipe navigation
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;

            const handleTouchStart = (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            };

            const handleTouchEnd = (e) => {
                if (this.isNavigating || isScrolling) return;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchStartX - touchEndX;
                const deltaY = Math.abs(touchStartY - touchEndY);

                // Only trigger if horizontal swipe is dominant
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
                    isScrolling = true;

                    // Swipe left (right to left) - go forward
                    if (deltaX > 0) {
                        if (currentSectionIndex < sections.length - 1) {
                            // Next section
                            showSection(currentSectionIndex + 1);
                        } else {
                            // Last section, go to Contact
                            this.swipeDirection = 'left';
                            this.navigateTo('contact');
                        }
                    }
                    // Swipe right (left to right) - go backward
                    else {
                        if (currentSectionIndex > 0) {
                            // Previous section
                            showSection(currentSectionIndex - 1);
                        } else {
                            // First section, go to Home
                            this.swipeDirection = 'right';
                            this.navigateTo('home');
                        }
                    }

                    setTimeout(() => { isScrolling = false; }, 300);
                }
            };

            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        // Set initial active dot (unless we're starting at last section)
        if (!startAtLastSection) {
            navDots[0]?.classList.add('active');
        }
    }

    initializeContactScroll() {
        let lastScrollTop = 0;

        this.contactWheelHandler = (e) => {
            if (this.isNavigating) return;

            const delta = e.deltaY;
            const contactPage = document.querySelector('.contact-page');
            if (!contactPage) return;

            const scrollTop = contactPage.scrollTop;
            const scrollHeight = contactPage.scrollHeight;
            const clientHeight = contactPage.clientHeight;

            // Calculate if we're at boundaries with a small threshold
            const isAtTop = scrollTop <= 1;
            const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;

            // Track if user was already at boundary on previous scroll
            const wasAtTop = lastScrollTop <= 1;
            const wasAtBottom = Math.abs(scrollHeight - clientHeight - lastScrollTop) <= 1;

            // Only trigger navigation if:
            // 1. User is scrolling in direction of boundary
            // 2. Already at that boundary
            // 3. Was at boundary on previous scroll (prevents first scroll from triggering)

            // Scroll up from top
            if (delta < 0 && isAtTop && wasAtTop) {
                e.preventDefault();
                this.navigateTo('about', { startAtLastSection: true });
                return;
            }

            // Scroll down from bottom
            if (delta > 0 && isAtBottom && wasAtBottom) {
                e.preventDefault();
                this.navigateTo('menu');
                return;
            }

            // Update last scroll position
            lastScrollTop = scrollTop;
        };

        document.addEventListener('wheel', this.contactWheelHandler, { passive: false });

        // Touch support for mobile ONLY - horizontal swipe navigation
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;

            const handleTouchStart = (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            };

            const handleTouchEnd = (e) => {
                if (this.isNavigating) return;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchStartX - touchEndX;
                const deltaY = Math.abs(touchStartY - touchEndY);

                // Only trigger if horizontal swipe is dominant
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
                    // Swipe left (right to left) - go forward to Menu
                    if (deltaX > 0) {
                        this.swipeDirection = 'left';
                        this.navigateTo('menu');
                    }
                    // Swipe right (left to right) - go backward to About (last section)
                    else {
                        this.swipeDirection = 'right';
                        this.navigateTo('about', { startAtLastSection: true });
                    }
                }
            };

            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    }

    initializeMenuScroll() {
        this.menuWheelHandler = (e) => {
            if (this.isNavigating) return;

            const delta = e.deltaY;

            // Scroll up - go back to Contact
            if (delta < 0) {
                e.preventDefault();
                this.navigateTo('contact');
            }
            // Scroll down - progress to Order Online
            else if (delta > 0) {
                e.preventDefault();
                this.navigateTo('order');
            }
        };

        document.addEventListener('wheel', this.menuWheelHandler, { passive: false });

        // Touch support for mobile ONLY - horizontal swipe navigation
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;

            const handleTouchStart = (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            };

            const handleTouchEnd = (e) => {
                if (this.isNavigating) return;
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchStartX - touchEndX;
                const deltaY = Math.abs(touchStartY - touchEndY);

                // Only trigger if horizontal swipe is dominant
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
                    // Swipe left (right to left) - go forward to Order Online
                    if (deltaX > 0) {
                        this.swipeDirection = 'left';
                        this.navigateTo('order');
                    }
                    // Swipe right (left to right) - go backward to Contact
                    else {
                        this.swipeDirection = 'right';
                        this.navigateTo('contact');
                    }
                }
            };

            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }
    }

    reinitializeCarousel() {
        // Immediately reinitialize carousel with DOM ready
        if (window.heroCarousel) {
            window.heroCarousel.carouselTrack = document.querySelector('.carousel-track');
            window.heroCarousel.buildCarousel();
        }
    }

    getHomePage() {
        return `
            <div class="hero-container">
                <div class="carousel-track">
                    <!-- Images will be injected here by JavaScript -->
                </div>
                <h1 class="hero-title">
                    <span class="social">CASUAL</span>
                    <span class="market">MARKET</span>
                    <span class="cafe">& CAFE</span>
                </h1>
                <div class="swipe-indicator">
                    <i class="fa-solid fa-hand-pointer"></i>
                </div>
            </div>
        `;
    }

    getAboutPage() {
        return `
            <div class="about-page">
                <!-- Section Navigation Dots -->
                <div class="section-nav">
                    <div class="section-nav-dot" data-section="0"></div>
                    <div class="section-nav-dot" data-section="1"></div>
                    <div class="section-nav-dot" data-section="2"></div>
                    <div class="section-nav-dot" data-section="3"></div>
                </div>

                <div class="about-sections-container">
                    <!-- Section 1: Introduction -->
                    <section class="about-intro active" data-section-id="0">
                    <div class="about-content">
                        <h2>Welcome to Windsor Lake Cafe & Marketplace</h2>
                        <p>Located in the heart of Old Town Windsor, we are a family-owned gathering place dedicated to serving more than just a great cup of coffee. Since opening our doors in 2018, our mission has been simple: to create a cozy, vibrant space where our community can connect over locally sourced goods, house-made treats, and the best ice cream in Northern Colorado.</p>
                        <p>Whether you're stopping by for a morning jumpstart, a relaxing lunch, or an evening treat with the family, we're here to make your day a little sweeter.</p>
                    </div>
                    <div class="about-image">
                        <img src="assets/images/carousel/coffe_in_mug.jpg" alt="Coffee at Windsor Lake">
                    </div>
                </section>

                <!-- Section 2: Philosophy -->
                <section class="about-philosophy" data-section-id="1">
                    <div class="about-image">
                        <img src="assets/images/carousel/blueberry_cupcakes.jpg" alt="Fresh Baked Goods">
                    </div>
                    <div class="about-content">
                        <h2>Locally Sourced, Lovingly Prepared</h2>
                        <p>We believe that great food starts with great neighbors. That's why we source locally from suppliers dedicated to quality.</p>
                        <ul class="source-list">
                            <li><strong>Coffee:</strong> We proudly brew Coda Coffee, a Denver-based company known for their exceptional, ethically sourced beans.</li>
                            <li><strong>Dairy:</strong> Our milk and cream come fresh from Morning Fresh Dairy in Bellvue, ensuring your lattes and steamers are rich and delicious.</li>
                            <li><strong>Ice Cream:</strong> We bring the city to the suburbs by serving Little Man Ice Cream, a Denver icon famous for its unique flavors and handmade quality.</li>
                        </ul>
                    </div>
                </section>

                <!-- Section 3: Menu Highlights -->
                <section class="about-menu" data-section-id="2">
                    <div class="about-content">
                        <h2>From Breakfast to Dessert</h2>
                        <p>Our kitchen is always busy whipping up house-made favorites.</p>
                        <ul class="menu-highlights">
                            <li><strong>Bakery & Breakfast:</strong> Start your day with our freshly baked pastries, pies, and hearty breakfast options.</li>
                            <li><strong>Lunch:</strong> Enjoy our selection of sandwiches, soups, and savory bites perfect for a midday break.</li>
                            <li><strong>Dietary Friendly:</strong> We strive to be inclusive with a variety of Gluten-Free options, ensuring everyone can find something to enjoy.</li>
                            <li><strong>Ice Cream Concoctions:</strong> It's never too cold for ice cream! Treat yourself to a scoop, a shake, or one of our signature sundaes.</li>
                        </ul>
                    </div>
                    <div class="about-image">
                        <img src="assets/images/carousel/tomato_egg_grilled_cheese_black_coffee.jpg" alt="Delicious Food">
                    </div>
                </section>

                <!-- Section 4: Community -->
                <section class="about-community" data-section-id="3">
                    <div class="about-image">
                        <img src="assets/images/carousel/red_soda_fountain_sign_hero_bg.jpg" alt="Community Space">
                    </div>
                    <div class="about-content">
                        <h2>A Hub for Art & Community</h2>
                        <p>We are proud to be a canvas for our town's creativity. Our walls feature a rotating selection of art and handcrafted goods from local artists, all available for sale. When you visit us, you aren't just supporting a small business; you're supporting the local creative community.</p>
                    </div>
                </section>
                </div>
            </div>
        `;
    }

    getMenuPage() {
        return `<div class="page-content"><h2>Menu</h2><p>Menu page coming soon...</p></div>`;
    }

    getContactPage() {
        // Initialize Google Maps and tab switching after a delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeMap();
            this.initializeContactTabs();
        }, 200);

        return `
            <div class="contact-page">
                <h2 class="contact-title">Get in Touch</h2>

                <div class="contact-grid">
                    <!-- Left Column: Tab Navigation & Content -->
                    <div class="contact-left">
                        <div class="contact-tabs">
                            <button class="tab-button active" data-tab="location">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span>Location & Hours</span>
                            </button>
                            <button class="tab-button" data-tab="urgent">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                                <span>Give Us a Call</span>
                            </button>
                            <button class="tab-button" data-tab="contact">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <span>Send a Message</span>
                            </button>
                        </div>

                        <div class="tab-content-wrapper">
                            <!-- Tab 1: Location & Hours -->
                            <div class="tab-content active" id="tab-location">
                                <div class="location-info">
                                    <div class="location-left">
                                        <p class="address">430 Main St, Windsor, CO 80550</p>
                                        <div class="hours-info">
                                            <h4>Hours</h4>
                                            <p>Sunday - Thursday: 8:00 am - 7:00 pm</p>
                                            <p>Friday & Saturday: 8:00 am - 8:00 pm</p>
                                        </div>
                                    </div>
                                    <div class="location-right">
                                        <div class="contact-blurbs">
                                            <p class="blurb">We are open 7 days a week for dine-in and carry-out!</p>
                                            <p class="blurb">Follow us on social media for daily soup specials and seasonal updates!</p>
                                        </div>
                                    </div>
                                </div>
                                <div id="google-map" class="map-container"></div>
                            </div>

                            <!-- Tab 2: Urgent Help -->
                            <div class="tab-content" id="tab-urgent">
                                <div class="urgent-content">
                                    <h3>Give Us a Call</h3>
                                    <p class="urgent-description">General questions, order issues, or need to cancel?</p>
                                    <div class="phone-cta">
                                        <a href="tel:+19704454124" class="phone-button">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                            </svg>
                                            (970) 445-4124
                                        </a>
                                    </div>
                                    <p class="urgent-note">We'll get you sorted out immediately</p>
                                </div>
                            </div>

                            <!-- Tab 3: Contact Form -->
                            <div class="tab-content" id="tab-contact">
                                <h3>Get in Touch</h3>
                                <p class="form-description">For general inquiries, catering requests, or feedback</p>
                                <form class="contact-form" id="contact-form">
                                    <input type="text" id="contact-name" name="name" placeholder="Name *" required />

                                    <div class="form-row-compact">
                                        <input type="email" id="contact-email" name="email" placeholder="Email *" required />
                                        <input type="tel" id="contact-phone" name="phone" placeholder="Phone Number" />
                                    </div>

                                    <select id="contact-topic" name="topic" required>
                                        <option value="">Select a topic... *</option>
                                        <option value="general">General Question</option>
                                        <option value="order">Order Issue</option>
                                        <option value="catering">Catering & Events</option>
                                    </select>

                                    <textarea id="contact-message" name="message" rows="4" placeholder="Message *" required></textarea>

                                    <button type="submit" class="btn-submit">Send Message</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Order Tracker & FAQ -->
                    <div class="contact-right">
                        <div class="order-tracker-card">
                            <h3>Track Your Order</h3>
                            <p class="tracker-description">Order status, update or cancel your order here.</p>
                            <div class="tracker-input-group">
                                <input type="text" id="order-number" placeholder="Enter Order #" />
                                <button type="button" class="btn-track">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="m21 21-4.35-4.35"/>
                                    </svg>
                                </button>
                            </div>
                            <p class="tracker-note">For Bakery Pre-Orders, use the tracker to make changes</p>
                        </div>

                        <div class="faq-card">
                            <h3>Quick Answers</h3>
                            <div class="faq-items">
                                <div class="faq-item">
                                    <h4>Where do I park?</h4>
                                    <p>Dedicated lot out front, with overflow parking behind neighboring businesses.</p>
                                </div>
                                <div class="faq-item">
                                    <h4>Order wait time?</h4>
                                    <p>15-20 minutes typically. Peak hours may take slightly longer.</p>
                                </div>
                                <div class="faq-item">
                                    <h4>Bakery pre-orders?</h4>
                                    <p>We require 48 hours notice for all bakery pre-orders.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeMap() {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.warn('Leaflet not loaded yet');
            setTimeout(() => this.initializeMap(), 100);
            return;
        }

        const mapElement = document.getElementById('google-map');
        if (!mapElement) {
            console.warn('Map element not found');
            return;
        }

        // Clear any existing map instance
        if (mapElement._leaflet_id) {
            mapElement._leaflet_map = null;
            delete mapElement._leaflet_id;
        }
        mapElement.innerHTML = '';

        const location = [40.480202, -104.903839]; // Windsor Lake Cafe coordinates [lat, lng]

        // Initialize the map
        const map = L.map('google-map', {
            center: location,
            zoom: 16,
            zoomControl: false, // Disable zoom buttons
            scrollWheelZoom: true
        });

        // Store reference for later invalidation
        mapElement._leaflet_map = map;

        // Layer 1: Base map (land, water, parks)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
            className: 'map-base-layer'
        }).addTo(map);

        // Layer 2: Roads only from MapTiler
        L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=odMWIBIAtvBoJo0GxMOc', {
            maxZoom: 20,
            className: 'map-roads-layer',
            opacity: 0.8
        }).addTo(map);

        // Layer 3: Labels on top
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
            className: 'map-labels-layer'
        }).addTo(map);

        // Create custom marker icon in brand color
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: 40px;
                    height: 40px;
                    background-color: #FF6666;
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        width: 12px;
                        height: 12px;
                        background-color: white;
                        border-radius: 50%;
                        transform: rotate(45deg);
                    "></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        // Add marker with popup
        const marker = L.marker(location, { icon: customIcon }).addTo(map);
        marker.bindPopup(`
            <div style="text-align: center; font-family: 'Quicksand', sans-serif;">
                <strong style="color: #FF6666; font-size: 0.9rem;">Windsor Lake Cafe & Marketplace</strong><br>
                <span style="color: #555; font-size: 0.85rem;">430 Main St, Windsor, CO 80550</span><br>
                <a href="https://www.google.com/maps/dir/?api=1&destination=40.480202,-104.903839"
                   target="_blank"
                   style="color: #FF6666; text-decoration: none; font-weight: 600; margin-top: 0.5rem; display: inline-block; font-size: 0.85rem;">
                   Get Directions →
                </a>
            </div>
        `);

        // Optional: Open popup by default
        marker.openPopup();
    }

    initializeContactTabs() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            if (tabButtons.length === 0) return;

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');

                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));

                    // Add active class to clicked button and corresponding content
                    button.classList.add('active');
                    const targetContent = document.getElementById(`tab-${targetTab}`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }

                    // Re-initialize map when location tab is opened (fixes map rendering issue)
                    if (targetTab === 'location') {
                        setTimeout(() => {
                            const map = document.querySelector('#google-map');
                            if (map && map._leaflet_id) {
                                // Leaflet map exists, invalidate size to fix rendering
                                const leafletMap = map._leaflet_map;
                                if (leafletMap) {
                                    leafletMap.invalidateSize();
                                }
                            }
                        }, 50);
                    }
                });
            });
        }, 100);
    }

    getOrderPage() {
        return `<div class="page-content"><h2>Order Online</h2><p>Order page coming soon...</p></div>`;
    }

    initializeContactForm() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const contactForm = document.getElementById('contact-form');
            const trackButton = document.querySelector('.btn-track');
            const orderNumberInput = document.getElementById('order-number');

            // Handle order tracking
            if (trackButton && orderNumberInput) {
                trackButton.addEventListener('click', () => {
                    const orderNumber = orderNumberInput.value.trim();
                    if (orderNumber) {
                        alert(`Tracking order #${orderNumber}. This feature will be connected to your order management system.`);
                        // TODO: Connect to actual order tracking system
                    } else {
                        alert('Please enter an order number.');
                    }
                });

                // Allow Enter key to submit order tracking
                orderNumberInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        trackButton.click();
                    }
                });
            }

            // Handle contact form submission
            if (contactForm) {
                contactForm.addEventListener('submit', (e) => {
                    e.preventDefault();

                    // Get form values
                    const formData = {
                        name: document.getElementById('contact-name').value.trim(),
                        email: document.getElementById('contact-email').value.trim(),
                        phone: document.getElementById('contact-phone').value.trim(),
                        topic: document.getElementById('contact-topic').value,
                        message: document.getElementById('contact-message').value.trim()
                    };

                    // Validate required fields
                    if (!formData.name || !formData.email || !formData.topic || !formData.message) {
                        alert('Please fill in all required fields.');
                        return;
                    }

                    // Email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                        alert('Please enter a valid email address.');
                        return;
                    }

                    // Success feedback
                    console.log('Form submitted:', formData);
                    alert(`Thank you, ${formData.name}! We've received your message and will get back to you soon.`);

                    // TODO: Connect to backend/email service
                    // This is where you'd send the data to Supabase or your email service

                    // Reset form
                    contactForm.reset();
                });
            }
        }, 100);
    }

    updateMenuIndicator(page) {
        const indicator = document.querySelector('.menu-indicator');
        if (!indicator) return;

        // Reset to initial state (home position) - far left, 50px width
        if (page === 'home') {
            indicator.style.left = '0px';
            indicator.style.width = '50px';
            return;
        }

        const navLinks = document.querySelectorAll('nav a[data-page]');
        if (!navLinks.length) return;

        // Find the link for the current page
        let targetLink = null;
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                targetLink = link;
            }
        });

        if (!targetLink) return;

        // Get the position and width of the target link
        const linkRect = targetLink.getBoundingClientRect();
        const navRect = targetLink.closest('nav').getBoundingClientRect();

        // Calculate position relative to nav
        const left = linkRect.left - navRect.left;
        const width = linkRect.width;

        // Update indicator position and width
        indicator.style.left = `${left}px`;
        indicator.style.width = `${width}px`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.windsorLakeApp = new WindsorLakeApp();
});
