import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireOrg } from '../middleware/org';

const prisma = new PrismaClient();
const r = Router();

r.use(requireAuth, requireOrg);

// Comprehensive dashboard analytics
r.get('/analytics', async (req, res) => {
  const orgId = req.orgId!;
  
  // Get date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

  try {
    // Overview metrics with growth calculations
    const [
      totalRevenue, lastYearRevenue,
      totalQuotes, lastMonthQuotes,
      totalOrders, lastMonthOrders,
      totalCustomers, lastMonthCustomers
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { organizationId: orgId, paymentStatus: 'PAID' },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          paymentStatus: 'PAID',
          date: { gte: startOfLastYear, lte: endOfLastYear }
        },
        _sum: { total: true }
      }),
      prisma.quote.count({ where: { organizationId: orgId } }),
      prisma.quote.count({ 
        where: { 
          organizationId: orgId, 
          date: { gte: startOfLastMonth, lte: endOfLastMonth }
        } 
      }),
      prisma.order.count({ where: { organizationId: orgId } }),
      prisma.order.count({ 
        where: { 
          organizationId: orgId, 
          orderDate: { gte: startOfLastMonth, lte: endOfLastMonth }
        } 
      }),
      prisma.client.count({ where: { organizationId: orgId } }),
      prisma.client.count({ where: { organizationId: orgId } }) // Placeholder - need createdAt field
    ]);

    const thisMonthQuotes = await prisma.quote.count({ 
      where: { organizationId: orgId, date: { gte: startOfMonth } } 
    });
    const thisMonthOrders = await prisma.order.count({ 
      where: { organizationId: orgId, orderDate: { gte: startOfMonth } } 
    });

    // Calculate growth percentages
    const revenueGrowth = lastYearRevenue._sum.total ? 
      ((Number(totalRevenue._sum.total || 0) - Number(lastYearRevenue._sum.total)) / Number(lastYearRevenue._sum.total)) * 100 : 0;
    const quotesGrowth = lastMonthQuotes ? 
      ((thisMonthQuotes - lastMonthQuotes) / lastMonthQuotes) * 100 : 0;
    const ordersGrowth = lastMonthOrders ? 
      ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;

    // Detailed quotes analysis
    const [quotesStats, quotesValue] = await Promise.all([
      prisma.quote.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true }
      }),
      prisma.quote.aggregate({
        where: { organizationId: orgId },
        _sum: { total: true },
        _avg: { total: true }
      })
    ]);

    const quotesBreakdown = {
      draft: quotesStats.find(s => s.status === 'DRAFT')?._count.status || 0,
      finalized: quotesStats.find(s => s.status === 'FINALIZED')?._count.status || 0,
      cancelled: quotesStats.find(s => s.status === 'CANCELLED')?._count.status || 0
    };

    const conversionRate = totalQuotes > 0 ? (quotesBreakdown.finalized / totalQuotes) * 100 : 0;

    // Detailed orders analysis
    const [ordersStats, ordersValue] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true }
      }),
      prisma.order.aggregate({
        where: { organizationId: orgId },
        _sum: { advanceAmount: true, balanceAmount: true }
      })
    ]);

    const ordersBreakdown = {
      new: ordersStats.find(s => s.status === 'NEW')?._count.status || 0,
      confirmed: ordersStats.find(s => s.status === 'CONFIRMED')?._count.status || 0,
      inProduction: ordersStats.find(s => s.status === 'IN_PRODUCTION')?._count.status || 0,
      ready: ordersStats.find(s => s.status === 'READY')?._count.status || 0,
      delivered: ordersStats.find(s => s.status === 'DELIVERED')?._count.status || 0
    };

    // Revenue analysis
    const [thisMonthRevenue, lastMonthRevenue, thisYearRevenue, paidRevenue, pendingRevenue, overdueRevenue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          date: { gte: startOfMonth },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          date: { gte: startOfYear },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { organizationId: orgId, paymentStatus: 'PAID' },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { organizationId: orgId, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          paymentStatus: 'UNPAID',
          date: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days ago
        },
        _sum: { total: true }
      })
    ]);

    // Top customers
    const topCustomers = await prisma.client.findMany({
      where: { organizationId: orgId },
      include: {
        orders: {
          select: {
            advanceAmount: true,
            balanceAmount: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      take: 5
    });

    const topCustomersWithValue = topCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      orderCount: customer._count.orders,
      totalValue: customer.orders.reduce((sum, order) => 
        sum + Number(order.advanceAmount || 0) + Number(order.balanceAmount || 0), 0
      )
    })).sort((a, b) => b.totalValue - a.totalValue);

    // Recent activity
    const [recentQuotes, recentOrders, recentInvoices] = await Promise.all([
      prisma.quote.findMany({
        where: { organizationId: orgId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { client: true }
      }),
      prisma.order.findMany({
        where: { organizationId: orgId },
        orderBy: { orderDate: 'desc' },
        take: 5,
        include: { client: true }
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId },
        orderBy: { date: 'desc' },
        take: 3,
        include: { order: { include: { client: true } } }
      })
    ]);

    const recentActivity = [
      ...recentQuotes.map(q => ({
        id: q.id,
        type: 'quote' as const,
        title: `Quote ${q.quoteNo} for ${q.client?.name || 'Unknown'}`,
        amount: Number(q.total || 0),
        date: q.date?.toISOString() || new Date().toISOString(),
        status: q.status
      })),
      ...recentOrders.map(o => ({
        id: o.id,
        type: 'order' as const,
        title: `Order ${o.orderNo} for ${o.client?.name || 'Unknown'}`,
        amount: Number(o.advanceAmount || 0) + Number(o.balanceAmount || 0),
        date: o.orderDate?.toISOString() || new Date().toISOString(),
        status: o.status
      })),
      ...recentInvoices.map(i => ({
        id: i.id,
        type: 'invoice' as const,
        title: `Invoice ${i.invoiceNo} for ${i.order?.client?.name || 'Unknown'}`,
        amount: Number(i.total || 0),
        date: i.date?.toISOString() || new Date().toISOString(),
        status: i.paymentStatus
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    const analytics = {
      overview: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        revenueGrowth,
        totalQuotes,
        quotesGrowth,
        totalOrders,
        ordersGrowth,
        totalCustomers,
        customersGrowth: 0 // Placeholder
      },
      quotes: {
        total: totalQuotes,
        ...quotesBreakdown,
        thisMonth: thisMonthQuotes,
        lastMonth: lastMonthQuotes,
        conversionRate,
        avgValue: Number(quotesValue._avg.total || 0),
        totalValue: Number(quotesValue._sum.total || 0)
      },
      orders: {
        total: totalOrders,
        ...ordersBreakdown,
        thisMonth: thisMonthOrders,
        lastMonth: lastMonthOrders,
        avgValue: totalOrders > 0 ? 
          (Number(ordersValue._sum.advanceAmount || 0) + Number(ordersValue._sum.balanceAmount || 0)) / totalOrders : 0,
        totalValue: Number(ordersValue._sum.advanceAmount || 0) + Number(ordersValue._sum.balanceAmount || 0)
      },
      revenue: {
        thisMonth: Number(thisMonthRevenue._sum.total || 0),
        lastMonth: Number(lastMonthRevenue._sum.total || 0),
        thisYear: Number(thisYearRevenue._sum.total || 0),
        lastYear: Number(lastYearRevenue._sum.total || 0),
        pending: Number(pendingRevenue._sum.total || 0),
        paid: Number(paidRevenue._sum.total || 0),
        overdue: Number(overdueRevenue._sum.total || 0),
        growth: revenueGrowth
      },
      customers: {
        total: totalCustomers,
        active: totalCustomers, // Placeholder
        new: 0, // Placeholder
        thisMonth: 0, // Placeholder
        lastMonth: 0, // Placeholder
        topCustomers: topCustomersWithValue
      },
      products: {
        total: await prisma.product.count({ where: { organizationId: orgId } }),
        topProducts: [] // Placeholder for now
      },
      recentActivity
    };

    res.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Legacy stats endpoint for backward compatibility
r.get('/stats', async (req, res) => {
  const orgId = req.orgId!;
  
  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  try {
    // Quotes stats
    const [totalQuotes, draftQuotes, finalizedQuotes, thisMonthQuotes] = await Promise.all([
      prisma.quote.count({ where: { organizationId: orgId } }),
      prisma.quote.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      prisma.quote.count({ where: { organizationId: orgId, status: 'FINALIZED' } }),
      prisma.quote.count({ 
        where: { 
          organizationId: orgId, 
          date: { gte: startOfMonth } 
        } 
      })
    ]);

    // Orders stats
    const [totalOrders, newOrders, inProductionOrders, readyOrders, thisMonthOrders] = await Promise.all([
      prisma.order.count({ where: { organizationId: orgId } }),
      prisma.order.count({ where: { organizationId: orgId, status: 'NEW' } }),
      prisma.order.count({ where: { organizationId: orgId, status: 'IN_PRODUCTION' } }),
      prisma.order.count({ where: { organizationId: orgId, status: 'READY' } }),
      prisma.order.count({ 
        where: { 
          organizationId: orgId, 
          orderDate: { gte: startOfMonth } 
        } 
      })
    ]);

    // Clients stats
    const [totalClients, thisMonthClients] = await Promise.all([
      prisma.client.count({ where: { organizationId: orgId } }),
      0 // placeholder for now
    ]);

    // Revenue stats (from invoices)
    const [thisMonthRevenue, lastMonthRevenue, pendingRevenue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          date: { gte: startOfMonth },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          date: { gte: startOfLastMonth, lte: endOfLastMonth },
          paymentStatus: 'PAID'
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          organizationId: orgId, 
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] }
        },
        _sum: { total: true }
      })
    ]);

    // Recent activity
    const recentQuotes = await prisma.quote.findMany({
      where: { organizationId: orgId },
      orderBy: { date: 'desc' },
      take: 3,
      include: { client: true }
    });

    const recentOrders = await prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { orderDate: 'desc' },
      take: 3,
      include: { client: true }
    });

    const recentInvoices = await prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { date: 'desc' },
      take: 2,
      include: { order: { include: { client: true } } }
    });

    // Format recent activity
    const recentActivity = [
      ...recentQuotes.map(q => ({
        id: q.id,
        type: 'quote' as const,
        title: `Quote ${q.quoteNo} for ${q.client?.name || 'Unknown'}`,
        amount: Number(q.total || 0),
        date: q.date?.toISOString() || new Date().toISOString(),
        status: q.status
      })),
      ...recentOrders.map(o => ({
        id: o.id,
        type: 'order' as const,
        title: `Order ${o.orderNo} for ${o.client?.name || 'Unknown'}`,
        amount: Number(o.advanceAmount || 0) + Number(o.balanceAmount || 0),
        date: o.orderDate?.toISOString() || new Date().toISOString(),
        status: o.status
      })),
      ...recentInvoices.map(i => ({
        id: i.id,
        type: 'invoice' as const,
        title: `Invoice ${i.invoiceNo} for ${i.order?.client?.name || 'Unknown'}`,
        amount: Number(i.total || 0),
        date: i.date?.toISOString() || new Date().toISOString(),
        status: i.paymentStatus
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    const stats = {
      quotes: {
        total: totalQuotes,
        draft: draftQuotes,
        finalized: finalizedQuotes,
        thisMonth: thisMonthQuotes
      },
      orders: {
        total: totalOrders,
        new: newOrders,
        inProduction: inProductionOrders,
        ready: readyOrders,
        thisMonth: thisMonthOrders
      },
      clients: {
        total: totalClients,
        thisMonth: thisMonthClients
      },
      revenue: {
        thisMonth: Number(thisMonthRevenue._sum.total || 0),
        lastMonth: Number(lastMonthRevenue._sum.total || 0),
        pending: Number(pendingRevenue._sum.total || 0)
      },
      recentActivity
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default r;