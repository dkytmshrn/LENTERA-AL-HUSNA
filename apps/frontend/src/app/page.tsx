'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=2200&q=85',
    eyebrow: 'Tempat untuk bertumbuh',
    title: 'MTS AL-HUSNA LENTERA',
    body: 'Belajar dengan akhlak, tujuan, dan semangat yang menerangi langkah setiap siswa.',
    accent: 'Prestasi tumbuh dari rasa memiliki dan kebersamaan.',
  },
  {
    image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=2200&q=85',
    eyebrow: 'Madrasah yang terhubung',
    title: 'Setiap pelajaran punya arah.',
    body: 'LENTERA menyatukan mata pelajaran, materi, ujian, dan perkembangan siswa dalam satu ruang belajar yang tertata.',
    accent: 'Terarah untuk siswa. Jelas untuk keluarga. Bermakna untuk guru.',
  },
  {
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=2200&q=85',
    eyebrow: 'Melangkah bersama',
    title: 'Membentuk generasi berilmu dan berakhlak.',
    body: 'Pantau tugas, siapkan ujian, dan tetap dekat dengan orang-orang yang mendampingi perjalanan belajar Anda.',
    accent: 'Dibangun dari kebiasaan baik yang dilakukan setiap hari.',
  },
];

export default function Home() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[activeSlide];

  return (
    <main className="min-h-screen bg-[#102a2d] text-white">
      <section className="relative min-h-[680px] overflow-hidden lg:min-h-screen">
        {slides.map((item, index) => (
          <div key={item.title} aria-hidden={index !== activeSlide} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url(${item.image})` }} />
        ))}
        <div className="absolute inset-0 bg-[#102a2d]/65" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,35,38,.9),rgba(8,35,38,.42)_58%,rgba(8,35,38,.2))]" />

        <div className="relative z-10 mx-auto flex min-h-[575px] max-w-7xl items-center px-6 pb-24 pt-16 lg:min-h-screen lg:px-10 lg:pb-28">
          <div className="max-w-2xl"><p className="mb-6 text-sm font-semibold uppercase tracking-[.28em] text-[#e7c875]">{slide.eyebrow}</p><h1 className="max-w-3xl font-serif text-5xl leading-[.98] tracking-tight text-white sm:text-6xl lg:text-8xl">{slide.title}</h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">{slide.body}</p><p className="mt-5 border-l-2 border-[#e7c875] pl-4 text-sm italic text-white/65">{slide.accent}</p><div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/login" className="rounded-full bg-[#e7c875] px-7 py-3.5 font-semibold text-[#173b3d] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#f2d88e]">Masuk ke LENTERA</Link><Link href="/register" className="rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:border-white hover:bg-white/10">Bergabung</Link></div></div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10 mx-auto flex max-w-7xl items-end justify-between px-6 lg:px-10"><div className="flex gap-2" aria-label="Kontrol carousel">{slides.map((item, index) => <button key={item.title} type="button" onClick={() => setActiveSlide(index)} aria-label={`Tampilkan slide ${index + 1}`} className={`h-1.5 transition-all ${index === activeSlide ? 'w-12 bg-[#e7c875]' : 'w-6 bg-white/40 hover:bg-white/70'}`} />)}</div><div className="hidden text-right text-xs uppercase tracking-[.2em] text-white/55 sm:block">{String(activeSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</div></div>
      </section>

      <section className="bg-[#f4f0e6] px-6 py-16 text-[#173b3d] lg:px-10 lg:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#b8872f]">Semangat LENTERA</p><h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">Ruang madrasah untuk berpikir, berkarya, dan menjadi lebih baik.</h2></div><p className="max-w-lg text-base leading-8 text-[#426164]">Dari pelajaran pertama hingga rapor akhir, LENTERA menghadirkan ruang bersama bagi keluarga besar MTS Al-Husna untuk belajar dengan jelas dan penuh kepedulian.</p></div></section>
    </main>
  );
}
