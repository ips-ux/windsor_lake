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
        // Triple the images for seamless infinite loop
        const allImages = [...this.images, ...this.images, ...this.images];

        // Create img elements
        allImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Carousel image';
            this.carouselTrack.appendChild(img);
        });

        console.log('Carousel built with', allImages.length, 'images');

        // Calculate total width and start animation
        setTimeout(() => {
            const trackWidth = this.carouselTrack.scrollWidth;
            const containerWidth = document.querySelector('.hero-container').offsetWidth;

            // Calculate animation duration based on width (slower scroll)
            const duration = 60; // 24 seconds per screen width

            this.carouselTrack.style.animation = `scroll-carousel ${duration}s linear infinite`;

            console.log('Animation started:', duration + 's duration');
        }, 100);
    }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Carousel script loaded');
    window.heroCarousel = new HeroCarousel();
    window.heroCarousel.init();
});
