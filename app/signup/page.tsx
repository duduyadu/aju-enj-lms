'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { BookOpen, User, Mail, Lock, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';

export default function SignupPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    zaloId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('signup.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('signup.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        formData.zaloId
      );
      router.push('/profile-setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const needsProfile = await loginWithGoogle();
      if (needsProfile) {
        router.push('/profile-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-porcelain flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-museum-gold relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-espresso/60 mb-6">
            Join Us
          </span>
          <h2 className="font-serif font-light text-5xl text-espresso leading-tight mb-6">
            {t('signup.startJourney')}
          </h2>
          <div className="w-24 h-px bg-espresso/30 mb-6" />
          <p className="text-espresso/80 text-lg max-w-md leading-relaxed mb-8">
            {t('signup.joinMessage')}
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">{t('signup.benefit1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">{t('signup.benefit2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">{t('signup.benefit3')}</span>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-porcelain/10" />
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-espresso/5" />
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-botanical flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-porcelain" />
              </div>
              <span className="font-serif font-light text-2xl text-espresso">AJU E&J</span>
            </Link>
            <h1 className="font-serif font-light text-3xl text-espresso mb-2">{t('signup.title')}</h1>
            <p className="text-taupe text-sm">{t('signup.subtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('common.name')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('signup.namePlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('common.email')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Zalo ID */}
            <div>
              <label htmlFor="zaloId" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('signup.zaloId')}
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="text"
                  id="zaloId"
                  name="zaloId"
                  value={formData.zaloId}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('signup.zaloPlaceholder')}
                />
              </div>
              <p className="text-[10px] text-taupe mt-2 pl-1">
                {t('signup.zaloHelp')}
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('common.password')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('signup.minChars')}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('signup.confirmPassword')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full h-14 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all duration-300 shadow-museum hover:shadow-museum-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-8"
            >
              {loading ? t('signup.creating') : t('signup.createAccount')}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Dotted Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-taupe/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-porcelain text-xs text-taupe font-medium">{t('login.or')}</span>
            </div>
          </div>

          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            type="button"
            className="w-full h-16 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-2xl text-lg font-semibold flex items-center justify-center gap-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{loading ? t('signup.creating') : t('signup.googleSignup')}</span>
          </button>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-taupe">
              {t('signup.hasAccount')}{' '}
              <Link href="/login" className="text-botanical hover:text-espresso font-medium transition-colors">
                {t('common.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
