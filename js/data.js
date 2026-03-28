// ========================================
// ADIP RMX - Data Products
// ========================================

// Cover images rotation for FLM (8 covers for 25 products)
const flmCovers = [
    'images/cover-flm-1.jpg',
    'images/cover-flm-2.jpg',
    'images/cover-flm-3.jpg',
    'images/cover-flm-4.jpg',
    'images/cover-flm-5.jpg',
    'images/cover-flm-6.jpg',
    'images/cover-flm-7.jpg',
    'images/cover-flm-8.jpg'
];

// Cover images for Sample Packs
const sampleCovers = [
    'images/cover-sample-1.jpg',
    'images/cover-sample-2.jpg',
    'images/cover-sample-3.jpg'
];

// Demo audio URLs (using free music from Pixabay as examples)
const demoAudios = [
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    'https://cdn.pixabay.com/download/audio/2021/11/25/audio_5f5f6c71c6.mp3',
    'https://cdn.pixabay.com/download/audio/2021/09/06/audio_278c4c59c1.mp3'
];

// FLM Products (25 items)
const flmProducts = [
    {
        id: 'flm-001',
        name: 'Funky House Project',
        category: 'FLM Project',
        price: 75000,
        bpm: 128,
        key: 'F# Minor',
        duration: '5:32',
        image: flmCovers[0],
        audioUrl: demoAudios[0]
    },
    {
        id: 'flm-002',
        name: 'Tribal Groove Remix',
        category: 'FLM Project',
        price: 85000,
        bpm: 124,
        key: 'G Major',
        duration: '6:15',
        image: flmCovers[1],
        audioUrl: demoAudios[1]
    },
    {
        id: 'flm-003',
        name: 'Deep Bass Edition',
        category: 'FLM Project',
        price: 70000,
        bpm: 122,
        key: 'A Minor',
        duration: '5:45',
        image: flmCovers[2],
        audioUrl: demoAudios[2]
    },
    {
        id: 'flm-004',
        name: 'Electro Dance Mix',
        category: 'FLM Project',
        price: 90000,
        bpm: 130,
        key: 'D Major',
        duration: '6:30',
        image: flmCovers[3],
        audioUrl: demoAudios[3]
    },
    {
        id: 'flm-005',
        name: 'Latin Vibes Project',
        category: 'FLM Project',
        price: 80000,
        bpm: 126,
        key: 'C Minor',
        duration: '5:50',
        image: flmCovers[4],
        audioUrl: demoAudios[4]
    },
    {
        id: 'flm-006',
        name: 'Trap Fusion Remix',
        category: 'FLM Project',
        price: 95000,
        bpm: 140,
        key: 'E Minor',
        duration: '4:45',
        image: flmCovers[5],
        audioUrl: demoAudios[0]
    },
    {
        id: 'flm-007',
        name: 'Progressive House',
        category: 'FLM Project',
        price: 85000,
        bpm: 128,
        key: 'B Minor',
        duration: '7:20',
        image: flmCovers[6],
        audioUrl: demoAudios[1]
    },
    {
        id: 'flm-008',
        name: 'Tech House Groove',
        category: 'FLM Project',
        price: 75000,
        bpm: 125,
        key: 'F Minor',
        duration: '6:00',
        image: flmCovers[7],
        audioUrl: demoAudios[2]
    },
    {
        id: 'flm-009',
        name: 'Bass House Project',
        category: 'FLM Project',
        price: 90000,
        bpm: 128,
        key: 'G Minor',
        duration: '5:15',
        image: flmCovers[0],
        audioUrl: demoAudios[3]
    },
    {
        id: 'flm-010',
        name: 'Future House Remix',
        category: 'FLM Project',
        price: 85000,
        bpm: 126,
        key: 'D Minor',
        duration: '5:40',
        image: flmCovers[1],
        audioUrl: demoAudios[4]
    },
    {
        id: 'flm-011',
        name: 'Disco Revival Edit',
        category: 'FLM Project',
        price: 70000,
        bpm: 122,
        key: 'A Major',
        duration: '5:25',
        image: flmCovers[2],
        audioUrl: demoAudios[0]
    },
    {
        id: 'flm-012',
        name: 'Hardstyle Project',
        category: 'FLM Project',
        price: 100000,
        bpm: 150,
        key: 'E Major',
        duration: '4:30',
        image: flmCovers[3],
        audioUrl: demoAudios[1]
    },
    {
        id: 'flm-013',
        name: 'Melbourne Bounce',
        category: 'FLM Project',
        price: 80000,
        bpm: 128,
        key: 'C Major',
        duration: '5:00',
        image: flmCovers[4],
        audioUrl: demoAudios[2]
    },
    {
        id: 'flm-014',
        name: 'Big Room Project',
        category: 'FLM Project',
        price: 95000,
        bpm: 130,
        key: 'F# Major',
        duration: '5:45',
        image: flmCovers[5],
        audioUrl: demoAudios[3]
    },
    {
        id: 'flm-015',
        name: 'Dubstep Remix',
        category: 'FLM Project',
        price: 85000,
        bpm: 140,
        key: 'G# Minor',
        duration: '4:15',
        image: flmCovers[6],
        audioUrl: demoAudios[4]
    },
    {
        id: 'flm-016',
        name: 'Drum & Bass Edit',
        category: 'FLM Project',
        price: 90000,
        bpm: 174,
        key: 'B Major',
        duration: '5:10',
        image: flmCovers[7],
        audioUrl: demoAudios[0]
    },
    {
        id: 'flm-017',
        name: 'Moombahton Project',
        category: 'FLM Project',
        price: 75000,
        bpm: 110,
        key: 'D# Minor',
        duration: '4:50',
        image: flmCovers[0],
        audioUrl: demoAudios[1]
    },
    {
        id: 'flm-018',
        name: 'Twerk Remix',
        category: 'FLM Project',
        price: 80000,
        bpm: 100,
        key: 'A# Minor',
        duration: '4:20',
        image: flmCovers[1],
        audioUrl: demoAudios[2]
    },
    {
        id: 'flm-019',
        name: 'Jersey Club Edit',
        category: 'FLM Project',
        price: 70000,
        bpm: 140,
        key: 'C# Minor',
        duration: '3:45',
        image: flmCovers[2],
        audioUrl: demoAudios[3]
    },
    {
        id: 'flm-020',
        name: 'Phonk Project',
        category: 'FLM Project',
        price: 85000,
        bpm: 140,
        key: 'F Minor',
        duration: '4:00',
        image: flmCovers[3],
        audioUrl: demoAudios[4]
    },
    {
        id: 'flm-021',
        name: 'Afro House Remix',
        category: 'FLM Project',
        price: 90000,
        bpm: 122,
        key: 'G Major',
        duration: '6:10',
        image: flmCovers[4],
        audioUrl: demoAudios[0]
    },
    {
        id: 'flm-022',
        name: 'Amapiano Project',
        category: 'FLM Project',
        price: 80000,
        bpm: 115,
        key: 'D Minor',
        duration: '6:30',
        image: flmCovers[5],
        audioUrl: demoAudios[1]
    },
    {
        id: 'flm-023',
        name: 'G-House Edit',
        category: 'FLM Project',
        price: 95000,
        bpm: 126,
        key: 'E Minor',
        duration: '5:20',
        image: flmCovers[6],
        audioUrl: demoAudios[2]
    },
    {
        id: 'flm-024',
        name: 'Slap House Project',
        category: 'FLM Project',
        price: 85000,
        bpm: 124,
        key: 'B Minor',
        duration: '5:35',
        image: flmCovers[7],
        audioUrl: demoAudios[3]
    },
    {
        id: 'flm-025',
        name: 'Brazilian Bass',
        category: 'FLM Project',
        price: 90000,
        bpm: 124,
        key: 'F Major',
        duration: '5:50',
        image: flmCovers[0],
        audioUrl: demoAudios[4]
    }
];

// Sample Pack Products (50+ items)
const samplePackProducts = [
    {
        id: 'sp-001',
        name: 'Essential Kicks Vol.1',
        category: 'Sample Pack',
        price: 50000,
        items: '50 Kicks',
        size: '25 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-002',
        name: 'Snare Collection 2024',
        category: 'Sample Pack',
        price: 45000,
        items: '75 Snares',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-003',
        name: 'Hi-Hat Essentials',
        category: 'Sample Pack',
        price: 40000,
        items: '100 Hi-Hats',
        size: '20 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-004',
        name: 'Clap & Snap Pack',
        category: 'Sample Pack',
        price: 35000,
        items: '60 Claps',
        size: '15 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-005',
        name: 'Percussion Gold',
        category: 'Sample Pack',
        price: 55000,
        items: '80 Percussions',
        size: '35 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-006',
        name: 'Tribal Drums',
        category: 'Sample Pack',
        price: 60000,
        items: '65 Tribal Hits',
        size: '40 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-007',
        name: '808 Bass Collection',
        category: 'Sample Pack',
        price: 70000,
        items: '50 808s',
        size: '50 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-008',
        name: 'Sub Bass Essentials',
        category: 'Sample Pack',
        price: 50000,
        items: '40 Sub Bass',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-009',
        name: 'Synth Stabs Vol.1',
        category: 'Sample Pack',
        price: 45000,
        items: '90 Stabs',
        size: '25 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-010',
        name: 'Lead Synths 2024',
        category: 'Sample Pack',
        price: 65000,
        items: '70 Leads',
        size: '45 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-011',
        name: 'Pad Collection',
        category: 'Sample Pack',
        price: 55000,
        items: '60 Pads',
        size: '80 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-012',
        name: 'Pluck Sounds',
        category: 'Sample Pack',
        price: 40000,
        items: '85 Plucks',
        size: '20 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-013',
        name: 'Vocal Chops Pack',
        category: 'Sample Pack',
        price: 75000,
        items: '100 Chops',
        size: '60 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-014',
        name: 'FX & Transitions',
        category: 'Sample Pack',
        price: 50000,
        items: '120 FX',
        size: '35 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-015',
        name: 'Risers & Sweeps',
        category: 'Sample Pack',
        price: 45000,
        items: '80 Risers',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-016',
        name: 'Impacts & Hits',
        category: 'Sample Pack',
        price: 40000,
        items: '70 Impacts',
        size: '25 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-017',
        name: 'Fills & Buildups',
        category: 'Sample Pack',
        price: 55000,
        items: '90 Fills',
        size: '40 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-018',
        name: 'Drum Loops House',
        category: 'Sample Pack',
        price: 65000,
        items: '50 Loops',
        size: '55 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-019',
        name: 'Drum Loops Techno',
        category: 'Sample Pack',
        price: 65000,
        items: '50 Loops',
        size: '55 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-020',
        name: 'Top Loops Collection',
        category: 'Sample Pack',
        price: 50000,
        items: '75 Loops',
        size: '35 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-021',
        name: 'Bass Loops Pack',
        category: 'Sample Pack',
        price: 60000,
        items: '60 Loops',
        size: '45 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-022',
        name: 'Melody Loops Vol.1',
        category: 'Sample Pack',
        price: 70000,
        items: '55 Loops',
        size: '70 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-023',
        name: 'Melody Loops Vol.2',
        category: 'Sample Pack',
        price: 70000,
        items: '55 Loops',
        size: '70 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-024',
        name: 'Chord Progressions',
        category: 'Sample Pack',
        price: 80000,
        items: '80 Progressions',
        size: '90 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-025',
        name: 'Arpeggio Collection',
        category: 'Sample Pack',
        price: 55000,
        items: '65 Arpeggios',
        size: '40 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-026',
        name: 'One Shots Mega Pack',
        category: 'Sample Pack',
        price: 100000,
        items: '500+ Sounds',
        size: '150 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-027',
        name: 'Latin Percussion',
        category: 'Sample Pack',
        price: 60000,
        items: '70 Percussions',
        size: '45 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-028',
        name: 'Congas & Bongos',
        category: 'Sample Pack',
        price: 45000,
        items: '50 Congas',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-029',
        name: 'Shakers & Tambourines',
        category: 'Sample Pack',
        price: 35000,
        items: '60 Shakers',
        size: '20 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-030',
        name: 'Cymbals Collection',
        category: 'Sample Pack',
        price: 40000,
        items: '45 Cymbals',
        size: '25 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-031',
        name: 'Toms & Floor Toms',
        category: 'Sample Pack',
        price: 45000,
        items: '55 Toms',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-032',
        name: 'Trap Drums',
        category: 'Sample Pack',
        price: 70000,
        items: '100+ Sounds',
        size: '60 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-033',
        name: 'Hip Hop Essentials',
        category: 'Sample Pack',
        price: 75000,
        items: '120+ Sounds',
        size: '70 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-034',
        name: 'EDM Starter Pack',
        category: 'Sample Pack',
        price: 90000,
        items: '200+ Sounds',
        size: '120 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-035',
        name: 'Future Bass Pack',
        category: 'Sample Pack',
        price: 80000,
        items: '150+ Sounds',
        size: '100 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-036',
        name: 'Dubstep Samples',
        category: 'Sample Pack',
        price: 75000,
        items: '130+ Sounds',
        size: '90 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-037',
        name: 'Hardstyle Pack',
        category: 'Sample Pack',
        price: 85000,
        items: '140+ Sounds',
        size: '110 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-038',
        name: 'Psytrance Essentials',
        category: 'Sample Pack',
        price: 80000,
        items: '160+ Sounds',
        size: '100 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-039',
        name: 'Ambient Sounds',
        category: 'Sample Pack',
        price: 60000,
        items: '80 Sounds',
        size: '120 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-040',
        name: 'Cinematic FX',
        category: 'Sample Pack',
        price: 70000,
        items: '90 FX',
        size: '80 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-041',
        name: 'Vocal Ad-libs',
        category: 'Sample Pack',
        price: 50000,
        items: '100 Ad-libs',
        size: '35 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-042',
        name: 'Brass & Horns',
        category: 'Sample Pack',
        price: 55000,
        items: '60 Brass',
        size: '40 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-043',
        name: 'Strings Collection',
        category: 'Sample Pack',
        price: 65000,
        items: '70 Strings',
        size: '85 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-044',
        name: 'Guitar Loops',
        category: 'Sample Pack',
        price: 70000,
        items: '50 Loops',
        size: '60 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-045',
        name: 'Piano & Keys',
        category: 'Sample Pack',
        price: 60000,
        items: '65 Keys',
        size: '50 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-046',
        name: 'Organ Sounds',
        category: 'Sample Pack',
        price: 45000,
        items: '40 Organs',
        size: '30 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-047',
        name: 'Synthwave Pack',
        category: 'Sample Pack',
        price: 75000,
        items: '110+ Sounds',
        size: '80 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-048',
        name: 'Lo-Fi Essentials',
        category: 'Sample Pack',
        price: 65000,
        items: '100+ Sounds',
        size: '70 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-049',
        name: 'Reggae & Dancehall',
        category: 'Sample Pack',
        price: 60000,
        items: '90+ Sounds',
        size: '55 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-050',
        name: 'Afrobeat Pack',
        category: 'Sample Pack',
        price: 70000,
        items: '120+ Sounds',
        size: '75 MB',
        audioUrl: '#'
    },
    {
        id: 'sp-051',
        name: 'Complete Bundle',
        category: 'Sample Pack',
        price: 500000,
        items: 'All Packs',
        size: '2 GB',
        audioUrl: '#'
    }
];

// Testimonials Data
const testimonials = [
    {
        id: 1,
        name: 'Rizky Pratama',
        role: 'DJ & Producer',
        avatar: 'RP',
        rating: 5,
        text: 'FLM project dari ADIP RMX sangat berkualitas! Struktur rapi dan mudah dipelajari. Recommended banget!',
        image: null
    },
    {
        id: 2,
        name: 'Ahmad Fauzi',
        role: 'Remixer',
        avatar: 'AF',
        rating: 5,
        text: 'Sample packnya lengkap banget, suara jernih dan siap pakai. Pelayanan juga cepat dan ramah.',
        image: null
    },
    {
        id: 3,
        name: 'Dina Putri',
        role: 'Music Enthusiast',
        avatar: 'DP',
        rating: 5,
        text: 'Pesen jasa chord & BPM, hasilnya akurat dan cepat. Harganya juga terjangkau. Mantap!',
        image: null
    },
    {
        id: 4,
        name: 'Budi Santoso',
        role: 'Event Organizer',
        avatar: 'BS',
        rating: 5,
        text: 'Sudah beberapa kali order FLM project, selalu puas dengan hasilnya. Sukses terus ADIP RMX!',
        image: null
    },
    {
        id: 5,
        name: 'Maya Sari',
        role: 'Beginner Producer',
        avatar: 'MS',
        rating: 5,
        text: 'Sample packnya membantu banget buat belajar produksi musik. Kualitasnya top markotop!',
        image: null
    },
    {
        id: 6,
        name: 'Eko Wijaya',
        role: 'Club DJ',
        avatar: 'EW',
        rating: 5,
        text: 'Request remix lagu favorit, hasilnya melebihi ekspektasi! Bakal repeat order lagi.',
        image: null
    }
];

// Format price to Rupiah
function formatPrice(price) {
    return 'Rp ' + price.toLocaleString('id-ID');
}

// Export data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { flmProducts, samplePackProducts, testimonials, formatPrice };
}
