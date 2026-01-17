'use client';

import { TextbookInfo } from '@/types';
import { Book, Check, Package } from 'lucide-react';
import Image from 'next/image';

interface TextbookSelectorProps {
  textbook: TextbookInfo;
  selected: boolean;
  onToggle: (selected: boolean) => void;
  disabled?: boolean;
}

export default function TextbookSelector({
  textbook,
  selected,
  onToggle,
  disabled = false
}: TextbookSelectorProps) {
  return (
    <div
      onClick={() => !disabled && onToggle(!selected)}
      className={`
        relative border-2 rounded-xl p-4 transition-all cursor-pointer
        ${selected
          ? 'border-[#4A5D4E] bg-[#4A5D4E]/5'
          : 'border-[#E5E1D8] hover:border-[#4A5D4E]/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* 선택 체크박스 */}
      <div className="absolute top-3 right-3">
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
          ${selected
            ? 'bg-[#4A5D4E] border-[#4A5D4E]'
            : 'border-[#8C857E] bg-white'
          }
        `}>
          {selected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>

      <div className="flex gap-4">
        {/* 교재 이미지 */}
        <div className="w-20 h-24 bg-[#F5F3ED] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {textbook.imageUrl ? (
            <Image
              src={textbook.imageUrl}
              alt={textbook.name}
              width={80}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <Book className="w-8 h-8 text-[#8C857E]" />
          )}
        </div>

        {/* 교재 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-medium">
              Giáo trình / 교재
            </span>
          </div>

          <h4 className="font-semibold text-[#2D241E] mb-1 line-clamp-1">
            {textbook.name}
          </h4>

          {textbook.description && (
            <p className="text-xs text-[#8C857E] mb-2 line-clamp-2">
              {textbook.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#4A5D4E]">
              {textbook.price.toLocaleString()}
              <span className="text-sm font-normal text-[#8C857E] ml-1">VNĐ</span>
            </span>
          </div>
        </div>
      </div>

      {/* 선택시 안내 메시지 */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-[#4A5D4E]/20">
          <p className="text-xs text-[#4A5D4E] flex items-center gap-1">
            <Check className="w-3 h-3" />
            Giáo trình sẽ được giao đến địa chỉ của bạn
            <span className="text-[#8C857E]">/ 교재가 배송됩니다</span>
          </p>
        </div>
      )}
    </div>
  );
}
