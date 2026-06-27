# GO AIR RAID v0.4

GO ENGINE 구조로 재구성한 모바일 1945 스타일 슈팅 프로토타입입니다.

## 핵심 변경

- 기존 단일 파일/인라인 스크립트 구조를 모듈 구조로 분리
- Canvas 도형 중심 렌더링을 Sprite 기반 drawImage 렌더링으로 전환
- 플레이어 기체 5단계 Sprite 적용
- 적 기체 5종 Sprite 적용: Scout, Fast, Bomber, Suicide, Boss
- 전투 공간을 화면의 2배 World로 확장
- Camera가 Player를 따라가는 구조 적용
- 레이저를 1프레임 지속형 관통 공격으로 재작성
- 메타 성장 데이터를 go_airraid_meta_v04에 저장
- Unity 이식 기준에 맞춰 Game / Player / Enemy / Wave / Collision / UI 역할 분리

## 실행

GitHub Pages 또는 로컬 서버에서 index.html을 실행합니다.

모듈 스크립트를 사용하므로 파일 더블클릭보다 서버 실행을 권장합니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소 접속:

```text
http://localhost:8000
```

## 구조

```text
js/core      - Game, Camera, Input, Assets
js/entities  - Player, Enemy, Bullet
js/systems   - Wave, Collision, Meta, Particle
js/ui        - HUD, Menu
assets       - Sprite 이미지
```

## 다음 단계 v0.5

- Wave 데이터를 JSON/JS 데이터 테이블로 분리
- 보스 패턴 추가
- 레벨업 카드 자동 선택 타이머 복구
- 실드 실제 판정 구현
- 사운드 시스템 추가
- 모바일 해상도별 조작감 튜닝
