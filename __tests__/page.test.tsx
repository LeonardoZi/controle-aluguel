/**
 * @file __tests__/page.test.tsx
 * Testa o componente Home (server) localizado em src/app/page.tsx.
 * - Faz mock dos métodos do Prisma usados por getStats/getUpcomingExpirations
 * - Stub para next/link
 * - Congela o tempo para validar os rótulos "Urgente" e "Atrasado"
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.PropsWithChildren<{ href: string; [key: string]: unknown }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProductCount = jest.fn();
const mockCustomerCount = jest.fn();
const mockSaleCount = jest.fn();
const mockSaleFindMany = jest.fn();
const mockSaleAggregate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return {
      product: {
        count: mockProductCount,
      },
      customer: {
        count: mockCustomerCount,
      },
      sale: {
        count: mockSaleCount,
        findMany: mockSaleFindMany,
        aggregate: mockSaleAggregate,
      },
    };
  },
}));

import Home from '@/app/page';

describe('Home page (server component)', () => {
  const FIXED_NOW_ISO = '2025-10-30T12:00:00.000Z';

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(new Date(FIXED_NOW_ISO));
    jest.clearAllMocks();
  });

  test('renders stats and lists upcoming expirations with correct badges', async () => {
    mockProductCount
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(3);

    mockCustomerCount.mockResolvedValueOnce(100);

    mockSaleCount
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(1);

    mockSaleAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 12345.67 },
    });

    const upcoming = [
      {
        id: 's1',
        dataDevolucaoPrevista: '2025-10-29',
        status: 'ATRASADO',
        customer: { name: 'Cliente A' },
        itens: [],
      },
      {
        id: 's2',
        dataDevolucaoPrevista: '2025-11-01',
        status: 'ATIVO',
        customer: { name: 'Cliente B' },
        itens: [],
      },
      {
        id: 's3',
        dataDevolucaoPrevista: '2025-11-10',
        status: 'ATIVO',
        customer: { name: 'Cliente C' },
        itens: [],
      },
    ];
    mockSaleFindMany.mockResolvedValueOnce(upcoming);

    render(await Home());

    expect(
      screen.getByText('Venda e Aluguel de Materiais')
    ).toBeInTheDocument();

    expect(screen.getByText('Receita Mês')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*12\.345,67/)).toBeInTheDocument();

    expect(screen.getByText('Vendas Ativas')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByText('Atrasadas')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    const produtosElements = screen.getAllByText('Produtos');
    expect(produtosElements.length).toBeGreaterThan(0);
    expect(screen.getByText('42')).toBeInTheDocument();

    const clientesElements = screen.getAllByText('Clientes');
    expect(clientesElements.length).toBeGreaterThan(0);
    expect(screen.getByText('100')).toBeInTheDocument();

    expect(screen.getByText('Próximas Devoluções')).toBeInTheDocument();

    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    expect(screen.getByText('Cliente C')).toBeInTheDocument();

    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  test('renders empty state when there are no upcoming expirations', async () => {
    mockProductCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockCustomerCount.mockResolvedValueOnce(0);
    mockSaleCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockSaleAggregate.mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

    mockSaleFindMany.mockResolvedValueOnce([]);

    render(await Home());

    expect(
      screen.getByText('Nenhuma devolução pendente')
    ).toBeInTheDocument();
  });
});
