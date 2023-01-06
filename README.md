# chat-app-server

## 전제 조건

- mongodb 설치
- 데이터베이스에 연결


## 설명

- 익스프레스 서버 생성
- API 유효성 검사 수행
- 사용자 API + 데이터베이스 생성
  - 사용자 생성
  - ID로 사용자 가져오기
  - 모든 사용자 가져오기
  - 아이디로 사용자 삭제
- 미들웨어
  - JWT 인증(decode/encode)
  - 로그인 미들웨어
- 웹 소켓
  - 사용자 아이디 유지
  - 사용자 채팅방 입장
  - 사용자 채팅방 떠나기
- 채팅방
  - 채팅방 및 채팅 메시지
  - API
    - 채팅방 생성 및 가져오기
    - 채팅방에 메시지 전송
    - 채팅방의 대화 가져오기
    - 전체 대화를 읽음으로 표시
    - 모든 채팅에서 최근 대화 가져오기

