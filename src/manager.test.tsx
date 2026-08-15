import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

vi.mock('./hooks/useCompetitionData', () => import('./test/mockCompetitionData'));

function loginAsManager() {
  render(<App />);
  fireEvent.click(screen.getByText('담당자 · 관리자 로그인 →'));
  fireEvent.change(screen.getByPlaceholderText('••••'), { target: { value: '1234' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
}

describe('담당자 점수 입력 흐름', () => {
  beforeEach(loginAsManager);

  it('전 팀이 다 같이 하는 게임은 대진 없이 6팀 점수를 바로 입력한다', () => {
    fireEvent.click(screen.getByText('몸으로 말해요'));

    expect(screen.getByText('전 팀이 다 같이 진행하는 게임이에요. 팀별 점수를 입력하세요.')).toBeInTheDocument();
    ['1팀', '2팀', '3팀', '4팀', '5팀', '6팀'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: '+' })).toHaveLength(6);
  });

  it('10점 단위로 점수가 올라간다', () => {
    fireEvent.click(screen.getByText('몸으로 말해요'));
    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0]);
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('마지막 게임도 대진이 있어 점수를 입력할 수 있다', () => {
    fireEvent.click(screen.getByText('할리갈리'));

    expect(screen.getByText('진행할 대진을 선택하세요.')).toBeInTheDocument();
    expect(screen.getByText('1라운드')).toBeInTheDocument();
    expect(screen.getByText('2라운드')).toBeInTheDocument();
    expect(screen.getByText('3라운드')).toBeInTheDocument();

    const firstMatch = screen.getByText('1라운드').closest('button');
    expect(firstMatch).not.toBeNull();
    expect(within(firstMatch!).getByText('2팀')).toBeInTheDocument();
    expect(within(firstMatch!).getByText('4팀')).toBeInTheDocument();

    fireEvent.click(firstMatch!);
    expect(screen.getByText('점수 입력')).toBeInTheDocument();
  });
});

describe('팀 일정표', () => {
  it('라운드와 상대 팀을 함께 보여준다', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('예: K7QX'), { target: { value: 'K7QX' } });
    fireEvent.click(screen.getByText('입장하기'));
    fireEvent.click(screen.getByRole('button', { name: '🏅 진행 순서' }));

    expect(screen.getByText('1부 · 전체 진행')).toBeInTheDocument();
    expect(screen.getByText('전 팀 다 같이')).toBeInTheDocument();
    // 1팀은 2부 1라운드에 가위바위보로 5팀과 붙는다.
    expect(screen.getByText('2부 1라운드')).toBeInTheDocument();
    expect(screen.getByText('3부 1라운드')).toBeInTheDocument();
  });
});
