// Supabase Configuration
const SUPABASE_URL = 'https://oumpmbgbtziklwiqjrhm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bXBtYmdidHppa2x3aXFqcmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNzMzNTEsImV4cCI6MjA1MDY0OTM1MX0.GMs0i4qtMWvjkVu8_CtyUw_kuaa8WBN';

// Initialize Supabase client (with error handling)
let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
    } else {
        console.log('Supabase library not loaded, using local images only');
    }
} catch (error) {
    console.log('Supabase initialization failed:', error);
}

class HeroCarousel {
    constructor() {
        this.images = [];
        this.carouselTrack = document.querySelector('.carousel-track');
    }

    async init() {
        // Try to load images from Supabase first
        const supabaseImages = await this.loadImagesFromSupabase();

        if (supabaseImages && supabaseImages.length > 0) {
            this.images = supabaseImages;
        } else {
            // Fallback to local images
            this.images = [
                'assets/images/carousel/blueberry_cupcakes.jpg',
                'assets/images/carousel/red_soda_fountain_sign_hero_bg.jpg',
                'assets/images/carousel/coffe_in_mug.jpg',
                'assets/images/carousel/tomato_egg_grilled_cheese_black_coffee.jpg'
            ];
        }

        console.log('Carousel loaded with images:', this.images);

        if (this.images.length > 0) {
            this.buildCarousel();
        }
    }

    async loadImagesFromSupabase() {
        if (!supabaseClient) {
            console.log('Supabase not available, using local images');
            return null;
        }

        try {
            const { data, error } = await supabaseClient
                .from('carousel_images')
                .select('*')
                .eq('active', true)
                .order('order_position', { ascending: true });

            if (error) {
                console.log('Supabase query failed, using local images:', error);
                return null;
            }

            if (data && data.length > 0) {
                console.log('Loaded images from Supabase:', data);
                return data.map(item => item.image_url);
            }

            console.log('No images in Supabase, using local images');
            return null;
        } catch (error) {
            console.log('Supabase connection failed, using local images:', error);
            return null;
        }
    }

    buildCarousel() {
        // Clear existing carousel
        this.carouselTrack.innerHTML = '';
        this.carouselTrack.style.animation = 'none';

        // Create enough copies to ensure seamless looping
        // We need at least 2 full sets for the seamless reset technique
        const imagesToRender = [...this.images, ...this.images];

        // Create img elements
        imagesToRender.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Carousel image';
            this.carouselTrack.appendChild(img);
        });

        console.log('Carousel built with', imagesToRender.length, 'images (', this.images.length, 'unique)');

        // Start the infinite scroll animation
        setTimeout(() => {
            this.startInfiniteScroll();
        }, 100);
    }

    startInfiniteScroll() {
        // Calculate dimensions
        const images = this.carouselTrack.querySelectorAll('img');
        if (images.length === 0) return;

        // Wait for images to load to get accurate dimensions
        const firstImage = images[0];
        if (!firstImage.complete) {
            firstImage.addEventListener('load', () => this.startInfiniteScroll());
            return;
        }

        // Calculate the width of one complete set of images
        let singleSetWidth = 0;
        for (let i = 0; i < this.images.length; i++) {
            const img = images[i];
            const computedStyle = window.getComputedStyle(img);
            const imgWidth = img.offsetWidth;
            const marginRight = parseFloat(computedStyle.marginRight) || 0;
            singleSetWidth += imgWidth + marginRight;
        }

        // Add the gap between images (from carousel-track)
        const trackStyle = window.getComputedStyle(this.carouselTrack);
        const gap = parseFloat(trackStyle.gap) || 30;
        singleSetWidth += gap * (this.images.length - 1);

        console.log('Single set width:', singleSetWidth + 'px');

        // Set animation speed (pixels per second)
        const pixelsPerSecond = 50; // Adjust this to change scroll speed
        const duration = singleSetWidth / pixelsPerSecond;

        // Apply the animation
        this.carouselTrack.style.animation = `scroll-carousel ${duration}s linear infinite`;

        console.log('Animation started:', duration.toFixed(2) + 's duration for one loop');
    }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Carousel script loaded');
    window.heroCarousel = new HeroCarousel();
    window.heroCarousel.init();
});
