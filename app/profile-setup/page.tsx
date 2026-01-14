'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  User,
  MessageCircle,
  MapPin,
  GraduationCap,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { userData, updateUserProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    zaloId: '',
    location: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        zaloId: userData.zaloId || '',
        location: userData.location || '',
        level: userData.level || 'beginner'
      });
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('이름은 필수 입력 항목입니다.');
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const locations = [
    '호치민시 (TP.HCM)',
    '하노이 (Hà Nội)',
    '다낭 (Đà Nẵng)',
    '빈즈엉성 (Bình Dương)',
    '동나이성 (Đồng Nai)',
    '하이퐁 (Hải Phòng)',
    '껀터 (Cần Thơ)',
    '바리아-붕따우 (Bà Rịa-Vũng Tàu)',
    '기타'
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#4A5D4E] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#8C857E] text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3ED] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E1D8]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4A5D4E] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#2D241E]">AJU E&J</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C857E]">Korean Academy</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#4A5D4E] px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">환영합니다!</h2>
              <p className="text-white/80 text-sm">학습을 시작하기 전에 프로필을 설정해주세요</p>
            </div>

            {/* Form */}
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl">
                  <p className="text-[#991B1B] text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#2D241E] mb-2">
                    <User className="w-4 h-4 text-[#8C857E]" />
                    여권 성함 <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#F5F3ED] border border-[#E5E1D8] rounded-xl text-[#2D241E] placeholder:text-[#8C857E]/60 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 focus:border-[#4A5D4E] transition-all"
                    placeholder="예: NGUYEN VAN A"
                    required
                  />
                </div>

                {/* Zalo ID */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#2D241E] mb-2">
                    <MessageCircle className="w-4 h-4 text-[#8C857E]" />
                    Zalo ID <span className="text-[#8C857E] font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    name="zaloId"
                    value={formData.zaloId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#F5F3ED] border border-[#E5E1D8] rounded-xl text-[#2D241E] placeholder:text-[#8C857E]/60 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 focus:border-[#4A5D4E] transition-all"
                    placeholder="예: zalo123456"
                  />
                  <p className="text-xs text-[#8C857E] mt-1.5">학습 관련 공지사항을 받으실 수 있습니다</p>
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#2D241E] mb-2">
                    <MapPin className="w-4 h-4 text-[#8C857E]" />
                    거주 지역
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#F5F3ED] border border-[#E5E1D8] rounded-xl text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 focus:border-[#4A5D4E] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">선택하세요</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[#2D241E] mb-2">
                    <GraduationCap className="w-4 h-4 text-[#8C857E]" />
                    한국어 레벨
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'beginner', label: '초급', sub: 'Beginner' },
                      { value: 'intermediate', label: '중급', sub: 'Intermediate' },
                      { value: 'advanced', label: '고급', sub: 'Advanced' }
                    ].map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, level: level.value as any })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.level === level.value
                            ? 'bg-[#4A5D4E] border-[#4A5D4E] text-white'
                            : 'bg-[#F5F3ED] border-[#E5E1D8] text-[#2D241E] hover:border-[#4A5D4E]/50'
                        }`}
                      >
                        <p className="font-medium">{level.label}</p>
                        <p className={`text-[10px] ${formData.level === level.value ? 'text-white/70' : 'text-[#8C857E]'}`}>
                          {level.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#4A5D4E] text-white py-4 rounded-xl font-medium hover:bg-[#3A4D3E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      '저장 중...'
                    ) : (
                      <>
                        학습 시작하기
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {userData && userData.name && (
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="w-full py-3 text-[#8C857E] text-sm hover:text-[#2D241E] transition-all"
                    >
                      건너뛰기
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#8C857E]">
              입력하신 정보는 AJU E&J 교육 서비스 제공을 위해서만 사용됩니다
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
