// ========================================
// Adip Lowkey - Data Katalog Arsip Remix
// ========================================
// CARA CUSTOM:
// - title  : judul remix kamu
// - artist : nama artis asli / featuring
// - year   : tahun rilis
// - genre  : genre remix
// - duration : durasi track (teks, contoh "3:24")
// - cover  : path / link cover art. Contoh path: "images/covers/cover-01.jpg"
//            Contoh link: "https://i.imgur.com/xxxx.jpg"
// - audio  : path / link file audio (mp3). Contoh path: "audio/remix-01.mp3"
//            Contoh link: "https://domain.com/track.mp3"
// - Tambah track baru? Cukup tambah blok { ... } baru di dalam array.
// ========================================

// Audio demo sementara (ganti dengan file/link audio kamu sendiri)
const archiveDemoAudios = [
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    'https://cdn.pixabay.com/download/audio/2021/11/25/audio_5f5f6c71c6.mp3',
    'https://cdn.pixabay.com/download/audio/2021/09/06/audio_278c4c59c1.mp3'
];

const archiveTracks = [
    { id: 'rmx-001', title: 'Goyang Nasi Padang (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Funky House', duration: '2:59', cover: 'images/covers/cover-01.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-002', title: 'EMANG MANTUL ADIP ENAFF', artist: 'ADIP RMX', year: 2024, genre: 'Breakbeat', duration: '3:23', cover: 'images/covers/cover-02.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-003', title: 'Sakitnya Luar Dalam - Remix', artist: 'ADIP RMX', year: 2024, genre: 'Funky House', duration: '2:48', cover: 'images/covers/cover-03.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-004', title: 'Cinta Dalam Doa (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Melbourne Bounce', duration: '3:05', cover: 'images/covers/cover-04.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-005', title: 'Janda Pirang Breakbeat', artist: 'ADIP RMX', year: 2024, genre: 'Breakbeat', duration: '3:12', cover: 'images/covers/cover-05.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-006', title: 'Karna Su Sayang (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Tropical House', duration: '3:01', cover: 'images/covers/cover-06.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-007', title: 'Lagi Syantik (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Electro House', duration: '2:54', cover: 'images/covers/cover-07.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-008', title: 'Meraih Bintang (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Big Room', duration: '3:18', cover: 'images/covers/cover-08.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-009', title: 'Sayang Via Vallen (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Dutch House', duration: '3:07', cover: 'images/covers/cover-09.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-010', title: 'Bohemian Rhapsody Edit', artist: 'ADIP RMX', year: 2024, genre: 'Mashup', duration: '4:02', cover: 'images/covers/cover-10.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-011', title: 'Tak Tun Tuang (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Breakbeat', duration: '2:56', cover: 'images/covers/cover-11.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-012', title: 'Akad (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Future Bass', duration: '3:22', cover: 'images/covers/cover-12.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-013', title: 'Havana Funky Edit', artist: 'ADIP RMX', year: 2024, genre: 'Latin House', duration: '3:09', cover: 'images/covers/cover-13.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-014', title: 'Kopi Dangdut (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Dangdut House', duration: '3:15', cover: 'images/covers/cover-14.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-015', title: 'Surat Cinta Untuk Starla (Remix)', artist: 'ADIP RMX', year: 2024, genre: 'Chill Remix', duration: '3:28', cover: 'images/covers/cover-15.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-016', title: 'Asal Kau Bahagia (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Future House', duration: '3:11', cover: 'images/covers/cover-16.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-017', title: 'Pamer Bojo (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Dutch House', duration: '2:58', cover: 'images/covers/cover-17.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-018', title: 'Korban Janji (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Melbourne Bounce', duration: '3:04', cover: 'images/covers/cover-18.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-019', title: 'Welas Hang Ring Kene (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Breakbeat', duration: '3:19', cover: 'images/covers/cover-19.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-020', title: 'Sial (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Funky House', duration: '3:02', cover: 'images/covers/cover-20.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-021', title: 'Komang (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Chill Remix', duration: '3:26', cover: 'images/covers/cover-21.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-022', title: 'Ojo Dibandingke (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Dangdut House', duration: '3:08', cover: 'images/covers/cover-22.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-023', title: 'Rungkad (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Breakbeat', duration: '2:52', cover: 'images/covers/cover-23.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-024', title: 'Satru 2 (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Dutch House', duration: '3:14', cover: 'images/covers/cover-24.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-025', title: 'Karena Kamu (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Future Bass', duration: '3:21', cover: 'images/covers/cover-25.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-026', title: 'Melamarmu (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Tropical House', duration: '3:06', cover: 'images/covers/cover-26.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-027', title: 'Temenan Biasa (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Funky House', duration: '2:57', cover: 'images/covers/cover-27.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-028', title: 'Iri Bilang Bos (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Big Room', duration: '3:13', cover: 'images/covers/cover-28.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-029', title: 'Jangan Rubah Takdirku (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Mashup', duration: '3:31', cover: 'images/covers/cover-29.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-030', title: 'Sepine Wengi (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Chill Remix', duration: '3:25', cover: 'images/covers/cover-30.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-031', title: 'Tak Gendong (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Dangdut House', duration: '3:03', cover: 'images/covers/cover-31.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-032', title: 'Ngawi Nagih Janji (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Breakbeat', duration: '2:55', cover: 'images/covers/cover-32.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-033', title: 'Cidro 2 (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Melbourne Bounce', duration: '3:17', cover: 'images/covers/cover-33.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-034', title: 'Salah Tompo (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Dutch House', duration: '3:09', cover: 'images/covers/cover-34.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-035', title: 'Angin Dalu (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Chill Remix', duration: '3:29', cover: 'images/covers/cover-35.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-036', title: 'Lelaki Cadangan (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Future House', duration: '3:05', cover: 'images/covers/cover-36.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-037', title: 'Stecu Stecu (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Funky House', duration: '2:49', cover: 'images/covers/cover-37.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-038', title: 'Rungkad Ente (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Breakbeat', duration: '3:16', cover: 'images/covers/cover-38.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-039', title: 'Sambel Terasi (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Electro House', duration: '2:58', cover: 'images/covers/cover-39.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-040', title: 'Cinta Terlarang (Remix)', artist: 'ADIP RMX', year: 2025, genre: 'Mashup', duration: '3:24', cover: 'images/covers/cover-40.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-041', title: 'Malam Ini (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Tech House', duration: '3:08', cover: 'images/covers/cover-41.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-042', title: 'Janji Putih (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Future Bass', duration: '3:19', cover: 'images/covers/cover-42.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-043', title: 'Bukan Jodohnya (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Chill Remix', duration: '3:27', cover: 'images/covers/cover-43.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-044', title: 'Terpaksa Ku Lepaskan (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Melbourne Bounce', duration: '3:12', cover: 'images/covers/cover-44.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-045', title: 'Sisa Rasa (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Tropical House', duration: '3:04', cover: 'images/covers/cover-45.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-046', title: 'Kasmaran (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Funky House', duration: '2:53', cover: 'images/covers/cover-46.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-047', title: 'Sugeng Dalu (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Dangdut House', duration: '3:21', cover: 'images/covers/cover-47.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-048', title: 'Los Dol (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Breakbeat', duration: '3:06', cover: 'images/covers/cover-48.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-049', title: 'Lintang Ati (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Dutch House', duration: '3:15', cover: 'images/covers/cover-49.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-050', title: 'Pupus (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Future House', duration: '3:10', cover: 'images/covers/cover-50.jpg', audio: archiveDemoAudios[4] },
    { id: 'rmx-051', title: 'Dalan Liyane (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Chill Remix', duration: '3:30', cover: 'images/covers/cover-51.jpg', audio: archiveDemoAudios[0] },
    { id: 'rmx-052', title: 'Banyu Moto (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Tropical House', duration: '3:02', cover: 'images/covers/cover-52.jpg', audio: archiveDemoAudios[1] },
    { id: 'rmx-053', title: 'Kependem Tresno (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Funky House', duration: '3:18', cover: 'images/covers/cover-53.jpg', audio: archiveDemoAudios[2] },
    { id: 'rmx-054', title: 'Widodari (Remix)', artist: 'ADIP RMX', year: 2026, genre: 'Melbourne Bounce', duration: '3:07', cover: 'images/covers/cover-54.jpg', audio: archiveDemoAudios[3] },
    { id: 'rmx-055', title: 'Lowkey Anthem (Original Mix)', artist: 'Adip Lowkey', year: 2026, genre: 'Big Room', duration: '3:33', cover: 'images/covers/cover-55.jpg', audio: archiveDemoAudios[4] }
];
