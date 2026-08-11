import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the login page by default', () => {
    render(<App />);
    expect(screen.getByText('입장하기')).toBeInTheDocument();
  });

  it('logs a team in with a valid code and shows the team page', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('예: K7QX');
    fireEvent.change(input, { target: { value: 'K7QX' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(screen.getByText('우리 팀 점수')).toBeInTheDocument();
  });

  it('shows an error for an invalid team code', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('예: K7QX');
    fireEvent.change(input, { target: { value: 'ZZZZ' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(screen.getByText('없는 코드예요. 다시 확인해 주세요.')).toBeInTheDocument();
  });

  it('logs into the admin dashboard with PIN 9999', () => {
    render(<App />);
    fireEvent.click(screen.getByText('담당자 · 관리자 로그인 →'));
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(screen.getByText('로그인'));
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });
});
