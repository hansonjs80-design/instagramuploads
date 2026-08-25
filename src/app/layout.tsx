import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Exercise Content Studio",
    template: "%s · Exercise Content Studio",
  },
  description: "출처를 지키는 운동·재활 콘텐츠 제작 스튜디오",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
