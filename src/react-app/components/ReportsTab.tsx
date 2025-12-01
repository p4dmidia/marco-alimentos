import { useState, useEffect } from "react";
import { Download, Filter, TrendingUp, Users, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../services/supabaseClient";
import { ORGANIZATION_ID } from "@/shared/tenant";

interface CommissionReport {
  level: number;
  count: number;
  total: number;
  average: number;
}

interface RevenueReport {
  month: string;
  orders: number;
  revenue: number;
}

interface TopAffiliate {
  id: number;
  referral_code: string;
  referrals: number;
  earnings: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
  total: number;
}

interface AffiliateGrowth {
  month: string;
  count: number;
}

export default function ReportsTab() {
  const [commissionReports, setCommissionReports] = useState<CommissionReport[]>([]);
  const [revenueReports, setRevenueReports] = useState<RevenueReport[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [affiliateGrowth, setAffiliateGrowth] = useState<AffiliateGrowth[]>([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const start = period === "custom" && startDate ? new Date(startDate) : undefined;
      const end = period === "custom" && endDate ? new Date(endDate) : undefined;

      const now = new Date();
      const startPeriod = (() => {
        switch (period) {
          case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
          case "week": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          case "month": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          case "year": return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          case "custom": return start;
          default: return undefined;
        }
      })();
      const endPeriod = period === "custom" ? end : undefined;

      const [{ data: commissions }, { data: orders }, { data: affiliates }] = await Promise.all([
        supabase.from("commissions").select("amount,level,status,created_at,affiliate_id").eq("organization_id", ORGANIZATION_ID),
        supabase.from("orders").select("amount,status,created_at,affiliate_id").eq("organization_id", ORGANIZATION_ID),
        supabase.from("affiliates").select("id,referral_code,referred_by_id,created_at").eq("organization_id", ORGANIZATION_ID),
      ]);

      const inRange = (d: string) => {
        const dt = new Date(d);
        if (startPeriod && dt < startPeriod) return false;
        if (endPeriod && dt > endPeriod) return false;
        return true;
      };

      const cRows = (commissions || []).filter((c: any) => inRange(c.created_at));
      const oRows = (orders || []).filter((o: any) => inRange(o.created_at));
      const aRows = affiliates || [];

      const commissionMap = new Map<number, { count: number; total: number }>();
      for (const c of cRows) {
        const lvl = Number(c.level || 0);
        const amt = Number(c.amount || 0);
        const cur = commissionMap.get(lvl) || { count: 0, total: 0 };
        commissionMap.set(lvl, { count: cur.count + 1, total: cur.total + amt });
      }
      const commissionReportsData: CommissionReport[] = Array.from(commissionMap.entries()).map(([level, v]) => ({
        level,
        count: v.count,
        total: v.total,
        average: v.count ? v.total / v.count : 0,
      }));

      const byMonth = (rows: any[]) => {
        const map = new Map<string, { orders: number; revenue: number }>();
        for (const r of rows) {
          const d = new Date(r.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const cur = map.get(key) || { orders: 0, revenue: 0 };
          map.set(key, { orders: cur.orders + 1, revenue: cur.revenue + Number(r.amount || 0) });
        }
        return Array.from(map.entries()).map(([month, v]) => ({ month, orders: v.orders, revenue: v.revenue }));
      };
      const revenueReportsData: RevenueReport[] = byMonth(oRows);

      const ordersStatusData: OrdersByStatus[] = (() => {
        const m = new Map<string, { count: number; total: number }>();
        for (const o of oRows) {
          const s = o.status || "unknown";
          const cur = m.get(s) || { count: 0, total: 0 };
          m.set(s, { count: cur.count + 1, total: cur.total + Number(o.amount || 0) });
        }
        return Array.from(m.entries()).map(([status, v]) => ({ status, count: v.count, total: v.total }));
      })();

      const referralsMap = new Map<number, number>();
      for (const a of aRows) {
        if (a.referred_by_id) referralsMap.set(a.referred_by_id, (referralsMap.get(a.referred_by_id) || 0) + 1);
      }
      const earningsMap = new Map<number, number>();
      for (const c of cRows.filter((x: any) => x.status === "paid")) {
        earningsMap.set(c.affiliate_id, (earningsMap.get(c.affiliate_id) || 0) + Number(c.amount || 0));
      }
      const topAffiliatesData: TopAffiliate[] = aRows
        .map((a: any) => ({ id: a.id, referral_code: a.referral_code, referrals: referralsMap.get(a.id) || 0, earnings: earningsMap.get(a.id) || 0 }))
        .sort((x, y) => y.earnings - x.earnings)
        .slice(0, 20);

      const growthMap = new Map<string, number>();
      for (const a of aRows) {
        const d = new Date(a.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        growthMap.set(key, (growthMap.get(key) || 0) + 1);
      }
      const affiliateGrowthData: AffiliateGrowth[] = Array.from(growthMap.entries()).map(([month, count]) => ({ month, count }));

      setCommissionReports(commissionReportsData);
      setRevenueReports(revenueReportsData);
      setTopAffiliates(topAffiliatesData);
      setOrdersByStatus(ordersStatusData);
      setAffiliateGrowth(affiliateGrowthData);
    } catch (error) {
      console.error("Error loading reports:", error);
    }
    setLoading(false);
  };

  const handleFilterApply = () => {
    loadAllReports();
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38);
    doc.text("Marco Alimentos", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Relatorio de Desempenho", pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.text(`Gerado em: ${reportDate}`, pageWidth / 2, 35, { align: "center" });

    let yPosition = 45;

    // Period filter info
    if (period !== "all") {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      let periodText = "";
      switch (period) {
        case "today": periodText = "Periodo: Hoje"; break;
        case "week": periodText = "Periodo: Ultimos 7 dias"; break;
        case "month": periodText = "Periodo: Ultimos 30 dias"; break;
        case "year": periodText = "Periodo: Ultimo ano"; break;
        case "custom": periodText = `Periodo: ${startDate} ate ${endDate}`; break;
      }
      doc.text(periodText, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
    }

    // Commission Reports
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Comissoes por Nivel", 14, yPosition);
    yPosition += 5;

    const commissionTableData = commissionReports.map(report => [
      `Nivel ${report.level}`,
      report.count.toString(),
      `R$ ${report.total.toFixed(2)}`,
      `R$ ${report.average.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Nivel", "Quantidade", "Total", "Media"]],
      body: commissionTableData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Revenue Reports
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text("Receita Mensal", 14, yPosition);
    yPosition += 5;

    const revenueTableData = revenueReports.map(report => [
      report.month,
      report.orders.toString(),
      `R$ ${report.revenue.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Mes", "Pedidos", "Receita"]],
      body: revenueTableData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Top Affiliates
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text("Top 20 Afiliados", 14, yPosition);
    yPosition += 5;

    const affiliatesTableData = topAffiliates.map((affiliate, index) => [
      (index + 1).toString(),
      affiliate.referral_code,
      affiliate.referrals.toString(),
      `R$ ${affiliate.earnings.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Rank", "Codigo", "Indicacoes", "Ganhos"]],
      body: affiliatesTableData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: 14, right: 14 },
    });

    // Summary
    if ((doc as any).lastAutoTable.finalY > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(12);
    doc.text("Resumo Geral", 14, yPosition);
    yPosition += 5;

    const totalCommissions = commissionReports.reduce((sum, r) => sum + r.total, 0);
    const totalRevenue = revenueReports.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = revenueReports.reduce((sum, r) => sum + r.orders, 0);

    const summaryData = [
      ["Total de Comissoes Pagas", `R$ ${totalCommissions.toFixed(2)}`],
      ["Receita Total", `R$ ${totalRevenue.toFixed(2)}`],
      ["Total de Pedidos", totalOrders.toString()],
      ["Lucro Liquido", `R$ ${(totalRevenue - totalCommissions).toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      body: summaryData,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { halign: "right", cellWidth: 60 }
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Marco Alimentos - Relatorio Confidencial", pageWidth / 2, footerY, { align: "center" });

    // Save
    const fileName = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#16a34a"];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-900">Filtros de Relatorio</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Todos os Dados</option>
              <option value="today">Hoje</option>
              <option value="week">Ultimos 7 dias</option>
              <option value="month">Ultimos 30 dias</option>
              <option value="year">Ultimo ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {period === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFilterApply}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Carregando..." : "Aplicar Filtros"}
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-900">Evolucao de Receita</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueReports}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              labelStyle={{ color: "#000" }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#dc2626" name="Receita" strokeWidth={2} />
            <Line type="monotone" dataKey="orders" stroke="#ea580c" name="Pedidos" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Commission Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-gray-900">Distribuicao de Comissoes</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={commissionReports as any[]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ level, total }: any) => `Nivel ${level}: R$ ${Number(total).toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {commissionReports.map((_item, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-gray-900">Crescimento de Afiliados</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={affiliateGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip labelStyle={{ color: "#000" }} />
              <Legend />
              <Bar dataKey="count" fill="#dc2626" name="Novos Afiliados" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Pedidos por Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ordersByStatus.map((item) => (
            <div key={item.status} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{item.status.toUpperCase()}</p>
              <p className="text-2xl font-bold text-gray-900">{item.count} pedidos</p>
              <p className="text-sm text-green-600 font-semibold">R$ {item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Details Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Detalhamento de Comissoes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nivel</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantidade</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissionReports.map((report) => (
                <tr key={report.level} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Nivel {report.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{report.count} comissoes</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    R$ {report.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    R$ {report.average.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Affiliates Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Top 20 Afiliados</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Codigo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Indicacoes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ganhos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topAffiliates.map((affiliate, index) => (
                <tr key={affiliate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                    {affiliate.referral_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {affiliate.referrals}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    R$ {affiliate.earnings.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
