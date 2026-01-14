export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export async function generateStaticParams() {
  // 더미 파라미터 반환 - 실제 페이지는 클라이언트에서 처리
  return [
    { chapterId: 'dummy' }
  ];
}