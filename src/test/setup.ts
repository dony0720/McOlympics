import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// 로그인한 팀 코드를 localStorage에 저장하므로, 테스트 간 상태가 새지 않도록 매번 비운다.
beforeEach(() => {
  window.localStorage.clear();
});
