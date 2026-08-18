# 전국 아파트 입주물량 / 매출 대시보드 — 정적 웹사이트 (빌드 단계 없음)
FROM nginx:alpine

# 한글 UTF-8 + IPv4/IPv6 동시 청취 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 정적 자산 복사 (로컬 도구·비공개 파일은 .dockerignore 로 제외)
COPY . /usr/share/nginx/html/

# 배포 설정 파일 자체는 웹에 노출하지 않는다
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/nginx.conf

EXPOSE 80

# localhost 는 alpine 에서 IPv6(::1) 를 먼저 시도하므로 127.0.0.1 로 고정한다
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
