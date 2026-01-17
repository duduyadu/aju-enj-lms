'use client';

import { ShippingAddress } from '@/types';
import { MapPin, User, Phone, FileText } from 'lucide-react';

interface ShippingFormProps {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors?: Partial<Record<keyof ShippingAddress, string>>;
}

export default function ShippingForm({ value, onChange, errors }: ShippingFormProps) {
  const updateField = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 pb-2 border-b border-[#E5E1D8]">
        <MapPin className="w-4 h-4 text-[#D4AF37]" />
        <h3 className="font-semibold text-[#2D241E]">
          Địa chỉ giao hàng
          <span className="text-[#8C857E] font-normal ml-2">/ 배송지 정보</span>
        </h3>
      </div>

      {/* 수취인명 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          <User className="w-3.5 h-3.5 text-[#8C857E]" />
          Tên người nhận
          <span className="text-[#8C857E] font-normal">/ 수취인명</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.recipientName}
          onChange={(e) => updateField('recipientName', e.target.value)}
          placeholder="Nguyễn Văn A"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.recipientName ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.recipientName && (
          <p className="text-xs text-red-500 mt-1">{errors.recipientName}</p>
        )}
      </div>

      {/* 연락처 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          <Phone className="w-3.5 h-3.5 text-[#8C857E]" />
          Số điện thoại
          <span className="text-[#8C857E] font-normal">/ 연락처</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={value.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="0901234567"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.phone ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.phone && (
          <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      {/* 성/시 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          Tỉnh/Thành phố
          <span className="text-[#8C857E] font-normal">/ 성/시</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.province}
          onChange={(e) => updateField('province', e.target.value)}
          placeholder="TP. Hồ Chí Minh"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.province ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.province && (
          <p className="text-xs text-red-500 mt-1">{errors.province}</p>
        )}
      </div>

      {/* 군/구 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          Quận/Huyện
          <span className="text-[#8C857E] font-normal">/ 군/구</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.district}
          onChange={(e) => updateField('district', e.target.value)}
          placeholder="Quận 1"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.district ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.district && (
          <p className="text-xs text-red-500 mt-1">{errors.district}</p>
        )}
      </div>

      {/* 동/면 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          Phường/Xã
          <span className="text-[#8C857E] font-normal">/ 동/면</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.ward}
          onChange={(e) => updateField('ward', e.target.value)}
          placeholder="Phường Bến Nghé"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.ward ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.ward && (
          <p className="text-xs text-red-500 mt-1">{errors.ward}</p>
        )}
      </div>

      {/* 상세주소 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          Địa chỉ chi tiết
          <span className="text-[#8C857E] font-normal">/ 상세주소</span>
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.streetAddress}
          onChange={(e) => updateField('streetAddress', e.target.value)}
          placeholder="123 Đường Lê Lợi, Tòa nhà ABC, Phòng 456"
          className={`w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 ${
            errors?.streetAddress ? 'ring-2 ring-red-500/50' : ''
          }`}
        />
        {errors?.streetAddress && (
          <p className="text-xs text-red-500 mt-1">{errors.streetAddress}</p>
        )}
      </div>

      {/* 배송 메모 */}
      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-[#2D241E] mb-1.5">
          <FileText className="w-3.5 h-3.5 text-[#8C857E]" />
          Ghi chú giao hàng
          <span className="text-[#8C857E] font-normal">/ 배송 메모 (선택)</span>
        </label>
        <textarea
          value={value.note || ''}
          onChange={(e) => updateField('note', e.target.value)}
          placeholder="Gọi điện trước khi giao / 배송 전 연락 부탁드립니다"
          rows={2}
          className="w-full px-4 py-2.5 bg-[#F5F3ED] rounded-lg text-[#2D241E] placeholder:text-[#8C857E] focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 resize-none"
        />
      </div>
    </div>
  );
}
