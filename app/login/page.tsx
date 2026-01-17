'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { BookOpen, Mail, Lock, ArrowRight, Shield, X, CheckCircle } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 비밀번호 찾기 관련 상태
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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

  // 비밀번호 재설정 이메일 전송
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // 모달 닫기
  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen bg-porcelain flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-botanical relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-porcelain/60 mb-6">
            {t('login.welcomeBack')}
          </span>
          <h2 className="font-serif font-light text-5xl text-porcelain leading-tight mb-6">
            {t('login.continueJourney')}
          </h2>
          <div className="gold-line w-24 mb-6 opacity-60" />
          <p className="text-porcelain/80 text-lg max-w-md leading-relaxed">
            {t('login.welcomeMessage')}
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-museum-gold/10" />
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-porcelain/5" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Language Toggle */}
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-botanical flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-porcelain" />
              </div>
              <span className="font-serif font-light text-2xl text-espresso">AJU E&J</span>
            </Link>
            <h1 className="font-serif font-light text-3xl text-espresso mb-2">{t('login.title')}</h1>
            <p className="text-taupe text-sm">{t('login.subtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                {t('common.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-taupe">
                  {t('common.password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetEmail(email);
                  }}
                  className="text-[10px] text-botanical hover:text-espresso transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full h-14 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all duration-300 shadow-museum hover:shadow-museum-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? t('login.loggingIn') : t('login.loginWithEmail')}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-museum-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-porcelain text-[10px] uppercase tracking-[0.2em] text-taupe">{t('login.or')}</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-white border border-museum-border text-espresso rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-museum-border/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            {loading ? t('login.loggingIn') : t('login.loginWithGoogle')}
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-taupe">
              {t('login.noAccount')}{' '}
              <Link href="/signup" className="text-botanical hover:text-espresso font-medium transition-colors">
                {t('common.signup')}
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-5 rounded-2xl bg-museum-border/30 border border-museum-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-botanical mt-0.5 flex-shrink-0" />
              <p className="text-xs text-taupe leading-relaxed">
                {t('login.securityNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 재설정 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={closeResetModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-porcelain flex items-center justify-center hover:bg-museum-border transition-colors"
            >
              <X className="w-4 h-4 text-taupe" />
            </button>

            {!resetSuccess ? (
              <>
                {/* 헤더 */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-botanical/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-botanical" />
                  </div>
                  <h2 className="font-serif font-light text-2xl text-espresso mb-2">{t('resetPassword.title')}</h2>
                  <p className="text-sm text-taupe">
                    {t('resetPassword.description')}
                  </p>
                </div>

                {/* 에러 메시지 */}
                {resetError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-red-600 text-sm text-center">{resetError}</p>
                  </div>
                )}

                {/* 이메일 입력 폼 */}
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                      {t('resetPassword.emailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-porcelain border border-museum-border rounded-2xl text-espresso placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-botanical/30 focus:border-botanical transition-all"
                        placeholder={t('login.emailPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full h-12 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {resetLoading ? t('resetPassword.sending') : t('resetPassword.sendLink')}
                  </button>
                </form>
              </>
            ) : (
              /* 성공 화면 */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-botanical/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-botanical" />
                </div>
                <h2 className="font-serif font-light text-2xl text-espresso mb-2">{t('resetPassword.successTitle')}</h2>
                <p className="text-sm text-taupe mb-6">
                  <span className="font-medium text-espresso">{resetEmail}</span><br />
                  {t('resetPassword.successMessage')}
                </p>
                <p className="text-xs text-taupe mb-6">
                  {t('resetPassword.checkSpam')}
                </p>
                <button
                  onClick={closeResetModal}
                  className="w-full h-12 bg-botanical text-porcelain rounded-full text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all duration-300"
                >
                  {t('common.confirm')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}