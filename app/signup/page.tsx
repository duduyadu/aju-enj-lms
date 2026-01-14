'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { BookOpen, User, Mail, Lock, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
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
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
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

  return (
    <div className="min-h-screen bg-porcelain flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-museum-gold relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <span className="text-[10px] uppercase tracking-[0.4em] text-espresso/60 mb-6">
            Join Us
          </span>
          <h2 className="font-serif font-light text-5xl text-espresso leading-tight mb-6">
            새로운 여정을
            <br />
            시작하세요
          </h2>
          <div className="w-24 h-px bg-espresso/30 mb-6" />
          <p className="text-espresso/80 text-lg max-w-md leading-relaxed mb-8">
            AJU E&J와 함께 체계적인 학습으로
            한국에서의 성공적인 미래를 준비하세요.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">맞춤형 학습 커리큘럼</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">전문 강사진의 1:1 피드백</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-espresso/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-espresso" />
              </div>
              <span className="text-espresso/80">언제 어디서나 학습 가능</span>
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
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-botanical flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-porcelain" />
              </div>
              <span className="font-serif font-light text-2xl text-espresso">AJU E&J</span>
            </Link>
            <h1 className="font-serif font-light text-3xl text-espresso mb-2">회원가입</h1>
            <p className="text-taupe text-sm">새로운 학습 여정을 시작하세요</p>
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
                이름 <span className="text-red-400">*</span>
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
                  placeholder="홍길동"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                이메일 <span className="text-red-400">*</span>
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
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Zalo ID */}
            <div>
              <label htmlFor="zaloId" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                Zalo ID <span className="text-taupe/50">(선택)</span>
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
                  placeholder="Zalo 아이디"
                />
              </div>
              <p className="text-[10px] text-taupe mt-2 pl-1">
                베트남 거주 시 연락을 위해 사용됩니다
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                비밀번호 <span className="text-red-400">*</span>
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
                  placeholder="최소 6자 이상"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.2em] text-taupe mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
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
                  placeholder="비밀번호 재입력"
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
              {loading ? '가입 처리 중...' : '회원가입'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-taupe">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-botanical hover:text-espresso font-medium transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
