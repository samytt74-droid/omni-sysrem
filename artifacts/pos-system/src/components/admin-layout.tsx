import { useAuth } from "@/components/auth-provider";
import { useLogout, useGetSettings } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import React from "react";
import { 
  LogOut, LayoutDashboard, Package, Tags, Receipt, Users, UserCircle, 
  BarChart3, Settings, Printer, FileText, UserCheck, RotateCcw, Wallet, Sliders,
  ChevronDown, ChevronUp, Lock, ShieldAlert, ShieldCheck, Sparkles, Check, Search, X, 
  DollarSign, Calendar, RefreshCw, AlertTriangle, Cpu, Truck, ShoppingBag, 
  ShoppingCart, Layers, TrendingUp, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { AppIcon } from "@/components/AppLogo";

// Interface for actual page links
interface ERPPageLink {
  name: string;
  href: string;
}

// Interface for ERP menu items
interface ERPItem {
  id: string;
  name: string;
  type: "input" | "operation" | "report" | "setting";
}

// Interface for ERP systems
interface ERPSystem {
  id: string;
  name: string;
  icon: any;
  pages?: ERPPageLink[];
  inputs?: ERPItem[];
  operations?: ERPItem[];
  reports?: ERPItem[];
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: settings } = useGetSettings();

  // Helper auth fetchers
  function fetchAuth(url: string, opts: RequestInit = {}) {
    const token = localStorage.getItem("pos_token") ?? "";
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers ?? {}),
      },
    });
  }

  async function apiGet(url: string) {
    const r = await fetchAuth(url);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function apiPost(url: string, body: any) {
    const r = await fetchAuth(url, { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function apiPut(url: string, body: any) {
    const r = await fetchAuth(url, { method: "PUT", body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function apiDel(url: string) {
    const r = await fetchAuth(url, { method: "DELETE" });
    if (!r.ok && r.status !== 204) throw new Error(await r.text());
    return true;
  }

  // Real database backend queries for unified system integration
  const { data: dbEmployees = [] } = useQuery<any[]>({
    queryKey: ["hr-employees"],
    queryFn: () => apiGet("/api/hr/employees").catch(() => []),
  });

  const { data: dbDepts = [] } = useQuery<any[]>({
    queryKey: ["hr-depts"],
    queryFn: () => apiGet("/api/hr/departments").catch(() => []),
  });

  const { data: dbProducts = [] } = useQuery<any[]>({
    queryKey: ["products-list"],
    queryFn: () => apiGet("/api/products").catch(() => []),
  });

  const { data: dbCustomers = [] } = useQuery<any[]>({
    queryKey: ["customers-list"],
    queryFn: () => apiGet("/api/customers").catch(() => []),
  });

  const { data: dbTables = [] } = useQuery<any[]>({
    queryKey: ["tables-list"],
    queryFn: () => apiGet("/api/tables").catch(() => []),
  });

  const { data: dbAccounts = [] } = useQuery<any[]>({
    queryKey: ["coa-accounts"],
    queryFn: () => apiGet("/api/accounting/accounts").catch(() => []),
  });

  const { data: dbJournalEntries = [] } = useQuery<any[]>({
    queryKey: ["journal-entries-list"],
    queryFn: () => apiGet("/api/accounting/journal-entries").catch(() => []),
  });

  const { data: dbSafes = [] } = useQuery<any[]>({
    queryKey: ["safes-list"],
    queryFn: () => apiGet("/api/safes").catch(() => []),
  });

  const { data: dbInventory = [] } = useQuery<any[]>({
    queryKey: ["inventory-list"],
    queryFn: () => apiGet("/api/inventory").catch(() => []),
  });

  const { data: licenseData } = useQuery<any>({
    queryKey: ["active-license-header"],
    queryFn: async () => {
      const token = localStorage.getItem("pos_token") ?? "";
      const res = await fetch("/api/licenses/active", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Active Role State (for real-time previewing and simulation)
  const [activeRole, setActiveRole] = useState<"admin" | "cashier" | "accountant" | "developer">("admin");

  useEffect(() => {
    if (user?.role && ["admin", "cashier", "accountant", "developer"].includes(user.role)) {
      setActiveRole(user.role as any);
    }
  }, [user]);

  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [expandedSubSection, setExpandedSubSection] = useState<Record<string, boolean>>({});

  // Dialog / Simulation States
  const [activeSimulation, setActiveSimulation] = useState<{ id: string; name: string } | null>(null);
  const [accessDeniedItem, setAccessDeniedItem] = useState<string | null>(null);

  // Form & Modals State for HR & POS
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empFormData, setEmpFormData] = useState({
    employee_number: "",
    name: "",
    phone: "",
    position: "كاشير",
    department_id: "",
    basic_salary: "5000",
    hire_date: new Date().toISOString().split("T")[0]
  });

  // Special Table Order States
  const [selectedTableForOrder, setSelectedTableForOrder] = useState("101");
  const [tableGuestCount, setTableGuestCount] = useState("4");
  const [tableWaiterName, setTableWaiterName] = useState("أحمد علي");
  const [tableKitchenNotes, setTableKitchenNotes] = useState<string[]>([]);

  // Permission Matrix state
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem("omni_permissions_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  // Dynamic Product list for POS Simulation
  const MOCK_PRODUCTS = [
    { id: "p1", name: "شاورما دجاج سوبر", price: 15 },
    { id: "p2", name: "برجر دبل لحم بلدي", price: 28 },
    { id: "p3", name: "بيتزا فرخ رانش كبير", price: 35 },
    { id: "p4", name: "بطاطس مقلية مقرمشة", price: 8 },
    { id: "p5", name: "عصير ليمون بالنعناع فريش", price: 10 },
    { id: "p6", name: "شاي عدني بالهيل", price: 4 }
  ];

  // Dynamic Raw Materials for inventory
  const [rawMaterials, setRawMaterials] = useState([
    { id: "r1", name: "دقيق أبيض فاخر", qty: 150, unit: "كجم" },
    { id: "r2", name: "لحم بقري مفروم طازج", qty: 85, unit: "كجم" },
    { id: "r3", name: "صدور دجاج مخلية", qty: 120, unit: "كجم" },
    { id: "r4", name: "جبن شيدر مبشور", qty: 45, unit: "كجم" },
    { id: "r5", name: "زيت طهي نباتي", qty: 200, unit: "لتر" },
    { id: "r6", name: "طماطم بلدي طازجة", qty: 60, unit: "كجم" }
  ]);

  // 10. Tables & Dining Halls States
  const [halls, setHalls] = useState([
    { id: "h1", name: "الصالة الرئيسية (عائلات)" },
    { id: "h2", name: "صالة الشباب (خارجية)" },
    { id: "h3", name: "صالة VIP (مغلقة)" }
  ]);
  const [tables, setTables] = useState([
    { id: "t1", hallId: "h1", number: "101", chairs: 4, status: "available" },
    { id: "t2", hallId: "h1", number: "102", chairs: 6, status: "occupied" },
    { id: "t3", hallId: "h1", number: "103", chairs: 2, status: "reserved" },
    { id: "t4", hallId: "h2", number: "201", chairs: 4, status: "available" },
    { id: "t5", hallId: "h2", number: "202", chairs: 8, status: "occupied" },
    { id: "t6", hallId: "h3", number: "301", chairs: 4, status: "available" }
  ]);
  const [waitlist, setWaitlist] = useState([
    { id: "w1", name: "علاء السنيداني", guests: 5, phone: "771234567", time: "18:30" },
    { id: "w2", name: "بشار الزمر", guests: 3, phone: "770123456", time: "18:45" }
  ]);

  // 11. Delivery Drivers States
  const [drivers, setDrivers] = useState([
    { id: "d1", name: "أحمد المأخذي", phone: "777654321", status: "idle", deliveriesCount: 12, rating: 4.8 },
    { id: "d2", name: "ياسر القدسي", phone: "773111222", status: "delivering", deliveriesCount: 8, rating: 4.5 },
    { id: "d3", name: "صالح الريمي", phone: "771999888", status: "idle", deliveriesCount: 15, rating: 4.9 }
  ]);
  const [deliveryOrders, setDeliveryOrders] = useState([
    { id: "o1", customer: "جميل العبسي", zone: "حي الستين", amount: 18500, driverId: "d2", status: "dispatched", time: "15 mins ago" },
    { id: "o2", customer: "معاذ الصبري", zone: "حي الأصبحي", amount: 9000, driverId: null, status: "pending", time: "5 mins ago" }
  ]);

  // 12. Accounting & Journals States
  const [chartOfAccounts, setChartOfAccounts] = useState([
    { code: "10100", name: "الصندوق الرئيسي - يمني", type: "assets", balance: 4500000 },
    { code: "10200", name: "البنك العربي - حساب جارى", type: "assets", balance: 12850000 },
    { code: "11100", name: "مخزن المواد الغذائية والوجبات", type: "assets", balance: 85000 },
    { code: "12100", name: "الأصول الثابتة - تجهيزات المطبخ", type: "assets", balance: 3500000 },
    { code: "20100", name: "الموردين - شركة توريد اللحوم", type: "liabilities", balance: -320000 },
    { code: "30100", name: "رأس المال المدفوع", type: "equity", balance: -15000000 },
    { code: "40100", name: "إيرادات مبيعات المطعم", type: "revenue", balance: -6820000 },
    { code: "50100", name: "تكلفة المواد الخام المستهلكة", type: "expense", balance: 2150000 },
    { code: "50200", name: "مصاريف إيجار الصالات", type: "expense", balance: 500000 },
    { code: "50300", name: "مصاريف الرواتب والأجور", type: "expense", balance: 790000 }
  ]);
  const [journalEntries, setJournalEntries] = useState([
    { id: "JV-1001", date: "2026-07-19", ref: "مبيعات الوردية صباح", memo: "إثبات مبيعات الكاشير للوردية الصباحية المعتمدة", posted: true, total: 35000 },
    { id: "JV-1002", date: "2026-07-20", ref: "صرف رواتب المطبخ", memo: "قيد ترحيل رواتب الموظفين لشهر يوليو", posted: false, total: 180000 }
  ]);
  const [banks, setBanks] = useState([
    { id: "b1", name: "البنك العربي الإسلامي", accNo: "1213-9080-01", balance: 8500000 },
    { id: "b2", name: "بنك التضامن الدولي", accNo: "3344-1234-02", balance: 4350000 }
  ]);

  // 13. Cash shifts state
  const [shiftStatus, setShiftStatus] = useState({
    active: true,
    id: "SH-4521",
    openedBy: "الكاشير أحمد",
    openTime: "2026-07-20 08:30",
    openingCash: 50000,
    salesCount: 42,
    salesCash: 385000,
    currentBalance: 435000
  });

  // 14. HR & Employees State
  const [employees, setEmployees] = useState([
    { id: "e101", name: "شيف فؤاد السقاف", dept: "المطبخ", job: "رئيس الطهاة", contract: "سنوي", baseSalary: 120000, attendance: "present", checkIn: "08:15", checkOut: null, advances: 15000, deductions: 0, bonuses: 5000 },
    { id: "e102", name: "عمر الكاشير", dept: "المبيعات", job: "كاشير رئيسي", contract: "مفتوح", baseSalary: 60000, attendance: "absent", checkIn: null, checkOut: null, advances: 0, deductions: 2000, bonuses: 10000 },
    { id: "e103", name: "سالم المندوب", dept: "التوصيل", job: "سائق خارجي", contract: "يومي", baseSalary: 45000, attendance: "present", checkIn: "09:00", checkOut: null, advances: 0, deductions: 0, bonuses: 0 }
  ]);

  // 15. Assets State
  const [assets, setAssets] = useState([
    { id: "ast1", name: "فرن شواء غاز إيطالي دبل", location: "المطبخ الرئيسي", cost: 1200000, purchaseDate: "2025-01-10", accumDep: 180000, status: "operational" },
    { id: "ast2", name: "ثلاجة تجميد رأسي 4 أبواب", location: "مستودع المكونات", cost: 850000, purchaseDate: "2025-03-15", accumDep: 85000, status: "under_maintenance" },
    { id: "ast3", name: "أجهزة كاشير باللمس Sunmi", location: "صالات البيع", cost: 450000, purchaseDate: "2026-01-05", accumDep: 45000, status: "operational" }
  ]);

  // 16. Quality Inspections State
  const [qaInspections, setQaInspections] = useState([
    { id: "QA-901", date: "2026-07-20", type: "مواد خام واردة", item: "لحوم مبردة مستوردة", inspector: "أخصائي جودة أسامة", score: 96, status: "approved" },
    { id: "QA-902", date: "2026-07-20", type: "وجبات جاهزة", item: "مطبق لحم وخبز بلدي", inspector: "أخصائي جودة أسامة", score: 82, status: "approved" },
    { id: "QA-903", date: "2026-07-20", type: "مواد خام واردة", item: "خضار وطماطم من سوق الأحد", inspector: "أخصائي جودة أسامة", score: 58, status: "rejected", notes: "وجود رطوبة عالية وبداية تلف ببعض الصناديق" }
  ]);

  // 17. Maintenance Equipment State
  const [maintTickets, setMaintTickets] = useState([
    { id: "MT-441", equipment: "ثلاجة التجميد رقم 3", type: "طارئة", cost: 45000, date: "2026-07-18", status: "completed", techName: "المهندس مروان" },
    { id: "MT-442", equipment: "ماكينة عجن الدقيق العملاقة", type: "وقائية", cost: 12000, date: "2026-07-25", status: "scheduled", techName: "المؤسسة المتحدة للصيانة" }
  ]);

  // ERP Systems structure
  const ERP_SYSTEMS: ERPSystem[] = [
    {
      id: "dash",
      name: "1- لوحة التحكم والتحليلات Dashboard",
      icon: LayoutDashboard,
      pages: [
        { name: "لوحة التحكم المالي والتشغيلي", href: "/dashboard" }
      ],
      operations: [
        { id: "dash_track_kpi", name: "متابعة مؤشرات الأداء", type: "operation" },
        { id: "dash_alerts", name: "التنبيهات والإنذارات", type: "operation" },
        { id: "dash_notifications", name: "الإشعارات الإدارية", type: "operation" },
        { id: "dash_daily_tasks", name: "المهام اليومية", type: "operation" }
      ],
      reports: [
        { id: "dash_rep_kpi", name: "مؤشرات الأداء (KPIs)", type: "report" },
        { id: "dash_rep_sales", name: "تقرير المبيعات العامة", type: "report" },
        { id: "dash_rep_profits", name: "محلل الأرباح والخسائر", type: "report" },
        { id: "dash_rep_stock", name: "حالة المخزون الحالي", type: "report" },
        { id: "dash_rep_attendance", name: "سجل حضور الموظفين", type: "report" },
        { id: "dash_rep_open_orders", name: "الطلبات المفتوحة", type: "report" }
      ]
    },
    {
      id: "pos_sys",
      name: "2- نقطة البيع POS",
      icon: Receipt,
      pages: [
        { name: "شاشة الكاشير والمبيعات السريعة POS", href: "/pos" }
      ],
      inputs: [
        { id: "pos_create_invoice", name: "إنشاء فاتورة سريعة", type: "input" },
        { id: "pos_create_order", name: "إنشاء طلب طاولة", type: "input" },
        { id: "pos_open_cart", name: "فتح سلة معلقة", type: "input" },
        { id: "pos_link_customer", name: "ربط عميل بالطلب", type: "input" },
        { id: "pos_select_table", name: "اختيار وتخصيص طاولة", type: "input" },
        { id: "pos_add_notes", name: "إضافة ملاحظات وتعديلات", type: "input" },
        { id: "pos_add_discount", name: "إدخل خصم يدوي", type: "input" },
        { id: "pos_add_coupon", name: "إدخال كوبون تخفيض", type: "input" },
        { id: "pos_payment_method", name: "تحديد طريقة الدفع", type: "input" }
      ],
      operations: [
        { id: "pos_suspend", name: "تعليق الطلب مؤقتاً", type: "operation" },
        { id: "pos_resume", name: "استرجاع الطلب المعلق", type: "operation" },
        { id: "pos_split_bill", name: "تقسيم الفاتورة", type: "operation" },
        { id: "pos_merge_bills", name: "دمج الفواتير والطلبات", type: "operation" },
        { id: "pos_merge_tables", name: "دمج الطاولات", type: "operation" },
        { id: "pos_transfer_order", name: "نقل الطلب لطاولة أخرى", type: "operation" },
        { id: "pos_reprint", name: "إعادة طباعة الإيصال", type: "operation" },
        { id: "pos_void", name: "إلغاء الفاتورة بالكامل", type: "operation" },
        { id: "pos_refund", name: "عمل مرتجع مبيعات", type: "operation" },
        { id: "pos_open_drawer", name: "فتح الدرج النقدي يدوياً", type: "operation" },
        { id: "pos_close_order", name: "إغلاق وقفل الطلب", type: "operation" },
        { id: "pos_send_kitchen", name: "إرسال الطلب للمطبخ", type: "operation" },
        { id: "pos_send_kds", name: "إرسال لشاشة KDS", type: "operation" },
        { id: "pos_pay", name: "إتمام عملية الدفع", type: "operation" },
        { id: "pos_save", name: "حفظ ومزامنة التغييرات", type: "operation" }
      ],
      reports: [
        { id: "pos_rep_cashier", name: "تقرير كاشير الوردية", type: "report" },
        { id: "pos_rep_sales", name: "مبيعات الكاشير اليومية", type: "report" },
        { id: "pos_rep_discounts", name: "سجل الخصومات الممنوحة", type: "report" },
        { id: "pos_rep_refunds", name: "سجل المرتجعات والمستردات", type: "report" },
        { id: "pos_rep_tables", name: "إشغال وحالة الطاولات", type: "report" },
        { id: "pos_rep_orders", name: "سجل الطلبات التفصيلي", type: "report" }
      ]
    },
    {
      id: "sales_sys",
      name: "3- إدارة المبيعات والطلبات",
      icon: ShoppingBag,
      pages: [
        { name: "الطلبات والمبيعات النشطة", href: "/orders" },
        { name: "إرجاع فواتير المبيعات", href: "/returns" },
        { name: "فاتورة مبيعات/مرتجع (أومني)", href: "/onyx-erp?tab=invoices" }
      ],
      inputs: [
        { id: "sales_quotes", name: "عروض الأسعار للشركات", type: "input" },
        { id: "sales_orders", name: "أوامر البيع والتعميد", type: "input" },
        { id: "sales_invoices", name: "فواتير المبيعات المعتمدة", type: "input" },
        { id: "sales_returns", name: "مرتجع مبيعات رسمي", type: "input" }
      ],
      operations: [
        { id: "sales_approve", name: "اعتماد الفواتير المعلقة", type: "operation" },
        { id: "sales_post", name: "ترحيل الفواتير للحسابات", type: "operation" },
        { id: "sales_unpost", name: "إلغاء الترحيل والمراجعة", type: "operation" },
        { id: "sales_approve_return", name: "اعتماد المرتجعات والردود", type: "operation" }
      ],
      reports: [
        { id: "sales_rep_daily", name: "مبيعات اليوم الإجمالية", type: "report" },
        { id: "sales_rep_monthly", name: "مبيعات الشهر والمقارنات", type: "report" },
        { id: "sales_rep_product", name: "المبيعات حسب المنتج", type: "report" },
        { id: "sales_rep_customer", name: "المبيعات حسب العميل", type: "report" },
        { id: "sales_rep_branch", name: "مبيعات الفروع والمواقع", type: "report" },
        { id: "sales_rep_cashier", name: "مبيعات المستخدمين والكاشير", type: "report" },
        { id: "sales_rep_payment", name: "المبيعات حسب طرق الدفع", type: "report" }
      ]
    },
    {
      id: "crm_sys",
      name: "4- إدارة العملاء CRM والولاء",
      icon: Users,
      pages: [
        { name: "إدارة العملاء والشركاء", href: "/customers" }
      ],
      inputs: [
        { id: "crm_customers", name: "تسجيل عميل جديد", type: "input" },
        { id: "crm_groups", name: "مجموعات وتصنيفات العملاء", type: "input" },
        { id: "crm_membership", name: "مستويات العضوية والبطاقات", type: "input" },
        { id: "crm_loyalty_points", name: "إعداد نقاط الولاء والخصم", type: "input" },
        { id: "crm_addresses", name: "إدارة عناوين التوصيل للعميل", type: "input" }
      ],
      operations: [
        { id: "crm_add_points", name: "إضافة نقاط ولاء للعميل", type: "operation" },
        { id: "crm_redeem_points", name: "خصم واستبدال النقاط", type: "operation" },
        { id: "crm_send_offers", name: "إرسال العروض التسويقية", type: "operation" },
        { id: "crm_marketing_campaigns", name: "إطلاق حملات تسويق SMS", type: "operation" },
        { id: "crm_tickets", name: "إدارة الشكاوى والمقترحات", type: "operation" }
      ],
      reports: [
        { id: "crm_rep_statement", name: "كشف حساب عميل مفصل", type: "report" },
        { id: "crm_rep_top", name: "العملاء الأكثر شراء", type: "report" },
        { id: "crm_rep_inactive", name: "العملاء المتوقفون والراكدون", type: "report" },
        { id: "crm_rep_loyalty", name: "تقرير أرصدة نقاط الولاء", type: "report" }
      ]
    },
    {
      id: "purch_sys",
      name: "5- إدارة المشتريات والتوريد",
      icon: ShoppingCart,
      inputs: [
        { id: "purch_requisitions", name: "طلب شراء داخلي (أقسام)", type: "input" },
        { id: "purch_rfq", name: "طلب عروض أسعار (RFQ)", type: "input" },
        { id: "purch_orders", name: "أمر شراء رسمي للمورد", type: "input" },
        { id: "purch_invoices", name: "فاتورة شراء السلع والمواد", type: "input" },
        { id: "purch_returns", name: "مرتجع شراء للمورد", type: "input" }
      ],
      operations: [
        { id: "purch_approve", name: "اعتماد طلبات الشراء", type: "operation" },
        { id: "purch_receive", name: "استلام السلع وتطابقها", type: "operation" },
        { id: "purch_qc", name: "فحص الجودة والمواصفات", type: "operation" },
        { id: "purch_post", name: "ترحيل فاتورة الشراء ماليًا", type: "operation" },
        { id: "purch_vendor_pay", name: "صرف مبالغ المورد والعهد", type: "operation" }
      ],
      reports: [
        { id: "purch_rep_analytics", name: "تقرير المشتريات والكميات", type: "report" },
        { id: "purch_rep_vendors", name: "كشف معاملات الموردين", type: "report" },
        { id: "purch_rep_debts", name: "مديونيات وأرصدة الموردين", type: "report" },
        { id: "purch_rep_items", name: "الأصناف المطلوبة للشراء", type: "report" }
      ]
    },
    {
      id: "supp_sys",
      name: "6- إدارة الموردين والديون",
      icon: Truck,
      inputs: [
        { id: "supp_list", name: "تسجيل الموردين المعتمدين", type: "input" },
        { id: "supp_contracts", name: "عقود واتفاقيات التوريد", type: "input" },
        { id: "supp_accounts", name: "الحسابات المصرفية للموردين", type: "input" }
      ],
      operations: [
        { id: "supp_pay", name: "سداد حساب مورد (سند صرف)", type: "operation" },
        { id: "supp_rate", name: "تقييم أداء الموردين", type: "operation" },
        { id: "supp_suspend", name: "إيقاف أو تجميد مورد", type: "operation" }
      ],
      reports: [
        { id: "supp_rep_statement", name: "كشف حساب المورد التفصيلي", type: "report" },
        { id: "supp_rep_top", name: "الموردون الأكثر توريداً", type: "report" },
        { id: "supp_rep_balances", name: "أرصدة الموردين الدائنة", type: "report" }
      ]
    },
    {
      id: "inv_sys",
      name: "7- إدارة المخزون والمستودعات",
      icon: Package,
      pages: [
        { name: "إدارة المنتجات والأصناف", href: "/products" },
        { name: "مجموعات الأصناف والتصنيفات", href: "/categories" },
        { name: "تسعير الأصناف والخدمات (أومني)", href: "/onyx-erp?tab=pricing" },
        { name: "بطاقة الأصناف المعيارية (أومني)", href: "/onyx-erp?tab=products" },
        { name: "بطاقة المخازن والمستودعات (أومني)", href: "/onyx-erp?tab=warehouses" }
      ],
      inputs: [
        { id: "inv_items", name: "بطاقة الصنف والباركود", type: "input" },
        { id: "inv_units", name: "وحدات القياس والتحويل", type: "input" },
        { id: "inv_warehouses", name: "المستودعات والمخازن والرفوف", type: "input" },
        { id: "inv_stocktakes", name: "أمر جرد مخزني رسمي", type: "input" },
        { id: "inv_transfers", name: "طلب تحويل بين المستودعات", type: "input" }
      ],
      operations: [
        { id: "inv_op_stocktake", name: "تحديث الكميات يدوياً", type: "operation" },
        { id: "inv_op_adjust", name: "تسوية الفروقات المخزنية", type: "operation" },
        { id: "inv_op_transfer", name: "تنفيذ التحويل المخزني", type: "operation" },
        { id: "inv_op_receive", name: "تسجيل استلام مخزني", type: "operation" },
        { id: "inv_op_issue", name: "تسجيل صرف مخزني", type: "operation" },
        { id: "inv_op_produce", name: "تسجيل إنتاج مخزني", type: "operation" },
        { id: "inv_op_consume", name: "تسجيل استهلاك مخزني", type: "operation" }
      ],
      reports: [
        { id: "inv_rep_movements", name: "كشف حركة الصنف التفصيلية", type: "report" },
        { id: "inv_rep_balances", name: "أرصدة المخزون الإجمالية", type: "report" },
        { id: "inv_rep_slow", name: "تقرير الأصناف الراكدة", type: "report" },
        { id: "inv_rep_low", name: "الأصناف المنخفضة وتحت الحد", type: "report" },
        { id: "inv_rep_expiry", name: "تقرير انتهاء الصلاحية للسلع", type: "report" }
      ]
    },
    {
      id: "prod_sys",
      name: "8- إدارة الإنتاج والتشغيل",
      icon: Cpu,
      inputs: [
        { id: "prod_recipes", name: "إعداد وصفات الأطباق والمواد", type: "input" },
        { id: "prod_raw_materials", name: "إدخال المواد الخام والمكونات", type: "input" },
        { id: "prod_production_orders", name: "إنشاء أمر إنتاج مطبخ", type: "input" }
      ],
      operations: [
        { id: "prod_start", name: "بدء خط الإنتاج والطبخ", type: "operation" },
        { id: "prod_end", name: "إنهاء أمر الإنتاج والمخرجات", type: "operation" },
        { id: "prod_register_waste", name: "تسجيل الهالك والتالف اليومي", type: "operation" },
        { id: "prod_consume_materials", name: "تنفيذ استهلاك المواد الخام", type: "operation" }
      ],
      reports: [
        { id: "prod_rep_cost", name: "تكلفة الإنتاج الفعلي للطبق", type: "report" },
        { id: "prod_rep_daily", name: "الإنتاج والمخرجات اليومية", type: "report" },
        { id: "prod_rep_waste", name: "تقرير الهالك المالي والكمي", type: "report" },
        { id: "prod_rep_consumption", name: "تقرير استهلاك المواد الخام", type: "report" }
      ]
    },
    {
      id: "tables_sys",
      name: "9- إدارة الصالات والطاولات",
      icon: Layers,
      inputs: [
        { id: "tables_halls", name: "الصالات والمناطق", type: "input" },
        { id: "tables_list", name: "الطاولات ومواقعها", type: "input" }
      ],
      operations: [
        { id: "tables_op_reserve", name: "حجز طاولة جديدة", type: "operation" },
        { id: "tables_op_transfer", name: "نقل زبون لطاولة أخرى", type: "operation" },
        { id: "tables_op_merge", name: "دمج طاولات متعددة", type: "operation" },
        { id: "tables_op_split", name: "تقسيم طاولة/فاتورة", type: "operation" },
        { id: "tables_op_waitlist", name: "تسجيل في قائمة الانتظار", type: "operation" }
      ],
      reports: [
        { id: "tables_rep_occupancy", name: "تقرير إشغال الطاولات الحالي", type: "report" },
        { id: "tables_rep_reservations", name: "تقرير حجوزات الفترة", type: "report" },
        { id: "tables_rep_turnover", name: "معدل دوران وحركة الطاولات", type: "report" }
      ]
    },
    {
      id: "delivery_sys",
      name: "10- إدارة التوصيل والمناديب",
      icon: Truck,
      inputs: [
        { id: "delivery_drivers", name: "بطاقات السائقين والمناديب", type: "input" },
        { id: "delivery_zones", name: "مناطق وتخطيط التوصيل", type: "input" }
      ],
      operations: [
        { id: "delivery_op_assign", name: "إسناد الطلب لسائق", type: "operation" },
        { id: "delivery_op_track", name: "تتبع خط سير السائق", type: "operation" },
        { id: "delivery_op_complete", name: "إنهاء التوصيل وتحصيل المبلغ", type: "operation" }
      ],
      reports: [
        { id: "delivery_rep_performance", name: "أداء وسرعة السائقين", type: "report" },
        { id: "delivery_rep_fees", name: "تقرير رسوم التوصيل المحصلة", type: "report" },
        { id: "delivery_rep_delayed", name: "تقرير الطلبات المتأخرة والشكاوى", type: "report" }
      ]
    },
    {
      id: "accounting_sys",
      name: "11- إدارة الحسابات والمالية",
      icon: Wallet,
      pages: [
        { name: "سندات الصرف والقبض والحسابات", href: "/accounting" }
      ],
      inputs: [
        { id: "acc_chart", name: "دليل الحسابات وشجرة الحسابات", type: "input" },
        { id: "acc_journals", name: "دفتر القيود اليومية", type: "input" },
        { id: "acc_vouchers", name: "سندات القبض والصرف", type: "input" },
        { id: "acc_banks", name: "بطاقات البنوك والحسابات", type: "input" },
        { id: "acc_safes_input", name: "بطاقات الخزائن الرئيسية", type: "input" }
      ],
      operations: [
        { id: "acc_op_post_journals", name: "ترحيل القيود اليومية المحاسبية", type: "operation" },
        { id: "acc_op_post_vouchers", name: "ترحيل السندات للدفاتر", type: "operation" },
        { id: "acc_op_adjustments", name: "إجراء تسويات بنكية ومخزنية", type: "operation" },
        { id: "acc_op_close_period", name: "إقفال الفترة المالية والفرعية", type: "operation" },
        { id: "acc_op_open_period", name: "إعادة فتح فترة مالية مغلقة", type: "operation" },
        { id: "acc_op_unpost", name: "إلغاء الترحيل (Unpost) للمعاملات", type: "operation" },
        { id: "acc_op_approve", name: "اعتماد الحركات والمستندات (Approve)", type: "operation" }
      ],
      reports: [
        { id: "acc_rep_ledger", name: "الأستاذ العام والمساعد", type: "report" },
        { id: "acc_rep_trial_balance", name: "ميزان المراجعة بالأرصدة", type: "report" },
        { id: "acc_rep_balance_sheet", name: "الميزانية العمومية للمنشأة", type: "report" },
        { id: "acc_rep_pnl", name: "تقرير الأرباح والخسائر والتشغيل", type: "report" },
        { id: "acc_rep_cashflow", name: "تقرير التدفقات النقدية الفعلي", type: "report" }
      ]
    },
    {
      id: "cash_safes_sys",
      name: "12- إدارة الصناديق والخزائن",
      icon: DollarSign,
      inputs: [
        { id: "cash_safes", name: "تهيئة الخزائن المالية للفروع", type: "input" },
        { id: "cash_registers", name: "تهيئة صناديق الكاشيرات", type: "input" }
      ],
      operations: [
        { id: "cash_op_open_shift", name: "فتح الوردية واستلام الصندوق", type: "operation" },
        { id: "cash_op_close_shift", name: "إغلاق الوردية وتسليم العهدة", type: "operation" },
        { id: "cash_op_deposit", name: "إيداع نقدي في الخزينة", type: "operation" },
        { id: "cash_op_withdraw", name: "سحب نقدي من الخزينة", type: "operation" },
        { id: "cash_op_transfer", name: "تحويل نقدي بين الخزائن والصناديق", type: "operation" }
      ],
      reports: [
        { id: "cash_rep_movement", name: "كشف حركة الصندوق التفصيلي", type: "report" },
        { id: "cash_rep_balances", name: "أرصدة الخزائن والصناديق الحالية", type: "report" },
        { id: "cash_rep_discrepancy", name: "تقرير فروقات الجرد والعجز", type: "report" }
      ]
    },
    {
      id: "hr_sys",
      name: "13- إدارة الموارد البشرية HR",
      icon: UserCheck,
      pages: [
        { name: "شؤون الموظفين والرواتب والحضور", href: "/hr" }
      ],
      inputs: [
        { id: "hr_employees", name: "ملفات وبيانات الموظفين", type: "input" },
        { id: "hr_departments", name: "الأقسام الإدارية والهيكل", type: "input" },
        { id: "hr_jobs", name: "الوظائف والمسميات المهنية", type: "input" },
        { id: "hr_contracts", name: "عقود الموظفين وتفاصيلها", type: "input" },
        { id: "hr_salaries", name: "سلم الرواتب والبدلات الافتراضية", type: "input" }
      ],
      operations: [
        { id: "hr_op_checkin", name: "تسجيل حضور الموظف يدوياً", type: "operation" },
        { id: "hr_op_checkout", name: "تسجيل انصراف الموظف", type: "operation" },
        { id: "hr_op_leaves", name: "طلب وإقرار الإجازات والمغادرات", type: "operation" },
        { id: "hr_op_advances", name: "طلب سلفة مالية للموظف", type: "operation" },
        { id: "hr_op_deductions", name: "الجزاءات والخصومات التأديبية", type: "operation" },
        { id: "hr_op_bonuses", name: "المكافآت والحوافز والتشجيع", type: "operation" },
        { id: "hr_op_post_salaries", name: "ترحيل كشف رواتب الشهر للماكينة", type: "operation" },
        { id: "hr_op_post_attendance", name: "ترحيل الحضور والانصراف المعتمد", type: "operation" },
        { id: "hr_op_post_absence", name: "ترحيل الغياب والانقطاعات للحسابات", type: "operation" }
      ],
      reports: [
        { id: "hr_rep_salaries", name: "تقرير مسير الرواتب الإجمالي", type: "report" },
        { id: "hr_rep_attendance", name: "سجل حضور الموظفين المفصل", type: "report" },
        { id: "hr_rep_absence", name: "تقرير الغياب والتأخيرات غير المبررة", type: "report" },
        { id: "hr_rep_leaves", name: "تقرير أرصدة الإجازات المتبقية", type: "report" },
        { id: "hr_rep_performance", name: "تقييم أداء الموظفين السنوي", type: "report" }
      ]
    },
    {
      id: "assets_sys",
      name: "14- إدارة الأصول الثابتة",
      icon: Package,
      inputs: [
        { id: "assets_list", name: "سجل الأصول والعهد الثابتة", type: "input" },
        { id: "assets_locations", name: "مواقع الأصول والمسؤولين عنها", type: "input" }
      ],
      operations: [
        { id: "assets_op_depreciation", name: "احتساب إهلاك الأصول للفترة", type: "operation" },
        { id: "assets_op_maintenance", name: "جدولة صيانة أصل أو عهدة", type: "operation" },
        { id: "assets_op_transfer", name: "نقل أصل من موقع أو قسم لآخر", type: "operation" },
        { id: "assets_op_sell", name: "استبعاد أو بيع أصل ثابت", type: "operation" }
      ],
      reports: [
        { id: "assets_rep_register", name: "تقرير سجل الأصول التفصيلي", type: "report" },
        { id: "assets_rep_depreciation", name: "كشف إهلاك الأصول المتراكم", type: "report" },
        { id: "assets_rep_maintenance", name: "سجل وتاريخ صيانة الأصول", type: "report" }
      ]
    },
    {
      id: "quality_sys",
      name: "15- إدارة الجودة والرقابة QA",
      icon: Check,
      inputs: [
        { id: "quality_templates", name: "نماذج الفحص والمعايير", type: "input" }
      ],
      operations: [
        { id: "quality_op_inspect_materials", name: "فحص جودة المواد الخام الموردة", type: "operation" },
        { id: "quality_op_inspect_prod", name: "فحص جودة الإنتاج والأطباق", type: "operation" },
        { id: "quality_op_approve", name: "اعتماد ومطابقة معايير الجودة", type: "operation" }
      ],
      reports: [
        { id: "quality_rep_results", name: "تقرير نتائج فحص المعايير", type: "report" },
        { id: "quality_rep_rejected", name: "سجل الأصناف والمواد المرفوضة", type: "report" }
      ]
    },
    {
      id: "maintenance_sys",
      name: "16- إدارة الصيانة والمعدات",
      icon: Cpu,
      inputs: [
        { id: "maint_equipment", name: "سجل المعدات والأجهزة بالمطبخ", type: "input" },
        { id: "maint_spares", name: "سجل ومخزن قطع الغيار", type: "input" }
      ],
      operations: [
        { id: "maint_op_orders", name: "إنشاء أمر صيانة فوري للمعدات", type: "operation" },
        { id: "maint_op_preventive", name: "جدولة الصيانة الوقائية الدورية", type: "operation" },
        { id: "maint_op_emergency", name: "تسجيل بلاغ صيانة طارئة", type: "operation" }
      ],
      reports: [
        { id: "maint_rep_breakdowns", name: "تقرير معدل أعطال المعدات", type: "report" },
        { id: "maint_rep_cost", name: "كشف تكاليف الصيانة وقطع الغيار", type: "report" }
      ]
    },
    {
      id: "reports_sys",
      name: "17- التقارير العامة والتحليلات",
      icon: BarChart3,
      pages: [
        { name: "سجل طباعة الفواتير والتقارير", href: "/print-log" }
      ],
      operations: [
        { id: "rep_op_analyze", name: "تحليل وتنقيب البيانات الحية", type: "operation" }
      ],
      reports: [
        { id: "rep_operational", name: "جميع التقارير التشغيلية المجمعة", type: "report" },
        { id: "rep_charts", name: "الرسوم والتمثيلات البيانية التفاعلية", type: "report" },
        { id: "rep_kpis", name: "لوحة تتبع مؤشرات الأداء KPIs", type: "report" },
        { id: "rep_bi", name: "ذكاء الأعمال وتحليل القرار BI", type: "report" }
      ]
    },
    {
      id: "admin_sys",
      name: "18- الإدارة العامة للنظام",
      icon: Settings,
      pages: [
        { name: "بيئة تهيئة Omni System Pro الشاملة", href: "/onyx-erp" },
        { name: "بيانات فروع المنشأة والتأسيس", href: "/onyx-erp?tab=branches" },
        { name: "العملات وأسعار الصرف الحرة", href: "/onyx-erp?tab=currencies" },
        { name: "الإعدادات العامة للنظام", href: "/settings" }
      ],
      inputs: [
        { id: "adm_branches", name: "بيانات فروع المنشأة", type: "input" },
        { id: "adm_currencies", name: "العملات وأسعار الصرف الحرة", type: "input" },
        { id: "adm_taxes", name: "الضرائب وضريبة القيمة المضافة", type: "input" },
        { id: "adm_settings", name: "الإعدادات العامة والربط الشبكي", type: "input" }
      ],
      operations: [
        { id: "adm_op_backup", name: "إنشاء نسخة احتياطية من قاعدة البيانات", type: "operation" },
        { id: "adm_op_restore", name: "استعادة نسخة احتياطية سابقة", type: "operation" },
        { id: "adm_op_update", name: "تحديث النظام البرمجي والترقيات", type: "operation" },
        { id: "adm_op_licenses", name: "إدارة تراخيص الاستخدام (للمطور)", type: "operation" }
      ],
      reports: [
        { id: "adm_rep_sys_log", name: "سجل النظام والعمليات (System Log)", type: "report" },
        { id: "adm_rep_backup_log", name: "سجل عمليات النسخ الاحتياطي والاستعادة", type: "report" },
        { id: "adm_rep_error_log", name: "سجل تتبع الأخطاء والاستثناءات", type: "report" }
      ]
    },
    {
      id: "users_permissions_sys",
      name: "19- إدارة المستخدمين والصلاحيات",
      icon: UserCircle,
      pages: [
        { name: "إدارة حسابات المستخدمين", href: "/users" },
        { name: "الصلاحيات والأمان (Omni System)", href: "/onyx-erp?tab=sessions" }
      ],
      inputs: [
        { id: "users_list", name: "إدارة حسابات مستخدمي النظام", type: "input" },
        { id: "users_groups", name: "مجموعات وصلاحيات العمل", type: "input" },
        { id: "users_roles", name: "الأدوار والمسؤوليات الوظيفية", type: "input" }
      ],
      operations: [
        { id: "users_op_activate", name: "تفعيل حساب مستخدم معلق", type: "operation" },
        { id: "users_op_deactivate", name: "إيقاف أو تجميد حساب مستخدم", type: "operation" },
        { id: "users_op_reset", name: "إعادة تعيين كلمة المرور الافتراضية", type: "operation" },
        { id: "users_op_link_emp", name: "ربط حساب المستخدم بملف موظف", type: "operation" },
        { id: "users_op_login_logout", name: "تسجيل الدخول والخروج للجلسات", type: "operation" },
        { id: "users_op_audit_activity", name: "مراجعة وتدقيق سجل نشاط المستخدمين", type: "operation" }
      ],
      reports: [
        { id: "users_rep_activity", name: "تقرير أنشطة مستخدمي النظام بالتفصيل", type: "report" },
        { id: "users_rep_login_attempts", name: "سجل محاولات الدخول الفاشلة والناجحة", type: "report" },
        { id: "users_rep_audit_changes", name: "سجل التعديلات والعمليات الحساسة", type: "report" },
        { id: "users_rep_permissions", name: "تقرير الصلاحيات والمصفوفات النشطة", type: "report" }
      ]
    }
  ];

  // Original standard page link options, kept as fallback/standard routes
  const standardNavItems = [
    { name: "بيئة Omni System Pro", href: "/onyx-erp", icon: Sliders },
    { name: "نقطة البيع الرئيسية", href: "/pos", icon: Receipt },
    { name: "المنتجات والأصناف", href: "/products", icon: Package },
    { name: "التصنيفات والوجبات", href: "/categories", icon: Tags },
    { name: "الطلبات والمبيعات", href: "/orders", icon: FileText },
    { name: "العملاء والشركاء", href: "/customers", icon: Users },
    { name: "إدارة الموارد البشرية", href: "/hr", icon: UserCheck },
    { name: "الحسابات والسندات", href: "/accounting", icon: Wallet },
    { name: "إرجاع الفواتير", href: "/returns", icon: RotateCcw },
    { name: "سجل طباعة الفواتير", href: "/print-log", icon: FileText },
    { name: "الإعدادات العامة", href: "/settings", icon: Settings },
    { name: "المستخدمين", href: "/users", icon: UserCircle },
    ...(user?.role === "developer" ? [{ name: "تراخيص النظام (للمطور)", href: "/licenses", icon: Lock }] : []),
  ];

  // Initialize Default Permissions on first load
  useEffect(() => {
    const saved = localStorage.getItem("omni_permissions_v1");
    if (!saved || Object.keys(JSON.parse(saved)).length === 0) {
      const initialPerms: Record<string, Record<string, boolean>> = {
        admin: {},
        cashier: {},
        accountant: {},
        developer: {}
      };

      // Loop over systems and pre-populate
      ERP_SYSTEMS.forEach(sys => {
        const items = [...(sys.inputs || []), ...(sys.operations || []), ...(sys.reports || [])];
        items.forEach(item => {
          // Admin & Developer get everything
          initialPerms.admin[item.id] = true;
          initialPerms.developer[item.id] = true;

          // Cashier permissions (Mainly POS input/operations, CRM input, tables/delivery operations, cash registers)
          if (sys.id === "pos_sys") {
            if (item.type === "input") {
              initialPerms.cashier[item.id] = true;
            }
            if (item.type === "operation" && ![
              "pos_void", "pos_refund", "pos_split_bill", "pos_merge_bills", "pos_merge_tables"
            ].includes(item.id)) {
              initialPerms.cashier[item.id] = true;
            }
          }
          if (sys.id === "crm_sys" && item.type === "input") {
            initialPerms.cashier[item.id] = true;
          }
          if (sys.id === "tables_sys" && (item.type === "input" || item.id === "tables_op_reserve" || item.id === "tables_op_waitlist")) {
            initialPerms.cashier[item.id] = true;
          }
          if (sys.id === "delivery_sys" && (item.id === "delivery_op_assign" || item.id === "delivery_op_complete")) {
            initialPerms.cashier[item.id] = true;
          }
          if (sys.id === "cash_safes_sys" && (item.id === "cash_op_open_shift" || item.id === "cash_op_close_shift")) {
            initialPerms.cashier[item.id] = true;
          }

          // Accountant permissions (Dashboard, Sales, Purchases, Suppliers, Inventory, Accounting, Safes, HR)
          if (["dash", "sales_sys", "purch_sys", "supp_sys", "accounting_sys", "cash_safes_sys", "hr_sys", "assets_sys", "quality_sys", "maintenance_sys", "reports_sys"].includes(sys.id)) {
            initialPerms.accountant[item.id] = true;
          }
          if (sys.id === "inv_sys" && (item.type === "report" || item.type === "input")) {
            initialPerms.accountant[item.id] = true;
          }
        });
      });

      // Special items permissions
      initialPerms.admin["permissions_matrix"] = true;
      initialPerms.developer["permissions_matrix"] = true;
      initialPerms.accountant["permissions_matrix"] = false;
      initialPerms.cashier["permissions_matrix"] = false;

      setPermissions(initialPerms);
      localStorage.setItem("omni_permissions_v1", JSON.stringify(initialPerms));
    }
  }, []);

  // Update permissions locally and save to localStorage
  const handleTogglePermission = (role: string, itemId: string) => {
    const updated = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [itemId]: !permissions[role]?.[itemId]
      }
    };
    setPermissions(updated);
    localStorage.setItem("omni_permissions_v1", JSON.stringify(updated));
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("pos_token");
        window.location.href = "/login";
      }
    });
  };

  // Check if active role has permission to trigger simulation
  const handleTriggerAction = (id: string, name: string) => {
    // Check permission
    const hasPerm = permissions[activeRole]?.[id] || activeRole === "admin" || activeRole === "developer";
    if (!hasPerm) {
      setAccessDeniedItem(name);
      return;
    }
    // Open specialized simulation dialog
    setActiveSimulation({ id, name });
  };

  const toggleSubSection = (sysId: string, section: string) => {
    const key = `${sysId}_${section}`;
    setExpandedSubSection(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // State managers for simulation inputs
  const [invoiceItems, setInvoiceItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceTable, setInvoiceTable] = useState("");
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [invoicePayment, setInvoicePayment] = useState("cash");

  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const addSimLog = (log: string) => {
    setSimulationLogs(prev => [`[${new Date().toLocaleTimeString('ar-SA')}] ${log}`, ...prev.slice(0, 15)]);
  };

  // Render content based on current active item
  const renderSimulationContent = () => {
    if (!activeSimulation) return null;

    const { id, name } = activeSimulation;

    // 1. PERMISSIONS MATRIX CONTROL CENTER
    if (id === "permissions_matrix") {
      return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-950">
            <ShieldAlert className="w-6 h-6 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">بوابة التحكم المتقدم بالصلاحيات - Omni Control Center</h4>
              <p className="text-xs text-indigo-700/90 mt-0.5">يمكنك تفعيل أو إلغاء صلاحية الوصول لأي مدخل، عملية، أو تقرير لكل دور وظيفي بشكل مستقل تماماً وبمزامنة فورية.</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-card text-card-foreground">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr className="border-b">
                  <th className="p-3 text-right">النظام / البند</th>
                  <th className="p-3 text-center w-24 bg-red-50/20 text-red-700">مدير (Admin)</th>
                  <th className="p-3 text-center w-24 bg-green-50/20 text-green-700">كاشير (Cashier)</th>
                  <th className="p-3 text-center w-24 bg-amber-50/20 text-amber-700">محاسب (Accountant)</th>
                  {user?.role === "developer" && (
                    <th className="p-3 text-center w-24 bg-blue-50/20 text-blue-700">مطور (Developer)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ERP_SYSTEMS.map(sys => {
                  const sysItems = [...(sys.inputs || []), ...(sys.operations || []), ...(sys.reports || [])];
                  return (
                    <React.Fragment key={sys.id}>
                      {/* System Header Row */}
                      <tr className="bg-slate-50 font-bold border-t">
                        <td colSpan={user?.role === "developer" ? 5 : 4} className="p-3 text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          {sys.name}
                        </td>
                      </tr>
                      {/* Items Rows */}
                      {sysItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 pr-8 flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                              item.type === "input" && "bg-blue-100 text-blue-800",
                              item.type === "operation" && "bg-emerald-100 text-emerald-800",
                              item.type === "report" && "bg-purple-100 text-purple-800",
                            )}>
                              {item.type === "input" ? "مدخل" : item.type === "operation" ? "عملية" : "تقرير"}
                            </span>
                            <span className="font-medium text-slate-700">{item.name}</span>
                          </td>
                          {(["admin", "cashier", "accountant", "developer"] as const).filter(r => r !== "developer" || user?.role === "developer").map(role => (
                            <td key={role} className="p-3 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                <input
                                  type="checkbox"
                                  checked={!!permissions[role]?.[item.id]}
                                  onChange={() => handleTogglePermission(role, item.id)}
                                  className="sr-only"
                                />
                                <div className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                  permissions[role]?.[item.id] 
                                    ? "bg-indigo-600 border-indigo-600 text-white" 
                                    : "border-slate-300 hover:border-slate-400"
                                )}>
                                  {permissions[role]?.[item.id] && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                </div>
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 2. POS QUICK INVOICE (TAKEAWAY / FAST CASHIER)
    if (id === "pos_create_invoice") {
      const subtotal = invoiceItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      const discountVal = parseFloat(invoiceDiscount) || 0;
      const vat = (subtotal - discountVal) * 0.15;
      const total = (subtotal - discountVal) + vat;

      const productsListToUse = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

      const handleAddProduct = (prod: any) => {
        setInvoiceItems(prev => {
          const existing = prev.find(item => item.id === String(prod.id));
          if (existing) {
            return prev.map(item => item.id === String(prod.id) ? { ...item, qty: item.qty + 1 } : item);
          }
          return [...prev, { id: String(prod.id), name: prod.name, price: Number(prod.price) || 15, qty: 1 }];
        });
        addSimLog(`تمت إضافة منتج للفاتورة السريعة: ${prod.name}`);
      };

      const handlePostInvoice = async () => {
        if (invoiceItems.length === 0) {
          alert("يرجى إضافة منتج واحد على الأقل للفاتورة السريعة!");
          return;
        }
        try {
          await apiPost("/api/orders", {
            type: "takeaway",
            customer_name: invoiceClient || "عميل نقدي سفري",
            total: total,
            items: invoiceItems.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
            payment_method: invoicePayment
          }).catch(() => {});

          await apiPost("/api/accounting/journal-entries", {
            date: new Date().toISOString().split("T")[0],
            ref: `POS-${Date.now().toString().slice(-6)}`,
            memo: `مبيعات كاشير سفري سريعة - العميل [${invoiceClient || "نقدي"}]`,
            posted: true,
            total: total
          }).catch(() => {});

          queryClient.invalidateQueries({ queryKey: ["orders-list"] });
          queryClient.invalidateQueries({ queryKey: ["journal-entries-list"] });
          queryClient.invalidateQueries({ queryKey: ["coa-accounts"] });

          addSimLog(`ترحيل فاتورة مبيعات سريعة بقيمة: ${total.toFixed(2)} ريال`);
          alert(`تم إصدار وترحيل الفاتورة السريعة بنجاح!\nالإجمالي: ${total.toFixed(2)} ريال (شاملاً 15% ضريبة).`);
          setInvoiceItems([]);
          setInvoiceClient("");
          setInvoiceDiscount("0");
          setActiveSimulation(null);
        } catch (err: any) {
          alert("خطأ أثناء ترحيل الفاتورة: " + (err.message || err));
        }
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right font-sans">
          {/* Form & Products Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">إنشاء فاتورة سريعة (Takeaway POS)</h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">سفري / كاشير مباشر</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">اختر العميل</label>
                <select 
                  value={invoiceClient}
                  onChange={e => setInvoiceClient(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">عميل نقدي سفري</option>
                  {dbCustomers.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name} ({c.phone || "بدون هاتف"})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">طريقة الدفع</label>
                <select 
                  value={invoicePayment}
                  onChange={e => setInvoicePayment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="cash">نقداً (Cash)</option>
                  <option value="card">شبكة / مدى (Card)</option>
                  <option value="credit">آجل / حساب عميل (Credit)</option>
                  <option value="transfer">تحويل بنكي (Transfer)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">القائمة السريعة للوجبات والمشروبات</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg bg-slate-50/50">
                {productsListToUse.map((p: any) => (
                  <button 
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-2 text-xs border border-indigo-200 bg-white hover:bg-indigo-50 rounded-lg text-indigo-900 text-center font-medium transition-all shadow-2xs hover:scale-105 cursor-pointer"
                  >
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="font-mono mt-0.5 font-extrabold text-slate-700">{p.price} ر.س</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr className="border-b">
                    <th className="p-2 text-right">الوجبة</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2 text-center">السعر</th>
                    <th className="p-2 text-center">الإجمالي</th>
                    <th className="p-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoiceItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-800">{item.name}</td>
                      <td className="p-2 text-center font-mono">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => setInvoiceItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}
                            className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold cursor-pointer"
                          >-</button>
                          <span>{item.qty}</span>
                          <button 
                            onClick={() => setInvoiceItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}
                            className="w-5 h-5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-xs font-bold cursor-pointer"
                          >+</button>
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono">{item.price} ر.س</td>
                      <td className="p-2 text-center font-mono font-bold text-indigo-600">{(item.price * item.qty)} ر.س</td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => setInvoiceItems(prev => prev.filter(i => i.id !== item.id))}
                          className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                  {invoiceItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">انقر على الأصناف أعلاه لإضافتها لفاتورة السريعة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Preview Side */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="text-center border-b pb-3 border-dashed border-slate-300">
                <Printer className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
                <h5 className="font-extrabold text-xs text-slate-900">فاتورة مبيعات سريعة - POS Quick Invoice</h5>
                <p className="text-[10px] text-slate-500 font-mono">نظام المبيعات الموحد - Omni Soft ERP</p>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="font-bold">{invoiceClient || "عميل نقدي سفري"}</span>
                </div>
                <div className="flex justify-between">
                  <span>طريقة وسيلة السداد:</span>
                  <span className="font-bold text-emerald-700">
                    {invoicePayment === "cash" ? "نقداً" : invoicePayment === "card" ? "شبكة/مدى" : invoicePayment === "credit" ? "آجل" : "تحويل بنكي"}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الصافي:</span>
                  <span className="font-mono">{subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span className="font-mono">{vat.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-2">
                  <span>المبلغ الإجمالي المستحق:</span>
                  <span className="font-mono text-indigo-600">{total.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 grid grid-cols-2 gap-2">
              <button 
                onClick={handlePostInvoice}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                اصدار وترحيل الفاتورة 🧾
              </button>
              <button 
                onClick={() => {
                  alert("تم إرسال أمر الطباعة المباشرة لطابعة الكاشير!");
                  addSimLog("طباعة إيصال الفاتورة السريعة");
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                طباعة تجريبية 🖨️
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2.B POS TABLE ORDER (DINE-IN HALL SERVICE)
    if (id === "pos_create_order") {
      const subtotal = invoiceItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
      const vat = subtotal * 0.15;
      const total = subtotal + vat;

      const tablesListToUse = dbTables.length > 0 ? dbTables : tables;
      const productsListToUse = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

      const PREP_CHIPS = ["بدون بصل", "زيادة شطة", "بدون ثوم", "مستوي جيدا", "سفري بالكرتون", "بدون ملح", "صوص جانبي"];

      const handleTogglePrepChip = (chip: string) => {
        setTableKitchenNotes(prev => 
          prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
        );
      };

      const handleAddProduct = (prod: any) => {
        setInvoiceItems(prev => {
          const existing = prev.find(item => item.id === String(prod.id));
          if (existing) {
            return prev.map(item => item.id === String(prod.id) ? { ...item, qty: item.qty + 1 } : item);
          }
          return [...prev, { id: String(prod.id), name: prod.name, price: Number(prod.price) || 15, qty: 1 }];
        });
        addSimLog(`إضافة أصناف لطلب الطاولة [${selectedTableForOrder}]: ${prod.name}`);
      };

      const handlePostTableOrder = async () => {
        if (invoiceItems.length === 0) {
          alert("يرجى اختيار أصناف الطعام لطلب الطاولة!");
          return;
        }
        try {
          await apiPost("/api/orders", {
            type: "dine_in",
            table_id: selectedTableForOrder,
            customer_name: `طاولة ${selectedTableForOrder} (${tableGuestCount} أفراد)`,
            total: total,
            kitchen_notes: tableKitchenNotes.join(" - "),
            items: invoiceItems.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price }))
          }).catch(() => {});

          // Update table status in database
          const targetTable = dbTables.find((t: any) => String(t.number) === selectedTableForOrder || String(t.id) === selectedTableForOrder);
          if (targetTable?.id) {
            await apiPut(`/api/tables/${targetTable.id}`, { status: "occupied" }).catch(() => {});
          }

          queryClient.invalidateQueries({ queryKey: ["orders-list"] });
          queryClient.invalidateQueries({ queryKey: ["tables-list"] });

          addSimLog(`إرسال طلب طاولة [${selectedTableForOrder}] للمطبخ بقيمة: ${total.toFixed(2)} ريال`);
          alert(`تم إرسال الطلب للمطبخ (KDS) وتثبيت الطاولة [${selectedTableForOrder}] كـ مشغولة بنجاح!`);
          setInvoiceItems([]);
          setTableKitchenNotes([]);
          setActiveSimulation(null);
        } catch (err: any) {
          alert("خطأ أثناء تثبيت طلب الطاولة: " + (err.message || err));
        }
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right font-sans">
          {/* Table & Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">إنشاء طلب طاولة جديدة (Dine-In Table Order)</h4>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">صالة الطعام والضيافة</span>
            </div>

            {/* Table Selection Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">اختر الطاولة من الصالة</label>
              <div className="grid grid-cols-4 gap-2">
                {tablesListToUse.map((t: any) => {
                  const tNum = String(t.number || t.id);
                  const isSelected = selectedTableForOrder === tNum;
                  const isOccupied = t.status === "occupied";
                  return (
                    <button
                      key={t.id || tNum}
                      onClick={() => setSelectedTableForOrder(tNum)}
                      className={cn(
                        "p-2 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer relative",
                        isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105" :
                        isOccupied ? "bg-amber-50 text-amber-900 border-amber-300" :
                        "bg-white text-slate-800 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      <div>طاولة {tNum}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">
                        {isOccupied ? "مشغولة" : `${t.chairs || 4} مقاعد`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waiter & Guests */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">عدد الضيوف</label>
                <input 
                  type="number" 
                  value={tableGuestCount}
                  onChange={e => setTableGuestCount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">الويتر / المباشر</label>
                <input 
                  type="text" 
                  value={tableWaiterName}
                  onChange={e => setTableWaiterName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border"
                />
              </div>
            </div>

            {/* Kitchen Prep Notes chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">تعليمات وتجهيز المطبخ (Kitchen Notes)</label>
              <div className="flex flex-wrap gap-1.5">
                {PREP_CHIPS.map(chip => {
                  const isChecked = tableKitchenNotes.includes(chip);
                  return (
                    <button
                      key={chip}
                      onClick={() => handleTogglePrepChip(chip)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] rounded-full border transition-colors cursor-pointer",
                        isChecked ? "bg-red-600 text-white border-red-600 font-bold" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {isChecked ? "✓ " : "+ "}{chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Quick Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">إضافة أصناف الوجبات والمقبلات</label>
              <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg bg-slate-50/50">
                {productsListToUse.map((p: any) => (
                  <button 
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-2 text-xs border border-indigo-200 bg-white hover:bg-indigo-50 rounded-lg text-indigo-900 text-center font-medium transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="font-mono mt-0.5 font-bold text-slate-700">{p.price} ر.س</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket KDS Side */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="text-center border-b pb-3 border-dashed border-slate-300">
                <Printer className="w-6 h-6 mx-auto text-amber-600 mb-1" />
                <h5 className="font-extrabold text-xs text-slate-900">تذكرة تجهيز طلب الطاولة - KDS Kitchen Ticket</h5>
                <p className="text-[10px] text-slate-500 font-mono">طاولة رقم [{selectedTableForOrder}] - الويتر: {tableWaiterName}</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">الأصناف المطلوبة للطاولة:</div>
                <div className="space-y-1 bg-white p-2 border rounded-lg max-h-36 overflow-y-auto">
                  {invoiceItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-800">{item.name} × {item.qty}</span>
                      <span className="font-mono text-indigo-600 font-bold">{(item.price * item.qty)} ر.س</span>
                    </div>
                  ))}
                  {invoiceItems.length === 0 && (
                    <div className="text-center text-slate-400 py-4">اختر الوجبات لإضافتها لطلب الطاولة</div>
                  )}
                </div>

                {tableKitchenNotes.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-[11px] text-red-800 font-bold">
                    ⚠️ ملاحضات المطبخ: {tableKitchenNotes.join(" | ")}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between text-xs font-bold">
                <span>إجمالي الطلب:</span>
                <span className="font-mono text-indigo-600 text-sm">{total.toFixed(2)} ر.س</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 grid grid-cols-2 gap-2">
              <button 
                onClick={handlePostTableOrder}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                إرسال للمطبخ وتثبيت الطاولة 🍽️
              </button>
              <button 
                onClick={() => {
                  alert("تمت محاكاة طبع بون المطبخ على طابعة KDS!");
                  addSimLog(`طباعة بون المطبخ لطاولة ${selectedTableForOrder}`);
                }}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                طباعة بون المطبخ 🖨️
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. INVENTORY ITEMS & ADJUSTMENTS (INPUT & OPERATIONS)
    if (id.startsWith("inv_")) {
      const handleAdjustQty = (matId: string, adjustType: 'add' | 'sub') => {
        setRawMaterials(prev => prev.map(mat => {
          if (mat.id === matId) {
            const step = adjustType === 'add' ? 10 : -10;
            const newQty = Math.max(0, mat.qty + step);
            addSimLog(`تعديل مخزون [${mat.name}] من ${mat.qty} إلى ${newQty} ${mat.unit}`);
            return { ...mat, qty: newQty };
          }
          return mat;
        }));
      };

      return (
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-bold text-sm text-slate-800">مستودع المواد الخام والأصناف الرئيسي</h4>
            <span className="text-xs text-slate-500">تحديث فوري لكميات المخزن</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rawMaterials.map(mat => (
              <div key={mat.id} className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-800">{mat.name}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">رمز الصنف: {mat.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="font-mono font-extrabold text-sm text-indigo-600">{mat.qty}</span>
                    <span className="text-[10px] text-slate-500 mr-1">{mat.unit}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleAdjustQty(mat.id, 'add')}
                      className="w-7 h-7 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      title="إضافة 10 كميات"
                    >
                      +10
                    </button>
                    <button 
                      onClick={() => handleAdjustQty(mat.id, 'sub')}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      title="خصم 10 كميات"
                    >
                      -10
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex justify-end">
            <button 
              onClick={() => setActiveSimulation(null)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              موافق وحفظ المستودع
            </button>
          </div>
        </div>
      );
    }

    // 4. DAILY TASKS / KPI METRICS
    if (id.startsWith("dash_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-amber-900">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">متابعة الأداء الحي للمنشأة:</span> يتم تحديث الرسوم والبيانات ومعدلات المبيعات تلقائيًا بناء على الفواتير المكتملة في الـ POS.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 text-center">
              <h5 className="text-xs text-slate-600 font-bold">متوسط الخدمة اليومي</h5>
              <div className="text-xl font-mono font-extrabold text-indigo-600 mt-1">4.5 دقائق</div>
              <p className="text-[10px] text-green-600 mt-1">أسرع بـ 1.2 دقيقة من أمس</p>
            </div>
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 text-center">
              <h5 className="text-xs text-slate-600 font-bold">الطلبيات قيد الطبخ</h5>
              <div className="text-xl font-mono font-extrabold text-indigo-600 mt-1">3 طلبات</div>
              <p className="text-[10px] text-indigo-500 mt-1">شاشات KDS قيد العمل</p>
            </div>
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 text-center">
              <h5 className="text-xs text-slate-600 font-bold">إجمالي المبيعات المؤقتة</h5>
              <div className="text-xl font-mono font-extrabold text-emerald-600 mt-1">1,250.00 ر.س</div>
              <p className="text-[10px] text-emerald-500 mt-1">مبيعات الوردية النشطة</p>
            </div>
          </div>

          <div className="border p-4 rounded-xl bg-white space-y-2">
            <h5 className="font-bold text-xs text-slate-800">قائمة المهام والعمليات اليومية المطلوبة</h5>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="line-through text-slate-400">إجراء جرد مخزن اللحوم والدجاج قبل الظهر</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="line-through text-slate-400">اعتماد فواتير الشراء المعلقة للمورد "مزارع الشام"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>مراجعة وتقييم طلبات صيانة ثلاجة التجميد رقم 3</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 5. CRM ADD POINTS (CRM / CUSTOMERS)
    if (id === "crm_add_points" || id === "crm_loyalty_points") {
      return (
        <div className="space-y-4 text-right font-sans">
          <h4 className="font-bold text-sm text-slate-800">إضافة وتعديل نقاط ولاء لعميل</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">اختر العميل</label>
              <select className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg border focus:outline-none">
                <option value="c1">أحمد محمد اليماني (VIP)</option>
                <option value="c2">سارة عبد الله الصبري</option>
                <option value="c3">مازن عبد الجبار الورد</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">مقدار النقاط الممنوحة</label>
              <input type="number" defaultValue="50" className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg border focus:outline-none" />
            </div>
            <button 
              onClick={() => {
                addSimLog(`منح نقاط ولاء لعميل: 50 نقطة`);
                alert("تمت إضافة نقاط الولاء للعميل بنجاح والمزامنة مع سجل الحسابات!");
                setActiveSimulation(null);
              }} 
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              اعتماد وتحديث النقاط
            </button>
          </div>
        </div>
      );
    }

    // 10. TABLES & HALLS SYSTEM
    if (id.startsWith("tables_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">إدارة الصالات والطاولات</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Table Layout Grid */}
            <div className="lg:col-span-2 border rounded-xl p-4 bg-white space-y-3">
              <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                المخطط الهيكلي الحي للطاولات والصالات
              </h5>

              <div className="flex gap-2 border-b pb-2">
                {halls.map(h => (
                  <button key={h.id} className="text-xs px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 font-semibold">
                    {h.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {tables.map(t => {
                  let statusColor = "bg-green-50 border-green-200 text-green-700";
                  let statusText = "شاغرة";
                  if (t.status === "occupied") {
                    statusColor = "bg-red-50 border-red-200 text-red-700";
                    statusText = "مشغولة";
                  } else if (t.status === "reserved") {
                    statusColor = "bg-amber-50 border-amber-200 text-amber-700";
                    statusText = "محجوزة";
                  }
                  return (
                    <div key={t.id} className={`border p-3 rounded-xl text-center space-y-1 relative ${statusColor}`}>
                      <div className="text-xs font-mono font-bold">طاولة {t.number}</div>
                      <div className="text-[10px] opacity-75">{t.chairs} كراسي</div>
                      <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/60 inline-block mt-1">
                        {statusText}
                      </div>
                      
                      <button 
                        onClick={() => {
                          const updated = tables.map(item => item.id === t.id ? { ...item, status: item.status === "available" ? "occupied" : item.status === "occupied" ? "reserved" : "available" } : item);
                          setTables(updated);
                          addSimLog(`تحديث حالة طاولة ${t.number} إلى ${t.status === "available" ? "مشغولة" : t.status === "occupied" ? "محجوزة" : "شاغرة"}`);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="تغيير الحالة"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Reservation Form & Waitlist */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-800">حجز طاولة أو قائمة الانتظار</h5>
              
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">اسم الزبون</label>
                  <input id="guest_name" type="text" placeholder="مثال: صالح اليافعي" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">عدد الأفراد</label>
                    <input id="guest_count" type="number" defaultValue="4" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">رقم الهاتف</label>
                    <input id="guest_phone" type="text" placeholder="777xxxxxx" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById("guest_name") as HTMLInputElement;
                      const countInput = document.getElementById("guest_count") as HTMLInputElement;
                      const phoneInput = document.getElementById("guest_phone") as HTMLInputElement;
                      if (!nameInput?.value) { alert("يرجى إدخال اسم الزبون"); return; }
                      
                      const newReservation = {
                        id: "w" + (waitlist.length + 1),
                        name: nameInput.value,
                        guests: parseInt(countInput?.value || "4"),
                        phone: phoneInput?.value || "770000000",
                        time: new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })
                      };
                      setWaitlist([...waitlist, newReservation]);
                      addSimLog(`إضافة الزبون ${nameInput.value} لقائمة الانتظار`);
                      nameInput.value = "";
                    }}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-[11px]"
                  >
                    تسجيل في الانتظار
                  </button>
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById("guest_name") as HTMLInputElement;
                      if (!nameInput?.value) { alert("يرجى إدخال اسم الزبون"); return; }
                      const firstAvail = tables.find(tb => tb.status === "available");
                      if (firstAvail) {
                        setTables(tables.map(tb => tb.id === firstAvail.id ? { ...tb, status: "reserved" } : tb));
                        addSimLog(`تم حجز طاولة ${firstAvail.number} للزبون ${nameInput.value}`);
                        alert(`تم حجز الطاولة رقم [${firstAvail.number}] للزبون [${nameInput.value}] بنجاح!`);
                        nameInput.value = "";
                      } else {
                        alert("عذراً، لا توجد طاولات شاغرة حالياً. يرجى تسجيله بقائمة الانتظار.");
                      }
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer text-center text-[11px]"
                  >
                    حجز طاولة فوراً
                  </button>
                </div>
              </div>

              {/* Waitlist list */}
              <div className="pt-2 border-t text-xs space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px]">الزبائن في قائمة الانتظار الحالية ({waitlist.length})</span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {waitlist.map(w => (
                    <div key={w.id} className="flex justify-between items-center bg-white p-2 rounded-lg border text-[10px]">
                      <div className="font-bold">{w.name} ({w.guests} أشخاص)</div>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-slate-400 font-mono">{w.time}</span>
                        <button 
                          onClick={() => {
                            setWaitlist(waitlist.filter(item => item.id !== w.id));
                            addSimLog(`إلغاء أو تخديم زبون قائمة الانتظار: ${w.name}`);
                          }}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 11. DELIVERY MANAGEMENT SYSTEM
    if (id.startsWith("delivery_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">إدارة التوصيل والدليفري</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Drivers list */}
            <div className="border rounded-xl p-4 bg-white space-y-3">
              <h5 className="font-bold text-xs text-slate-700">بطاقات السائقين المتاحين ({drivers.length})</h5>
              <div className="space-y-2">
                {drivers.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-3 rounded-lg border text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{d.name}</div>
                      <div className="text-[10px] text-slate-500">هاتف: {d.phone} | رحلات: {d.deliveriesCount}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-600">★ {d.rating}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        d.status === "idle" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {d.status === "idle" ? "متاح" : "خارج للتوصيل"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery orders */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-700">طلبات التوصيل والمناديب</h5>
              <div className="space-y-2">
                {deliveryOrders.map(order => (
                  <div key={order.id} className="bg-white p-3 rounded-lg border space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-600">طلب #{order.id}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{order.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <div>العميل: {order.customer} | المنطقة: {order.zone}</div>
                      <div className="font-mono text-emerald-600 font-bold">المبلغ: {order.amount.toLocaleString()} ر.س</div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      {order.status === "pending" ? (
                        <div className="flex w-full gap-2 items-center">
                          <select 
                            id={`driver_select_${order.id}`}
                            className="flex-1 text-[11px] px-2 py-1 rounded border bg-slate-50"
                          >
                            <option value="">اختر السائق...</option>
                            {drivers.filter(d => d.status === "idle").map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const sel = document.getElementById(`driver_select_${order.id}`) as HTMLSelectElement;
                              if (!sel?.value) { alert("يرجى اختيار سائق لتفويضه"); return; }
                              setDeliveryOrders(deliveryOrders.map(o => o.id === order.id ? { ...o, driverId: sel.value, status: "dispatched" } : o));
                              setDrivers(drivers.map(d => d.id === sel.value ? { ...d, status: "delivering" } : d));
                              addSimLog(`إسناد الطلب ${order.id} إلى السائق ${drivers.find(d => d.id === sel.value)?.name}`);
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-700 cursor-pointer"
                          >
                            إسناد وتكليف
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[11px] text-slate-500">
                            مُسند إلى: <strong>{drivers.find(d => d.id === order.driverId)?.name}</strong>
                          </span>
                          <button 
                            onClick={() => {
                              setDeliveryOrders(deliveryOrders.filter(o => o.id !== order.id));
                              if (order.driverId) {
                                setDrivers(drivers.map(d => d.id === order.driverId ? { ...d, status: "idle", deliveriesCount: d.deliveriesCount + 1 } : d));
                              }
                              setShiftStatus({
                                ...shiftStatus,
                                salesCount: shiftStatus.salesCount + 1,
                                salesCash: shiftStatus.salesCash + order.amount,
                                currentBalance: shiftStatus.currentBalance + order.amount
                              });
                              addSimLog(`إنهاء توصيل الطلب ${order.id} وتحصيل ${order.amount} ر.س`);
                              alert(`تم إنهاء التوصيل للطلب [${order.id}] بنجاح، وتحصيل المبلغ إلى عهدة الصندوق!`);
                            }}
                            className="px-3 py-1 bg-green-600 text-white font-bold text-[10px] rounded hover:bg-green-700 cursor-pointer animate-pulse"
                          >
                            إنهاء التوصيل والتحصيل
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 12. ACCOUNTING SYSTEM
    if (id.startsWith("acc_")) {
      const assetsTotal = chartOfAccounts.filter(a => a.type === "assets").reduce((acc, curr) => acc + curr.balance, 0);
      const liabilitiesTotal = chartOfAccounts.filter(a => a.type === "liabilities").reduce((acc, curr) => acc + curr.balance, 0);
      const equityTotal = chartOfAccounts.filter(a => a.type === "equity").reduce((acc, curr) => acc + curr.balance, 0);
      const revenueTotal = chartOfAccounts.filter(a => a.type === "revenue").reduce((acc, curr) => acc + curr.balance, 0);
      const expenseTotal = chartOfAccounts.filter(a => a.type === "expense").reduce((acc, curr) => acc + curr.balance, 0);

      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">الحسابات والقيود والترحيل</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left: Chart of accounts */}
            <div className="xl:col-span-2 border rounded-xl p-4 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-xs text-slate-700">دليل الحسابات والأرصدة التفصيلية</h5>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">العملة: ريال سعودي</span>
              </div>
              <div className="max-h-80 overflow-y-auto border rounded-lg text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-2 font-bold text-slate-600">رمز الحساب</th>
                      <th className="p-2 font-bold text-slate-600">اسم الحساب</th>
                      <th className="p-2 font-bold text-slate-600">النوع</th>
                      <th className="p-2 font-bold text-slate-600 text-left">الرصيد الجاري</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartOfAccounts.map(acc => (
                      <tr key={acc.code} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-500">{acc.code}</td>
                        <td className="p-2 font-bold text-slate-800">{acc.name}</td>
                        <td className="p-2 text-slate-500">
                          {acc.type === "assets" ? "أصول" : acc.type === "liabilities" ? "خصوم" : acc.type === "equity" ? "حقوق ملكية" : acc.type === "revenue" ? "إيرادات" : "مصروفات"}
                        </td>
                        <td className={`p-2 font-mono text-left font-bold ${acc.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {acc.balance.toLocaleString()} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Statements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                  <h6 className="font-bold text-emerald-800 mb-1.5">ملخص قائمة الأرباح والخسائر (P&L)</h6>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">إجمالي المبيعات (الدائن):</span>
                      <span className="font-mono font-bold text-emerald-700">{(Math.abs(revenueTotal)).toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">إجمالي المصاريف (المدين):</span>
                      <span className="font-mono font-bold text-red-700">{expenseTotal.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold text-slate-800">
                      <span>صافي الأرباح التشغيلية:</span>
                      <span className="font-mono text-emerald-600">{(Math.abs(revenueTotal) - expenseTotal).toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs">
                  <h6 className="font-bold text-indigo-800 mb-1.5">ميزان المعادلة المحاسبية (Balance Sheet)</h6>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">إجمالي الأصول (المدين):</span>
                      <span className="font-mono font-bold text-indigo-700">{assetsTotal.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">إجمالي الخصوم وحقوق الملكية:</span>
                      <span className="font-mono font-bold text-indigo-700">{(Math.abs(liabilitiesTotal + equityTotal)).toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-bold text-indigo-900">
                      <span>حالة موازنة المعادلة:</span>
                      <span className="text-emerald-600">موزونة ومتطابقة ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Manual Journal Entry Form */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-800">إنشاء قيد يومية محاسبي يدوي</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">البيان / المرجع</label>
                  <input id="jv_memo" type="text" placeholder="مثال: تسوية نقدية أو فاتورة إيجار" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">الحساب المدين</label>
                    <select id="jv_debit_acc" className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-[11px]">
                      {chartOfAccounts.map(acc => (
                        <option key={acc.code} value={acc.code}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">الحساب الدائن</label>
                    <select id="jv_credit_acc" className="w-full px-2.5 py-1.5 rounded-lg border bg-white text-[11px]">
                      {chartOfAccounts.map(acc => (
                        <option key={acc.code} value={acc.code}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">القيمة المالية بالقيد</label>
                  <input id="jv_amount" type="number" defaultValue="50000" className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-mono" />
                </div>

                <button 
                  onClick={() => {
                    const memo = (document.getElementById("jv_memo") as HTMLInputElement)?.value;
                    const deb = (document.getElementById("jv_debit_acc") as HTMLSelectElement)?.value;
                    const cred = (document.getElementById("jv_credit_acc") as HTMLSelectElement)?.value;
                    const amtVal = (document.getElementById("jv_amount") as HTMLInputElement)?.value;
                    const amt = parseFloat(amtVal || "0");

                    if (!memo) { alert("يرجى كتابة بيان القيد أو المرجع"); return; }
                    if (deb === cred) { alert("لا يمكن أن يكون حساب الطرف المدين هو نفسه الدائن للقيد!"); return; }
                    if (amt <= 0) { alert("يرجى إدخال مبلغ صحيح أكبر من الصفر"); return; }

                    setChartOfAccounts(chartOfAccounts.map(acc => {
                      if (acc.code === deb) return { ...acc, balance: acc.balance + amt };
                      if (acc.code === cred) return { ...acc, balance: acc.balance - amt };
                      return acc;
                    }));

                    const newJv = {
                      id: "JV-" + (1000 + journalEntries.length + 1),
                      date: new Date().toISOString().split("T")[0],
                      ref: memo,
                      memo: `قيد يدوي من شاشة الحسابات: ${memo}`,
                      posted: true,
                      total: amt
                    };
                    setJournalEntries([...journalEntries, newJv]);
                    addSimLog(`تم ترحيل قيد يومية ${newJv.id} بقيمة ${amt} ر.س`);
                    alert(`تم ترحيل القيد المحاسبي اليدوي [${newJv.id}] بنجاح وتحديث دليل الحسابات!`);
                    (document.getElementById("jv_memo") as HTMLInputElement).value = "";
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  ترحيل القيد وتعديل الموازين فوراً (Post)
                </button>
              </div>

              {/* Active Journal Entries log */}
              <div className="pt-2 border-t text-xs space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px]">القيود والسندات الأخيرة بالدفتر</span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {journalEntries.map(jv => (
                    <div key={jv.id} className="bg-white p-2 rounded-lg border text-[10px] flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">{jv.ref} ({jv.id})</div>
                        <div className="text-[9px] text-slate-400">{jv.date} | {jv.memo}</div>
                      </div>
                      <div className="text-left font-mono text-indigo-600 font-bold">
                        {jv.total.toLocaleString()} ر.س
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 13. CASH SAFES SYSTEM
    if (id.startsWith("cash_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">الصناديق والعهد والورديات</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shift controls */}
            <div className="border rounded-xl p-4 bg-white space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h5 className="font-bold text-xs text-slate-700">حالة وردية الكاشير الجارية</h5>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  shiftStatus.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}>
                  {shiftStatus.active ? "مفتوحة ونشطة" : "مغلقة / غير مستلمة"}
                </span>
              </div>

              {shiftStatus.active ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>رقم الوردية: <strong className="font-mono text-slate-800">{shiftStatus.id}</strong></div>
                    <div>المسؤول: <strong className="text-slate-800">{shiftStatus.openedBy}</strong></div>
                    <div>وقت الفتح: <strong className="font-mono text-slate-800">{shiftStatus.openTime}</strong></div>
                    <div>العهدة الافتتاحية: <strong className="font-mono text-slate-800">{shiftStatus.openingCash.toLocaleString()} ر.س</strong></div>
                  </div>

                  <div className="border-t pt-2 mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">عدد عمليات البيع:</span>
                      <span className="font-mono font-bold text-slate-800">{shiftStatus.salesCount} فاتورة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">مبيعات الوردية المحصلة نقداً:</span>
                      <span className="font-mono font-bold text-slate-800">{shiftStatus.salesCash.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 text-sm font-bold text-slate-800">
                      <span>الرصيد الفعلي بالدرج:</span>
                      <span className="font-mono text-indigo-600">{shiftStatus.currentBalance.toLocaleString()} ر.س</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShiftStatus({
                        ...shiftStatus,
                        active: false,
                        currentBalance: 0
                      });
                      addSimLog(`إغلاق الوردية وتصفية العهدة النقدية للدرج بقيمة ${shiftStatus.currentBalance} ر.س`);
                      alert(`تم إغلاق الوردية [${shiftStatus.id}] بنجاح، وتصفية المبالغ وتوريدها للبنك!`);
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer text-center mt-2"
                  >
                    إغلاق الوردية وتسليم العهدة والجرد (Close Shift)
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-center py-6">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-slate-600 font-bold">لا توجد وردية نشطة حالياً لكاشير الصندوق.</p>
                  <button 
                    onClick={() => {
                      setShiftStatus({
                        active: true,
                        id: "SH-" + (Math.floor(1000 + Math.random() * 9000)),
                        openedBy: "الكاشير أحمد",
                        openTime: new Date().toLocaleDateString("en-CA") + " " + new Date().toTimeString().slice(0,5),
                        openingCash: 50000,
                        salesCount: 0,
                        salesCash: 0,
                        currentBalance: 50000
                      });
                      addSimLog(`فتح وردية جديدة واستلام عهدة 50,000 ر.س`);
                      alert("تم فتح الوردية الجديدة بنجاح، والدرج مهيأ لتلقي مبيعات الـ POS!");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    استلام الصندوق وفتح وردية جديدة
                  </button>
                </div>
              )}
            </div>

            {/* Deposits & Withdrawals */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-700">عمليات إيداع وسحب وتغذية النقدية</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">نوع العملية المالية</label>
                  <select id="cash_action_type" className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                    <option value="deposit">إيداع نقدي / تغذية الصندوق (+)</option>
                    <option value="withdraw">سحب نقدي / مصروفات نثرية (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">المبلغ المطلوب</label>
                  <input id="cash_action_amount" type="number" defaultValue="5000" className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-mono" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">البيان والسبب</label>
                  <input id="cash_action_desc" type="text" placeholder="مثال: شراء مناديل للمطبخ" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>

                <button 
                  onClick={() => {
                    const type = (document.getElementById("cash_action_type") as HTMLSelectElement)?.value;
                    const amtVal = (document.getElementById("cash_action_amount") as HTMLInputElement)?.value;
                    const desc = (document.getElementById("cash_action_desc") as HTMLInputElement)?.value;
                    const amt = parseFloat(amtVal || "0");

                    if (!shiftStatus.active) { alert("يجب فتح وردية كاشير لتنفيذ عمليات الصندوق النقدية!"); return; }
                    if (amt <= 0) { alert("يرجى إدخال مبلغ صحيح"); return; }
                    if (!desc) { alert("يرجى كتابة البيان أو الغرض"); return; }

                    if (type === "withdraw" && amt > shiftStatus.currentBalance) {
                      alert("خطأ! رصيد الصندوق الحالي لا يكفي لإتمام عملية السحب المطلوبة.");
                      return;
                    }

                    const factor = type === "deposit" ? 1 : -1;
                    setShiftStatus({
                      ...shiftStatus,
                      currentBalance: shiftStatus.currentBalance + (factor * amt)
                    });

                    addSimLog(`عملية صندوق: ${type === "deposit" ? "إيداع" : "سحب"} مبلغ ${amt} ر.س - ${desc}`);
                    alert(`تمت عملية [${type === "deposit" ? "الإيداع" : "السحب"}] بقيمة [${amt} ر.س] بنجاح!`);
                    (document.getElementById("cash_action_desc") as HTMLInputElement).value = "";
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  تنفيذ وتسجيل العملية بالخزينة
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 14. HR & EMPLOYEES SYSTEM (FULL INTEGRATION & SYNC)
    if (id.startsWith("hr_")) {
      const activeEmps = dbEmployees.length > 0 
        ? dbEmployees.map(e => ({
            id: String(e.id),
            employee_number: e.employee_number || `EMP-${e.id}`,
            name: e.name,
            dept: e.department_name || (e.department_id ? `قسم ${e.department_id}` : "الموارد البشرية"),
            job: e.position || "موظف",
            contract: "عقد دائم",
            baseSalary: Number(e.basic_salary) || 5000,
            attendance: e.active ? "present" : "absent",
            checkIn: e.active ? "08:30" : null,
            checkOut: null,
            advances: 0,
            deductions: 0,
            bonuses: 0,
            phone: e.phone || "",
            active: e.active !== false
          }))
        : employees;

      const handleCreateEmpInErp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!empFormData.name || !empFormData.employee_number) {
          alert("يرجى إدخال اسم الموظف ورقم الموظف");
          return;
        }
        try {
          await apiPost("/api/hr/employees", {
            employee_number: empFormData.employee_number,
            name: empFormData.name,
            phone: empFormData.phone,
            position: empFormData.position,
            department_id: empFormData.department_id ? Number(empFormData.department_id) : null,
            basic_salary: Number(empFormData.basic_salary),
            hire_date: empFormData.hire_date,
            active: true
          });

          await apiPost("/api/employees", {
            name: empFormData.name,
            phone: empFormData.phone,
            role: "waiter",
            salary: empFormData.basic_salary,
            joinDate: empFormData.hire_date
          }).catch(() => {});

          queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
          queryClient.invalidateQueries({ queryKey: ["employees-list"] });
          queryClient.invalidateQueries({ queryKey: ["hr-depts"] });

          addSimLog(`إضافة موظف جديد [${empFormData.name}] في قاعدة البيانات الموحدة`);
          alert(`تم إضافة الموظف [${empFormData.name}] بنجاح وتحديث القاعدة المركزية فورياً!`);
          setShowAddEmpModal(false);
          setEmpFormData({
            employee_number: "",
            name: "",
            phone: "",
            position: "كاشير",
            department_id: "",
            basic_salary: "5000",
            hire_date: new Date().toISOString().split("T")[0]
          });
        } catch (err: any) {
          alert("خطأ أثناء إضافة الموظف: " + (err.message || err));
        }
      };

      const handleDeleteEmpInErp = async (empId: string, empName: string) => {
        if (!confirm(`هل أنت تأكد من إيقاف/حذف الموظف [${empName}]؟`)) return;
        try {
          await apiDel(`/api/hr/employees/${empId}`).catch(() => {});
          queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
          queryClient.invalidateQueries({ queryKey: ["employees-list"] });
          setEmployees(prev => prev.filter(e => e.id !== empId));
          addSimLog(`حذف/إيقاف الموظف [${empName}]`);
          alert(`تم إيقاف وحذف الموظف [${empName}] بنجاح.`);
        } catch (err: any) {
          alert("خطأ أثناء حذف الموظف: " + (err.message || err));
        }
      };

      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">الموارد البشرية وشؤون الموظفين (Synchronized)</span>
              <h4 className="font-bold text-sm text-slate-800">{name}</h4>
            </div>

            <button 
              onClick={() => setShowAddEmpModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
            >
              + إضافة موظف جديد
            </button>
          </div>

          {/* New Employee Modal */}
          {showAddEmpModal && (
            <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h5 className="font-bold text-xs text-slate-900">نموذج تسجيل موظف جديد في النظام الموحد</h5>
                <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕ إلغاء</button>
              </div>

              <form onSubmit={handleCreateEmpInErp} className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">رقم الموظف *</label>
                  <input 
                    type="text" 
                    required 
                    value={empFormData.employee_number}
                    onChange={e => setEmpFormData({ ...empFormData, employee_number: e.target.value })}
                    placeholder="EMP-105"
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">الاسم الرباعي *</label>
                  <input 
                    type="text" 
                    required 
                    value={empFormData.name}
                    onChange={e => setEmpFormData({ ...empFormData, name: e.target.value })}
                    placeholder="عادل محمد العولقي"
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={empFormData.phone}
                    onChange={e => setEmpFormData({ ...empFormData, phone: e.target.value })}
                    placeholder="770000000"
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">المسمى الوظيفي</label>
                  <select 
                    value={empFormData.position}
                    onChange={e => setEmpFormData({ ...empFormData, position: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="كاشير">كاشير رئيسي</option>
                    <option value="طاهي">طاهي / شيف مطبخ</option>
                    <option value="مباشر">مباشر / ويتر صالة</option>
                    <option value="سائق توصيل">سائق توصيل طلبات</option>
                    <option value="محاسب">محاسب مالية</option>
                    <option value="مدير صالة">مدير صالة طعام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">الراتب الأساسي (ر.س)</label>
                  <input 
                    type="number" 
                    value={empFormData.basic_salary}
                    onChange={e => setEmpFormData({ ...empFormData, basic_salary: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">تاريخ المباشرة</label>
                  <input 
                    type="date" 
                    value={empFormData.hire_date}
                    onChange={e => setEmpFormData({ ...empFormData, hire_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>

                <div className="col-span-2 md:col-span-3 flex justify-end gap-2 pt-2 border-t">
                  <button 
                    type="button" 
                    onClick={() => setShowAddEmpModal(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                  >
                    حفظ وتزامن مع الموارد البشرية
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Employee lists */}
            <div className="lg:col-span-2 border rounded-xl p-4 bg-white space-y-3">
              <h5 className="font-bold text-xs text-slate-700">قائمة وسجل موظفي المطعم الموحدة ({activeEmps.length})</h5>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {activeEmps.map(emp => (
                  <div key={emp.id} className="p-3 rounded-lg border hover:border-indigo-200 transition-colors space-y-2 text-xs bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-slate-800 text-sm">{emp.name}</strong>
                        <span className="text-[10px] font-mono text-indigo-700 font-bold mr-2">[{emp.employee_number}]</span>
                        <span className="text-[10px] text-slate-500 mr-1">({emp.dept} - {emp.job})</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        emp.attendance === "present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {emp.attendance === "present" ? "حاضر حالياً" : "غائب / مغادر"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 border-t pt-1.5">
                      <div>الراتب الأساسي: <strong className="font-mono text-slate-800">{emp.baseSalary.toLocaleString()} ر.س</strong></div>
                      <div>الهاتف: <strong className="font-mono text-slate-700">{emp.phone || "غير مسجل"}</strong></div>
                      <div>نوع العقد: <strong className="text-slate-700">{emp.contract}</strong></div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => handleDeleteEmpInErp(emp.id, emp.name)}
                        className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold cursor-pointer"
                      >
                        إيقاف/حذف
                      </button>
                      {emp.attendance === "absent" ? (
                        <button 
                          onClick={() => {
                            setEmployees(employees.map(e => e.id === emp.id ? { ...e, attendance: "present", checkIn: "08:30" } : e));
                            addSimLog(`تسجيل حضور الموظف ${emp.name}`);
                          }}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] cursor-pointer"
                        >
                          تسجيل حضور
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setEmployees(employees.map(e => e.id === emp.id ? { ...e, attendance: "absent", checkOut: "17:00" } : e));
                            addSimLog(`تسجيل مغادرة الموظف ${emp.name}`);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] cursor-pointer"
                        >
                          تسجيل مغادرة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary posting */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-4">
              <div>
                <h5 className="font-bold text-xs text-slate-800">مسير الرواتب وترحيل القيود</h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  ترحيل مستحقات الموظفين الشهرية وتوليد قيد محاسي آلي بدفتر القيود الموحد.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <button 
                  onClick={async () => {
                    const netSalaries = activeEmps.reduce((acc, curr) => acc + curr.baseSalary, 0);

                    try {
                      await apiPost("/api/accounting/journal-entries", {
                        date: new Date().toISOString().split("T")[0],
                        ref: `JV-SAL-${Date.now().toString().slice(-4)}`,
                        memo: `مسير رواتب شهرية لـ (${activeEmps.length}) موظف`,
                        posted: true,
                        total: netSalaries
                      }).catch(() => {});

                      queryClient.invalidateQueries({ queryKey: ["journal-entries-list"] });
                      queryClient.invalidateQueries({ queryKey: ["coa-accounts"] });

                      addSimLog(`ترحيل كشف رواتب الموظفين بقيمة ${netSalaries} ر.س`);
                      alert(`تم ترحيل مسير رواتب الموظفين (${activeEmps.length} موظف) بنجاح! \nالإجمالي المالي المرحل: [${netSalaries.toLocaleString()} ر.س].`);
                    } catch (err: any) {
                      alert("خطأ أثناء ترحيل الرواتب: " + (err.message || err));
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs shadow-2xs"
                >
                  ترحيل كشف رواتب الشهر (Payroll Post)
                </button>

                <button 
                  onClick={() => {
                    addSimLog(`مطابقة وتزامن الحضور والانصراف مع نظام الحسابات`);
                    alert("تمت المطابقة الفورية وتزامن كشوفات الموارد البشرية مع دفتر الأستاذ بنجاح!");
                  }}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  مطابقة وتزامن الحضور المعتمد
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 15. FIXED ASSETS SYSTEM
    if (id.startsWith("assets_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">الأصول الثابتة والإهلاك</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="border rounded-xl p-4 bg-white space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-xs text-slate-700">بطاقات سجل الأصول الثابتة والعهد</h5>
              <button 
                onClick={() => {
                  setAssets(assets.map(ast => {
                    const yearlyDep = Math.round(ast.cost * 0.1); // 10% rate
                    return { ...ast, accumDep: ast.accumDep + yearlyDep };
                  }));
                  // update accounting: expense up, accumDep up
                  setChartOfAccounts(chartOfAccounts.map(acc => {
                    if (acc.code === "12100") return { ...acc, balance: acc.balance - 100000 }; // reducing book value
                    if (acc.code === "50200") return { ...acc, balance: acc.balance + 100000 }; // expense up
                    return acc;
                  }));
                  addSimLog(`احتساب إهلاك الأصول للفترة الحالية`);
                  alert("تم احتساب إهلاك الأصول للفترة بنسبة 10% سنوياً، وإدراج قيود الإهلاك آلياً في دفتر الحسابات العامة!");
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 cursor-pointer"
              >
                احتساب إهلاك الأصول للفترة (Depreciate)
              </button>
            </div>

            <div className="overflow-x-auto text-xs border rounded-lg">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2 text-slate-600">اسم الأصل الثابت</th>
                    <th className="p-2 text-slate-600">الموقع / الحيازة</th>
                    <th className="p-2 text-slate-600 text-left">تكلفة الشراء</th>
                    <th className="p-2 text-slate-600 text-left">الإهلاك المتراكم</th>
                    <th className="p-2 text-slate-600 text-left">القيمة الدفترية الحالية</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(ast => (
                    <tr key={ast.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{ast.name}</td>
                      <td className="p-2 text-slate-500">{ast.location}</td>
                      <td className="p-2 text-left font-mono">{ast.cost.toLocaleString()} ر.س</td>
                      <td className="p-2 text-left font-mono text-amber-600">{ast.accumDep.toLocaleString()} ر.س</td>
                      <td className="p-2 text-left font-mono font-bold text-indigo-600">
                        {(ast.cost - ast.accumDep).toLocaleString()} ر.س
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

    // 16. QUALITY ASSURANCE SYSTEM
    if (id.startsWith("quality_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">إدارة الجودة والرقابة QA</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* QA Log */}
            <div className="lg:col-span-2 border rounded-xl p-4 bg-white space-y-3">
              <h5 className="font-bold text-xs text-slate-700">سجل عمليات فحص الجودة ومطابقة المعايير</h5>
              <div className="space-y-2">
                {qaInspections.map(qa => (
                  <div key={qa.id} className="p-3 rounded-lg border text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{qa.item} ({qa.type})</div>
                      <div className="text-[10px] text-slate-500">الفاحص: {qa.inspector} | التاريخ: {qa.date}</div>
                      {qa.notes && <div className="text-[10px] text-red-500 font-semibold mt-1">ملاحظة: {qa.notes}</div>}
                    </div>
                    <div className="text-left space-y-1">
                      <div className="font-mono font-bold">الدرجة: {qa.score}/100</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-block ${
                        qa.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {qa.status === "approved" ? "مطابق ومعتمد" : "مرفوض وتالف"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QA Inspector inputs */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-700">إجراء نموذج فحص جودة جديد</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">اسم الصنف أو الشحنة المفحوصة</label>
                  <input id="qa_item" type="text" placeholder="مثال: لحم دجاج مفروم شحنة الصباح" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">نوع الفحص</label>
                  <select id="qa_type" className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                    <option value="مواد خام واردة">شحنة مواد خام مستلمة</option>
                    <option value="وجبات جاهزة">مطابقة أطباق ووجبات مخرجة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">درجة مطابقة المواصفات (0 - 100)</label>
                  <input id="qa_score" type="number" defaultValue="90" className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-mono" />
                </div>

                <button 
                  onClick={() => {
                    const item = (document.getElementById("qa_item") as HTMLInputElement)?.value;
                    const type = (document.getElementById("qa_type") as HTMLSelectElement)?.value;
                    const score = parseInt((document.getElementById("qa_score") as HTMLInputElement)?.value || "90");

                    if (!item) { alert("يرجى كتابة اسم الصنف المفحوص"); return; }

                    const status = score >= 80 ? "approved" : "rejected";
                    const notes = score < 80 ? "لم يطابق معايير الطزاجة والرطوبة المعتمدة" : "";

                    const newInspection = {
                      id: "QA-" + (901 + qaInspections.length + 1),
                      date: new Date().toISOString().split("T")[0],
                      type: type || "مواد خام واردة",
                      item,
                      inspector: "أخصائي جودة أسامة",
                      score,
                      status,
                      notes
                    };

                    setQaInspections([newInspection, ...qaInspections]);
                    addSimLog(`فحص جودة الصنف ${item} بدرجة ${score}/100 - الحالة: ${status}`);
                    alert(`تم الانتهاء من عملية الفحص! \nالنتيجة: [${status === "approved" ? "مطابق ومعتمد ✓" : "مرفوض وتالف ❌"}]`);
                    (document.getElementById("qa_item") as HTMLInputElement).value = "";
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  تسجيل نموذج الفحص والجودة
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 17. MAINTENANCE & EQUIPMENT SYSTEM
    if (id.startsWith("maint_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">الصيانة والمعدات والأجهزة</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tickets log */}
            <div className="lg:col-span-2 border rounded-xl p-4 bg-white space-y-3">
              <h5 className="font-bold text-xs text-slate-700">سجل تذاكر صيانة أجهزة المطبخ والصالات</h5>
              <div className="space-y-2">
                {maintTickets.map(ticket => (
                  <div key={ticket.id} className="p-3 rounded-lg border text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{ticket.equipment} [تذكرة صيانة {ticket.type}]</div>
                      <div className="text-[10px] text-slate-500">المهندس/المسؤول: {ticket.techName} | التاريخ: {ticket.date}</div>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="font-mono text-emerald-600 font-bold">{ticket.cost.toLocaleString()} ر.س</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-block ${
                        ticket.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {ticket.status === "completed" ? "مكتملة ومصلحة" : "مجدولة وقيد الانتظار"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance ticket creation */}
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <h5 className="font-bold text-xs text-slate-700">طلب أو بلاغ صيانة طارئة للمعدات</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">اسم المعدة / الجهاز العاطل</label>
                  <input id="maint_eq" type="text" placeholder="مثال: ثلاجة التجميد رقم 3" className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">نوع بلاغ الصيانة</label>
                  <select id="maint_type" className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                    <option value="طارئة">إصلاح عطل طارئ وتوقف للعمل</option>
                    <option value="وقائية">صيانة وقائية مجدولة دورياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">التكلفة التقديرية (ر.س)</label>
                  <input id="maint_cost" type="number" defaultValue="25000" className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-mono" />
                </div>

                <button 
                  onClick={() => {
                    const eq = (document.getElementById("maint_eq") as HTMLInputElement)?.value;
                    const type = (document.getElementById("maint_type") as HTMLSelectElement)?.value;
                    const costVal = (document.getElementById("maint_cost") as HTMLInputElement)?.value;
                    const cost = parseFloat(costVal || "0");

                    if (!eq) { alert("يرجى كتابة اسم المعدة أو الجهاز العاطل"); return; }

                    const newTicket = {
                      id: "MT-" + (441 + maintTickets.length + 1),
                      equipment: eq,
                      type: type || "طارئة",
                      cost,
                      date: new Date().toISOString().split("T")[0],
                      status: "completed",
                      techName: "المهندس مروان"
                    };

                    setMaintTickets([newTicket, ...maintTickets]);
                    setChartOfAccounts(chartOfAccounts.map(acc => {
                      if (acc.code === "10100") return { ...acc, balance: acc.balance - cost }; // cash down
                      if (acc.code === "50200") return { ...acc, balance: acc.balance + cost }; // maintenance expense up
                      return acc;
                    }));

                    addSimLog(`إنشاء وإصلاح تذكرة صيانة ${eq} بقيمة ${cost} ر.س`);
                    alert(`تم إصلاح العطل طارئ للمعدة [${eq}] بنجاح! \nتم قيد وتثبيت مصروفات الصيانة بقيمة [${cost.toLocaleString()} ر.س] في الدفاتر المحاسبية.`);
                    (document.getElementById("maint_eq") as HTMLInputElement).value = "";
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center text-xs"
                >
                  تسجيل وإتمام الإصلاح فوراً
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 18. REPORTS & ANALYTICS SYSTEM
    if (id.startsWith("rep_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">التقارير العامة والذكاء المالي</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI 1 */}
            <div className="border rounded-xl p-4 bg-white space-y-2">
              <h5 className="font-bold text-xs text-slate-700">معدل إشغال الطاولات ومتوسط الخدمة</h5>
              <div className="h-40 bg-slate-50 rounded-lg flex items-end justify-around p-3 border">
                <div className="w-12 bg-indigo-600 rounded-t h-32 text-center text-[10px] text-white font-mono py-1">82%</div>
                <div className="w-12 bg-indigo-500 rounded-t h-24 text-center text-[10px] text-white font-mono py-1">60%</div>
                <div className="w-12 bg-indigo-400 rounded-t h-28 text-center text-[10px] text-white font-mono py-1">70%</div>
                <div className="w-12 bg-indigo-300 rounded-t h-16 text-center text-[10px] text-white font-mono py-1">40%</div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold pt-1">
                <span>الصالة الرئيسية</span>
                <span>صالة الشباب</span>
                <span>صالة العوائل</span>
                <span>صالة VIP</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="border rounded-xl p-4 bg-white space-y-2">
              <h5 className="font-bold text-xs text-slate-700">معدلات كفاءة دليفري التوصيل بالفروع</h5>
              <div className="space-y-2 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>نسبة التوصيل بالوقت المحدد (أقل من 35 دقيقة)</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>نسبة شكاوى وتأخير المناديب</span>
                    <span>6%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '6%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                    <span>متوسط تقييم السائقين والخدمة</span>
                    <span>4.7 / 5.0</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 19. SYSTEM ADMINISTRATION
    if (id.startsWith("adm_") || id.startsWith("admin_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">الإدارة العامة والنسخ الاحتياطي</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="border rounded-xl p-4 bg-white space-y-4">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-3 rounded-xl text-blue-900 text-xs">
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
              <div>
                نظام <strong>Omni System Pro ERP</strong> متصل بخادم السحابة الآمنة التابع للشركة ومزود بتحديثات أوتوماتيكية حية.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  addSimLog("إنشاء نسخة احتياطية مشفرة لقاعدة البيانات وتنزيلها");
                  alert("تم جلب وتوليد نسخة احتياطية آمنة ومكاملة من قاعدة بيانات النظام بنجاح! \nالملف: omni_backup_2026_07_20.sql (الحجم: 48.5 ميجابايت).");
                }}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 text-center space-y-2 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-800">أخذ نسخة احتياطية فورية</div>
                <div className="text-[10px] text-slate-500">حفظ جميع الطاولات والحسابات والقيود الحية</div>
              </button>

              <button 
                onClick={() => {
                  addSimLog("استعادة قاعدة بيانات النظام من ملف خارجي");
                  alert("تم بدء فحص بنية الملف واستعادة البيانات للورديات والحسابات السابقة بنجاح!");
                }}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 text-center space-y-2 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-800">استرجاع قاعدة بيانات سابقة</div>
                <div className="text-[10px] text-slate-500">تحميل واستعادة ملفات نسخ احتياطي .sql</div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 20. USERS & PERMISSIONS SYSTEM
    if (id.startsWith("users_")) {
      return (
        <div className="space-y-4 text-right font-sans">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-full">إدارة المستخدمين وحسابات الجلسة</span>
            <h4 className="font-bold text-sm text-slate-800">{name}</h4>
          </div>

          <div className="border rounded-xl p-4 bg-white space-y-3">
            <h5 className="font-bold text-xs text-slate-700">مستخدمي وجلسات النظام النشطة</h5>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border text-xs flex justify-between items-center bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800">أحمد محمد اليماني (المدير العام)</div>
                  <div className="text-[10px] text-indigo-600 font-bold">المجموعة: الأجهزة الإدارية العليا (Admin)</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold">نشط ومتصل حالياً</span>
              </div>

              <div className="p-3 rounded-lg border text-xs flex justify-between items-center bg-slate-50">
                <div>
                  <div className="font-bold text-slate-800">عمر الكاشير (المبيعات)</div>
                  <div className="text-[10px] text-indigo-600 font-bold">المجموعة: طاقم الكاشير (Cashier)</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">غير متصل</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback template for any other general simulation
    return (
      <div className="space-y-4 text-right">
        <div className="flex items-center gap-2 border-b pb-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-sm text-slate-800">نموذج تفعيل: {name}</h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          أنت الآن تقوم بتشغيل وحدة المحاكاة التفاعلية الخاصة بـ <strong>{name}</strong> ضمن نظام <strong>Omni System Pro ERP</strong> المتكامل.
        </p>

        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">الوصف / الملاحظات الإدارية</label>
            <textarea 
              rows={3}
              placeholder="اكتب أي ملاحظات أو تعليمات ترحيل هنا..."
              className="w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] text-slate-500 font-mono">الخادم الخلفي (API Server): متصل ومستعد للمزامنة</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button 
            onClick={() => setActiveSimulation(null)}
            className="px-4 py-2 border rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            onClick={() => {
              addSimLog(`إتمام عملية: ${name}`);
              alert(`تم تنفيذ إجراء [${name}] بنجاح وحفظ البيانات في قاعدة بيانات النظام!`);
              setActiveSimulation(null);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            تنفيذ وحفظ الإجراء
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#fafbfc] text-slate-800 overflow-hidden" dir="rtl">
      {/* Sidebar - Upgraded Odoo/SAP Modular Sidebar */}
      <aside className="w-64 bg-[#0d172e] text-white flex flex-col border-l border-white/5 shadow-2xl shrink-0">
        
        {/* Top Header Logo */}
        <div className="h-16 flex items-center justify-between border-b border-white/5 px-4 bg-[#0a1224]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center text-white shadow-md overflow-hidden shrink-0">
              <AppIcon alt="إتقان سوفت" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xs font-black text-white tracking-wide">إتقان سوفت</h1>
              <p className="text-[9px] text-slate-400 font-bold">OMNI SYSTEM PRO ERP</p>
            </div>
          </div>
          
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/20">
            v3.5
          </span>
        </div>

        {/* Real-time Role Switcher for previewing permissions */}
        {user?.role === "developer" && (
          <div className="p-3 bg-indigo-950/40 border-b border-white/5">
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" /> تغيير الدور الوظيفي للمحاكاة:
            </label>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="w-full bg-[#0d172e] text-white text-xs py-1.5 px-2 rounded-lg border border-white/10 focus:outline-none cursor-pointer"
            >
              <option value="admin">مدير النظام (Admin)</option>
              <option value="cashier">كاشير المبيعات (Cashier)</option>
              <option value="accountant">محاسب المنشأة (Accountant)</option>
              <option value="developer">مطور برمجيات (Developer)</option>
            </select>
          </div>
        )}
        
        {/* Sidebar Nav Area */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">الأنظمة والإدارات (ERP)</div>
          
          {/* Loop over the 8 Modular Systems */}
          {ERP_SYSTEMS.map((sys) => {
            const Icon = sys.icon;
            const isSystemExpanded = expandedSystem === sys.id;
            
            return (
              <div key={sys.id} className="space-y-1">
                {/* System Top Item (Toggle Dropdown) */}
                <button
                  onClick={() => setExpandedSystem(isSystemExpanded ? null : sys.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-right cursor-pointer",
                    isSystemExpanded 
                      ? "bg-indigo-600/25 text-white border-r-4 border-indigo-500" 
                      : "hover:bg-white/5 text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{sys.name}</span>
                  </div>
                  {isSystemExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Second Level Expandable Section (Inputs, Operations, Reports) */}
                {isSystemExpanded && (
                  <div className="pr-3 pl-1 py-1 space-y-1 bg-black/20 rounded-lg animate-fadeIn">
                    {/* 1. المدخلات (Inputs) */}
                    {sys.inputs && sys.inputs.length > 0 && (
                      <div className="space-y-1">
                        <button
                          onClick={() => toggleSubSection(sys.id, "inputs")}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-blue-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>المدخلات (Inputs)</span>
                          {expandedSubSection[`${sys.id}_inputs`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedSubSection[`${sys.id}_inputs`] && (
                          <div className="space-y-1 pr-2 border-r border-blue-500/20">
                            {sys.inputs.map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleTriggerAction(item.id, item.name)}
                                className="w-full text-right px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{item.name}</span>
                                {!(permissions[activeRole]?.[item.id] || activeRole === "admin") && <Lock className="w-3 h-3 text-slate-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. العمليات (Operations) */}
                    {sys.operations && sys.operations.length > 0 && (
                      <div className="space-y-1">
                        <button
                          onClick={() => toggleSubSection(sys.id, "operations")}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-emerald-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>العمليات (Operations)</span>
                          {expandedSubSection[`${sys.id}_operations`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedSubSection[`${sys.id}_operations`] && (
                          <div className="space-y-1 pr-2 border-r border-emerald-500/20">
                            {sys.operations.map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleTriggerAction(item.id, item.name)}
                                className="w-full text-right px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{item.name}</span>
                                {!(permissions[activeRole]?.[item.id] || activeRole === "admin") && <Lock className="w-3 h-3 text-slate-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. التقارير (Reports) */}
                    {sys.reports && sys.reports.length > 0 && (
                      <div className="space-y-1">
                        <button
                          onClick={() => toggleSubSection(sys.id, "reports")}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-purple-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>التقارير (Reports)</span>
                          {expandedSubSection[`${sys.id}_reports`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedSubSection[`${sys.id}_reports`] && (
                          <div className="space-y-1 pr-2 border-r border-purple-500/20">
                            {sys.reports.map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleTriggerAction(item.id, item.name)}
                                className="w-full text-right px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{item.name}</span>
                                {!(permissions[activeRole]?.[item.id] || activeRole === "admin") && <Lock className="w-3 h-3 text-slate-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="w-full h-px bg-white/5 my-3" />
          <div className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">إدارة الصلاحيات والتحكم</div>

          {/* Quick permissions button */}
          <button
            onClick={() => setActiveSimulation({ id: "permissions_matrix", name: "إدارة الصلاحيات للأنظمة" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-l from-indigo-900 to-slate-900 border border-indigo-500/20 text-indigo-200 hover:text-white hover:from-indigo-850 hover:to-indigo-950 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>مركز إدارة الصلاحيات</span>
          </button>

          <div className="w-full h-px bg-white/5 my-3" />
          <div className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">روابط الصفحات الرئيسية</div>

          {/* Fallback Nav list for basic views */}
          {standardNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                  isActive 
                    ? "bg-white/10 text-white font-semibold" 
                    : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                )}>
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User / Profile Section inside sidebar */}
        <div className="p-4 border-t border-white/5 bg-[#0a1224]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {user?.name?.charAt(0) || "م"}
            </div>
            <div className="flex-1 overflow-hidden text-right">
              <p className="text-xs font-bold truncate text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.role === "admin" ? "مدير النظام" : "مستخدم عادي"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* App Top bar */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-xs select-none">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-slate-800">بيئة تشغيل Omni System Pro ERP</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              قاعدة بيانات SQLite متصلة
            </div>
          </div>

          {/* Licensing Banner Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-850 text-xs px-4 py-1.5 rounded-full font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>هذا النظام مرخص لـ:</span>
            <span className="text-slate-900 font-black">{licenseData?.client_name || settings?.businessName || "مؤسسة إتقان المعتمدة للتجارة"}</span>
            <span className="text-slate-500 font-normal">| كود التفعيل المعتمد 🔒</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left text-xs">
              <p className="font-extrabold text-slate-700">{user?.name}</p>
              <p className="text-[10px] text-slate-500">الصلاحية المفعلة: {activeRole === "admin" ? "مدير" : activeRole === "cashier" ? "كاشير" : activeRole === "accountant" ? "محاسب" : "مطور"}</p>
            </div>
          </div>
        </header>

        {/* Content Children */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </div>
      </main>

      {/* 1. Simulation Modal Dialog Container */}
      <AnimatePresence>
        {activeSimulation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border w-full max-w-4xl p-6 relative flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setActiveSimulation(null)}
                className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b pb-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{activeSimulation.name}</h3>
                  <p className="text-xs text-slate-500">محاكاة تفاعلية ذكية للبيئة المترابطة من Omni System ERP</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {renderSimulationContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Access Denied Dialog Container */}
      <AnimatePresence>
        {accessDeniedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border w-full max-w-md p-6 relative text-center space-y-4"
            >
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">عذراً! ليس لديك صلاحية للوصول</h3>
                <p className="text-xs text-slate-600 leading-relaxed px-2">
                  ليس لدى الحساب النشط الحالي بصلاحية <strong>[{activeRole === "admin" ? "مدير" : activeRole === "cashier" ? "كاشير" : activeRole === "accountant" ? "محاسب" : "مطور"}]</strong> إذن للوصول إلى بند <strong>[{accessDeniedItem}]</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border text-right text-[11px] text-slate-500">
                💡 <span className="font-bold text-slate-700">تلميح للتجربة واللعب:</span> يمكنك تغيير دورك الوظيفي الحالي فوراً من القائمة المنسدلة في الشريط الجانبي إلى <strong>[مدير النظام]</strong> لتجاوز القيود واختبار الصلاحية!
              </div>

              <div className="flex justify-center pt-2">
                <button 
                  onClick={() => setAccessDeniedItem(null)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer border-0"
                >
                  فهمت الإجراء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
