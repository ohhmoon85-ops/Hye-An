import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { PRIVACY_MD } from '@/lib/legal'

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '혜안이 수집하는 개인정보 항목과 목적, 보유 기간, 위탁과 국외 이전, 정보주체의 권리.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      label="Privacy"
      title="개인정보 처리방침"
      description="무엇을 수집하고 왜 수집하며 얼마나 보관하는지, 어디에 맡기는지, 그리고 이용자가 무엇을 요구할 수 있는지를 밝힌다."
      markdown={PRIVACY_MD}
    />
  )
}
