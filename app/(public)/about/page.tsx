import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { Seal } from '@/components/Seal'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: '소개',
  description: '저자 이력, 편집 원칙, 인용 정책.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        label="About"
        title="판단을 적는다"
        description="안보·국제정세 정보는 공짜로 넘친다. 사람들이 값을 치르는 지점은 정보가 아니라 판단이다. 이 저널은 자료를 쌓아두는 곳이 아니라, 근거를 밝혀 판단을 적는 곳을 지향한다."
      />

      <div className="max-w-(--measure) space-y-12 pb-8">
        <section>
          <div className="flex items-start gap-4">
            <Seal size={46} className="mt-1 shrink-0" />
            <div>
              <h2 className="font-serif text-xl font-bold">
                {SITE.name} <span className="text-base font-normal text-ink-faint">{SITE.nameHanja}</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                혜안(慧眼)은 사물의 본질을 꿰뚫어 보는 눈이다. 한미동맹·미국 국가전략·미중
                패권경쟁·전쟁 사례를 다루되, 사건을 나열하는 매체가 아니라 그 아래 놓인 구조를
                읽는 매체를 지향한다.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[0.75rem] tracking-[0.18em] uppercase">
            편집 원칙
          </h2>
          <ol className="prose">
            <li>
              <strong>공개 출처만 인용한다.</strong> 직무상 알게 된 비공개 정보는 어떤 형태로도
              사용하지 않는다. 모든 문건의 근거자료는 출처를 명시한다.
            </li>
            <li>
              <strong>반대 논거를 함께 적는다.</strong> 판단을 내리되, 그 판단이 틀릴 수 있는
              조건을 같이 밝힌다.
            </li>
            <li>
              <strong>작성 시점을 명시한다.</strong> 정세 분석은 시점의 산물이다. 사후에 드러난
              사실과 당시의 판단을 구분해 읽을 수 있어야 한다.
            </li>
            <li>
              <strong>작성 방법을 표기한다.</strong> 생성형 AI의 보조를 받은 문건은 그 사실을 문건
              하단에 적는다. 최종 판단과 검증의 책임은 {SITE.name}에 있다.
            </li>
            <li>
              <strong>편집 독립.</strong> 협찬·스폰서 콘텐츠는 그 사실을 문건 상단에 명시하며,
              협찬 여부가 분석의 결론에 영향을 주지 않는다.
            </li>
          </ol>
        </section>

        <section id="citation" className="scroll-mt-20">
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[0.75rem] tracking-[0.18em] uppercase">
            인용 정책
          </h2>
          <div className="prose">
            <p>
              연구·보도·정책 문서에서 자유롭게 인용할 수 있다. 문건 하단의 인용 서식을 복사해
              사용하면 된다. 다만 다음은 지켜주기 바란다.
            </p>
            <ul>
              <li>본문 전재(全載)는 사전 서면 동의를 받는다. 요약과 부분 인용은 자유롭다.</li>
              <li>인용 시 매체명·문서번호·발행일과 원문 링크를 함께 표기한다.</li>
              <li>맥락을 바꾸는 발췌는 하지 않는다.</li>
            </ul>
          </div>
        </section>

        <section id="institution" className="scroll-mt-20">
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[0.75rem] tracking-[0.18em] uppercase">
            기관 라이선스 · 문의
          </h2>
          <div className="prose">
            <p>
              부대·기관·기업 단위 열람은 인원 규모에 따른 연간 계약으로 제공한다. IP 대역 또는
              도메인 기반 자동 인증, 세금계산서 발행, 비공개 맞춤 브리핑을 함께 협의할 수 있다.
              강연·자문 문의도 같은 주소로 받는다.
            </p>
            <p>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 border-b border-ink pb-2 font-mono text-[0.75rem] tracking-[0.18em] uppercase">
            저작권 등급
          </h2>
          <div className="prose">
            <p>
              문건마다 저작권 지위가 다르다. {SITE.name}이 직접 쓴 분석보고서(A등급)와 미 정부가
              공개한 원문(B등급)만 공개하며, 타인 명의 저작물(C등급)은 권리자의 서면 동의를 받기 전까지
              공개하지 않는다. 내부 문서(D등급)는 공개 대상이 아니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
