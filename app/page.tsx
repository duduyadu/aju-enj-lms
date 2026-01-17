'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { BookOpen, Shield, Smartphone, Target, ArrowRight } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';

export default function Home() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.push('/dashboard');
    }
  }, [loading, firebaseUser, router]);

  return (
    <main className="min-h-screen bg-porcelain">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-porcelain/80 backdrop-blur-md border-b border-museum-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-botanical flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-porcelain" />
            </div>
            <span className="font-serif font-light text-xl text-espresso">AJU E&J</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link
              href="/login"
              className="text-[11px] uppercase tracking-[0.2em] text-taupe hover:text-espresso transition-colors"
            >
              {t('common.login')}
            </Link>
            <Link
              href="/signup"
              className="h-10 px-5 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-museum"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Label */}
          <span className="inline-block text-[10px] uppercase tracking-[0.4em] text-taupe mb-6">
            Online Education Platform
          </span>

          {/* Main Title */}
          <h1 className="font-serif font-light text-5xl sm:text-7xl lg:text-8xl text-espresso leading-[1.1] mb-8">
            {t('landing.heroTitle1')}
            <br />
            <span className="text-botanical">{t('landing.heroTitle2')}</span>
          </h1>

          {/* Gold Line */}
          <div className="gold-line w-32 mx-auto my-8" />

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-taupe max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group h-14 px-10 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-[1.02] transition-all duration-300 shadow-museum hover:shadow-museum-hover"
            >
              {t('landing.startFree')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="h-14 px-10 border border-museum-border text-espresso rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center hover:bg-museum-border/30 transition-all duration-300"
            >
              {t('landing.existingMember')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.4em] text-taupe">Why Choose Us</span>
            <h2 className="font-serif font-light text-4xl sm:text-5xl text-espresso mt-4">
              {t('landing.whyChooseUs')}
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large Card - Security */}
            <div className="md:col-span-8 rounded-[2.5rem] border border-museum-border bg-porcelain p-10 shadow-museum hover:shadow-museum-hover transition-all duration-300 group">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-full bg-botanical/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-botanical" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">Premium</span>
              </div>
              <h3 className="font-serif font-light text-3xl text-espresso mb-4">
                {t('landing.secureContent')}
              </h3>
              <p className="text-taupe leading-relaxed max-w-md">
                {t('landing.secureContentDesc')}
              </p>
            </div>

            {/* Small Card - Mobile */}
            <div className="md:col-span-4 rounded-[2.5rem] border border-museum-border bg-botanical p-8 shadow-museum hover:shadow-museum-hover transition-all duration-300 flex flex-col justify-between min-h-[280px]">
              <div className="w-12 h-12 rounded-full bg-porcelain/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-porcelain" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-porcelain/70 block mb-2">Mobile First</span>
                <h3 className="font-serif font-light text-2xl text-porcelain">
                  {t('landing.mobileOptimized')}
                </h3>
              </div>
            </div>

            {/* Small Card - Personalized */}
            <div className="md:col-span-4 rounded-[2.5rem] border border-museum-border bg-museum-gold p-8 shadow-museum hover:shadow-museum-hover transition-all duration-300 flex flex-col justify-between min-h-[280px]">
              <div className="w-12 h-12 rounded-full bg-espresso/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-espresso" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-espresso/70 block mb-2">Personalized</span>
                <h3 className="font-serif font-light text-2xl text-espresso">
                  {t('landing.personalizedEducation')}
                </h3>
              </div>
            </div>

            {/* Large Card - Learning */}
            <div className="md:col-span-8 rounded-[2.5rem] border border-museum-border bg-porcelain p-10 shadow-museum hover:shadow-museum-hover transition-all duration-300">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-full bg-museum-gold/20 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-museum-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-botanical">Curated</span>
              </div>
              <h3 className="font-serif font-light text-3xl text-espresso mb-4">
                {t('landing.systematicCurriculum')}
              </h3>
              <p className="text-taupe leading-relaxed max-w-md">
                {t('landing.systematicCurriculumDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-museum-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-botanical flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-porcelain" />
            </div>
            <span className="font-serif font-light text-lg text-espresso">AJU E&J</span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-taupe">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </main>
  )
}