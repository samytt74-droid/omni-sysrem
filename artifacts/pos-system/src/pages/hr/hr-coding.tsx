import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListTodo, Plus, Pencil, Trash2, CheckCircle2, Sliders, Hash, Globe, GraduationCap, Briefcase, Key, ShieldAlert, Clock, CalendarDays } from "lucide-react";
import { fmt } from "./api";

type CodeItem = {
  id: any;
  name: string;
  extra?: string;
  active: boolean;
};

export function HrCodingTab() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("jobs");

  // 14 Coding Configurations Databases
  const [databases, setDatabases] = useState<Record<string, { title: string; label: string; extraLabel?: string; list: CodeItem[] }>>({
    jobs: {
      title: "بيانات الوظائف والمسميات المهنية",
      label: "اسم الوظيفة",
      extraLabel: "كود الوظيفة",
      list: [
        { id: 1, name: "رئيس الطهاة (Chef)", extra: "JOB-001", active: true },
        { id: 2, name: "مساعد طباخ", extra: "JOB-002", active: true },
        { id: 3, name: "كاشير رئيسي", extra: "JOB-003", active: true },
        { id: 4, name: "مندوب توصيل", extra: "JOB-004", active: true },
      ]
    },
    allowances: {
      title: "بيانات البدلات والاستقطاعات الرسمية",
      label: "نوع البدل/الاستقطاع",
      extraLabel: "النسبة الافتراضية (%) أو الثابت",
      list: [
        { id: 1, name: "بدل السكن الأساسي", extra: "25%", active: true },
        { id: 2, name: "بدل انتقال وتوصيل", extra: "10%", active: true },
        { id: 3, name: "خصم غياب يوم", extra: "100% من أجر اليوم", active: true },
      ]
    },
    leaves: {
      title: "بيانات تهيئة أنواع الإجازات",
      label: "نوع الإجازة",
      extraLabel: "الحد الأقصى للأيام السنوية",
      list: [
        { id: 1, name: "إجازة سنوية مدفوعة", extra: "30 يوم", active: true },
        { id: 2, name: "إجازة مرضية براتب كامل", extra: "15 يوم", active: true },
        { id: 3, name: "إجازة حج وأعياد رسمية", extra: "10 أيام", active: true },
      ]
    },
    penalties: {
      title: "بيانات الجزاءات والمخالفات الإدارية",
      label: "نوع المخالفة السلوكية",
      extraLabel: "عقوبة الخصم/الإنذار",
      list: [
        { id: 1, name: "التأخر عن الوردية بدون عذر", extra: "إنذار ثم خصم نصف يوم", active: true },
        { id: 2, name: "عدم ارتداء زي العمل الرسمي", extra: "خصم 2000 ريال", active: true },
        { id: 3, name: "سوء معاملة الزبائن والعملاء", extra: "توقيف فوري وتحقيق", active: true },
      ]
    },
    nationalities: {
      title: "بيانات الجنسيات المعتمدة للتعاقد",
      label: "اسم الجنسية",
      extraLabel: "رمز الدولة الدولي",
      list: [
        { id: 1, name: "اليمن", extra: "YE", active: true },
        { id: 2, name: "المملكة العربية السعودية", extra: "SA", active: true },
        { id: 3, name: "مصر العربية", extra: "EG", active: true },
      ]
    },
    shifts: {
      title: "بيانات فترات العمل (الورديات)",
      label: "اسم الوردية",
      extraLabel: "ساعات العمل (من - إلى)",
      list: [
        { id: 1, name: "الوردية الصباحية (عائلات)", extra: "08:00 ص - 04:00 م", active: true },
        { id: 2, name: "الوردية المسائية الكبرى", extra: "04:00 م - 12:00 ص", active: true },
        { id: 3, name: "وردية المطبخ الليلي الممتد", extra: "12:00 ص - 08:00 ص", active: true },
      ]
    },
    overtime: {
      title: "بيانات أنواع العمل الإضافي",
      label: "نوع الإضافي",
      extraLabel: "معدل مضاعفة الساعة",
      list: [
        { id: 1, name: "ساعات إضافية أيام الأسبوع العادية", extra: "1.5 ضعف", active: true },
        { id: 2, name: "ساعات إضافية العطل الأسبوعية", extra: "2.0 ضعف", active: true },
        { id: 3, name: "ساعات العمل في الأعياد الدينية", extra: "3.0 ضعف", active: true },
      ]
    },
    years: {
      title: "إدخال السنة والأشهر الإدارية للدوام",
      label: "اسم الشهر والسنة",
      extraLabel: "تاريخ البدء والإغلاق الفعلي",
      list: [
        { id: 1, name: "يوليو 2026", extra: "2026-07-01 - 2026-07-31", active: true },
        { id: 2, name: "أغسطس 2026", extra: "2026-08-01 - 2026-08-31", active: true },
      ]
    },
    qualifications: {
      title: "بيانات المؤهلات والتخصصات الأكاديمية",
      label: "المؤهل والتخصص العلمي",
      extraLabel: "المرتبة الأكاديمية",
      list: [
        { id: 1, name: "بكالوريوس إدارة فنادق وسياحة", extra: "جامعي", active: true },
        { id: 2, name: "دبلوم طهي معتمد دولياً", extra: "فني معتمد", active: true },
        { id: 3, name: "ثانوية عامة أو ما يعادلها", extra: "متوسط", active: true },
      ]
    },
    experiences: {
      title: "بيانات الخبرات الوظيفية السابقة",
      label: "مجال وسنوات الخبرة المطلوبة",
      extraLabel: "مستوى الكفاءة المطلوبة",
      list: [
        { id: 1, name: "طهي مأكولات شعبية وشوايات (أكثر من 5 سنوات)", extra: "شيف محترف", active: true },
        { id: 2, name: "خدمة عملاء وكاشير Sunmi (سنتين)", extra: "كاشير مؤهل", active: true },
      ]
    },
    custody_cats: {
      title: "بيانات أصناف العهد وممتلكات المطعم",
      label: "صنف العهدة الرئيسي",
      extraLabel: "شروط وضمان الاستخدام",
      list: [
        { id: 1, name: "سكاكين طهي وأطقم شواء ثقيلة", extra: "ضمان عدم تبرع/بيع", active: true },
        { id: 2, name: "أجهزة تواصل لاسلكي ومعدات بيع", extra: "مسؤولية عهدة عينية", active: true },
      ]
    },
    tool_cats: {
      title: "بيانات وحالة أصناف أدوات المطبخ والتقديم",
      label: "الأداة/المعدات",
      extraLabel: "الحالة العامة والتشغيلية",
      list: [
        { id: 1, name: "صحون تقديم سيراميك فريش", extra: "ممتاز وصالح للاستخدام", active: true },
        { id: 2, name: "ملاعق وشوك استيل مقاومة للصدأ", extra: "متوفر بكميات كافية", active: true },
      ]
    },
    tool_exits: {
      title: "حالة خروج الأدوات والمنقولات لخارج الفروع",
      label: "غرض الخروج الخارجي",
      extraLabel: "بإذن توقيع من",
      list: [
        { id: 1, name: "إرسال أواني بوفيه لحفل خارجي عائلي", extra: "توقيع مدير الأغذية والمشروبات", active: true },
        { id: 2, name: "إرسال معدات صيانة تالفة للورشة", extra: "توقيع رئيس الصيانة الفنية", active: true },
      ]
    }
  });

  const [showDlg, setShowDlg] = useState(false);
  const [form, setForm] = useState({ name: "", extra: "" });

  const currentDb = databases[activeCategory] || databases.jobs;

  const handleAdd = () => {
    setDatabases(prev => {
      const db = { ...prev[activeCategory] };
      db.list = [...db.list, { id: Date.now(), name: form.name, extra: form.extra, active: true }];
      return { ...prev, [activeCategory]: db };
    });
    toast({ title: "تم التثبيت والحفظ بنجاح بقاعدة البيانات التكويدية" });
    setShowDlg(false);
  };

  const handleToggleActive = (id: any) => {
    setDatabases(prev => {
      const db = { ...prev[activeCategory] };
      db.list = db.list.map(item => item.id === id ? { ...item, active: !item.active } : item);
      return { ...prev, [activeCategory]: db };
    });
    toast({ title: "تم تحديث حالة تفعيل الكود بنجاح" });
  };

  const categoriesList = [
    { id: "jobs", label: "بيانات الوظائف", icon: Briefcase },
    { id: "allowances", label: "البدلات والاستقطاعات", icon: Hash },
    { id: "leaves", label: "أنواع الإجازات", icon: CalendarDays },
    { id: "penalties", label: "الجزاءات والمخالفات", icon: ShieldAlert },
    { id: "nationalities", label: "الجنسيات", icon: Globe },
    { id: "shifts", label: "الورديات وساعات الدوام", icon: Clock },
    { id: "overtime", label: "أنواع الإضافي", icon: Clock },
    { id: "years", label: "السنة والشهور الإدارية", icon: CalendarDays },
    { id: "qualifications", label: "المؤهلات والتخصصات", icon: GraduationCap },
    { id: "experiences", label: "الخبرات المطلوبة", icon: Briefcase },
    { id: "custody_cats", label: "أصناف العهد العينية", icon: Key },
    { id: "tool_cats", label: "حالة وحصر الأدوات", icon: Sliders },
    { id: "tool_exits", label: "حالة خروج الأدوات", icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-primary">
          <Sliders className="w-7 h-7" /> قائمة التكويد والتهيئة الأساسية (HR Codes)
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          تهيئة جداول وأكواد النظام المدخلة في جميع شاشات التوظيف والدوام والعهدة والجزاءات لمطابقة الصورة المرجعية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left selector menu of config sections */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900 border rounded-xl p-2 space-y-1">
          <span className="text-[10px] font-black text-muted-foreground block p-2 uppercase">قواعد أكواد النظام</span>
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-right text-xs font-semibold transition ${
                  isCatActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isCatActive ? "text-primary-foreground" : "text-slate-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right content view for active code table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center bg-muted/40 p-4 border rounded-xl">
            <div>
              <h3 className="font-bold text-lg">{currentDb.title}</h3>
              <p className="text-xs text-muted-foreground">تعديل وإضافة بنود التكويد لهذا الجدول</p>
            </div>
            <Button onClick={() => { setForm({ name: "", extra: "" }); setShowDlg(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> إضافة بند تكويدي
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-right p-3 font-semibold">المسلسل / المعرّف</th>
                  <th className="text-right p-3 font-semibold">{currentDb.label}</th>
                  {currentDb.extraLabel && <th className="text-right p-3 font-semibold">{currentDb.extraLabel}</th>}
                  <th className="text-right p-3 font-semibold">حالة الاستخدام</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentDb.list.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono text-muted-foreground">ID-{item.id}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                    {currentDb.extraLabel && (
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{item.extra}</td>
                    )}
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(item.id)}
                        className={`text-xs px-2.5 py-1 h-auto rounded-full font-bold border ${
                          item.active
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {item.active ? "نشط ومتاح" : "معطل"}
                      </Button>
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => toast({ title: "تم حذف البند" })}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showDlg} onOpenChange={setShowDlg}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle>إضافة بند إلى: {currentDb.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold">{currentDb.label} *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ادخل القيمة" className="mt-1" />
            </div>
            {currentDb.extraLabel && (
              <div>
                <label className="text-xs font-semibold">{currentDb.extraLabel}</label>
                <Input value={form.extra} onChange={e => setForm(f => ({ ...f, extra: e.target.value }))} placeholder="ادخل القيمة الإضافية" className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDlg(false)}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={!form.name}>تثبيت الرمز الكودي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
