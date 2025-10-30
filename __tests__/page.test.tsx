/**
 * @file __tests__/page.test.tsx
 * Tests the Home server component (src/app/page.tsx).
 * - Mocks Prisma methods used by getStats/getUpcomingExpirations
 * - Stubs next/link
 * - Freezes time to validate "Urgente" and "Atrasado" labels
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Stub next/link to a plain <a> for testing ---
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.PropsWithChildren<{ href: string; [key: string]: unknown }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// --- Mock Prisma layer used by the page ---
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

// Import after mocks so the page uses our fakes
import Home from '@/app/page';

describe('Home page (server component)', () => {
  const FIXED_NOW_ISO = '2025-10-30T12:00:00.000Z'; // aligns with your timezone note

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
    // --- Arrange mocked stats ---
    // product.count is called twice: [totalProducts, lowStockCount]
    mockProductCount
      .mockResolvedValueOnce(42) // totalProducts
      .mockResolvedValueOnce(3); // lowStockCount

    mockCustomerCount.mockResolvedValueOnce(100); // totalCustomers

    // sale.count is called twice: [activeSales, overdueSales]
    mockSaleCount
      .mockResolvedValueOnce(7) // activeSales
      .mockResolvedValueOnce(1); // overdueSales

    // monthRevenue aggregate
    mockSaleAggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 12345.67 },
    });

    // --- Arrange upcoming expirations (one overdue, one urgent, one normal) ---
    const upcoming = [
      {
        id: 's1',
        dataDevolucaoPrevista: '2025-10-29', // yesterday -> Atrasado
        status: 'ATRASADO',
        customer: { name: 'Cliente A' },
        itens: [],
      },
      {
        id: 's2',
        dataDevolucaoPrevista: '2025-11-01', // <= 3 days -> Urgente
        status: 'ATIVO',
        customer: { name: 'Cliente B' },
        itens: [],
      },
      {
        id: 's3',
        dataDevolucaoPrevista: '2025-11-10', // normal
        status: 'ATIVO',
        customer: { name: 'Cliente C' },
        itens: [],
      },
    ];
    mockSaleFindMany.mockResolvedValueOnce(upcoming);

    // --- Act ---
    // Home is an async server component; render the resolved element
    render(await Home());

    // --- Assert header exists ---
    expect(
      screen.getByText('Venda e Aluguel de Materiais')
    ).toBeInTheDocument();

    // --- Assert stats ---
    expect(screen.getByText('Receita Mês')).toBeInTheDocument();
    // Use regex to match currency format (handles non-breaking spaces)
    expect(screen.getByText(/R\$\s*12\.345,67/)).toBeInTheDocument();

    expect(screen.getByText('Vendas Ativas')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByText('Atrasadas')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Use getAllByText for duplicate text and verify the stats card
    const produtosElements = screen.getAllByText('Produtos');
    expect(produtosElements.length).toBeGreaterThan(0);
    expect(screen.getByText('42')).toBeInTheDocument();

    const clientesElements = screen.getAllByText('Clientes');
    expect(clientesElements.length).toBeGreaterThan(0);
    expect(screen.getByText('100')).toBeInTheDocument();

    // --- Assert Upcoming table content ---
    expect(screen.getByText('Próximas Devoluções')).toBeInTheDocument();

    // Customer links present
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    expect(screen.getByText('Cliente C')).toBeInTheDocument();

    // Badges: "Atrasado" and "Urgente"
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  test('renders empty state when there are no upcoming expirations', async () => {
    // --- Arrange stats (zeros are fine for this test) ---
    mockProductCount
      .mockResolvedValueOnce(0) // totalProducts
      .mockResolvedValueOnce(0); // lowStockCount
    mockCustomerCount.mockResolvedValueOnce(0);
    mockSaleCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockSaleAggregate.mockResolvedValueOnce({ _sum: { totalAmount: 0 } });

    // --- No upcoming expirations ---
    mockSaleFindMany.mockResolvedValueOnce([]);

    // --- Act ---
    render(await Home());

    // --- Assert empty state ---
    expect(
      screen.getByText('Nenhuma devolução pendente')
    ).toBeInTheDocument();
  });
});
