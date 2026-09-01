import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { TERMS_MD } from '@/lib/legal'

export const metadata: Metadata = {
  title: '이용약관',
  description: '혜안 서비스 이용약관. 서비스 내용, 결제와 자동 갱신, 청약철회와 환불, 해지, 저작권과 인용 범위.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      label="Terms"
      title="이용약관"
      description="서비스 내용, 결제와 자동 갱신, 청약철회와 환불, 해지 절차, 저작권과 인용 범위를 정한다."
      markdown={TERMS_MD}
    />
  )
}
