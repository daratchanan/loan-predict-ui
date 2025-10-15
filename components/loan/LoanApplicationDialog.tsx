// ============================================
// components/loan/LoanApplicationDialog.tsx
// Dialog สำหรับกรอกใบสมัครสินเชื่อ
// ============================================

"use client";

import { useState } from "react";
import { api, LoanApplication } from "@/lib/api";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const factorMap: Array<{
  match: RegExp;
  label: string;
  pos: string;
  neg: string;
}> = [
  // กฎ/นโยบายเครดิตภายใน
  {
    match: /credit_policy/i,
    label: 'ผ่านนโยบายเครดิตภายใน',
    pos: 'ผ่านเกณฑ์ภายใน → ลดความเสี่ยง',
    neg: 'ไม่ผ่าน/มีข้อยกเว้น → เพิ่มความเสี่ยง',
  },
  // ดอกเบี้ย
  {
    match: /int_rate/i,
    label: 'อัตราดอกเบี้ย',
    pos: 'อัตราดอกเบี้ยอยู่ในช่วงปลอดภัย',
    neg: 'อัตราดอกเบี้ยสูงกว่าช่วงปลอดภัย',
  },
  // ค่างวด
  {
    match: /installment/i,
    label: 'ค่างวด/เดือน',
    pos: 'ค่างวดเหมาะสม → ลดความเสี่ยง',
    neg: 'ค่างวดสูงเกินศักยภาพ → เพิ่มความเสี่ยง',
  },
  // รายได้ต่อปี (log)
  {
    match: /log_annual_inc/i,
    label: 'รายได้ต่อปี (ปรับสเกล)',
    pos: 'รายได้ต่อปีสูง → ลดความเสี่ยง',
    neg: 'รายได้ต่อปีต่ำ → เพิ่มความเสี่ยง',
  },
  // DTI
  {
    match: /dti/i,
    label: 'สัดส่วนหนี้ต่อรายได้ (DTI)',
    pos: 'DTI ต่ำ → จัดการหนี้ดี',
    neg: 'DTI สูง → ความสามารถชำระหนี้ตึงตัว',
  },
  // FICO
  {
    match: /fico/i,
    label: 'คะแนนเครดิต (FICO)',
    pos: 'คะแนนเครดิตสูง → ลดความเสี่ยง',
    neg: 'คะแนนเครดิตต่ำ → เพิ่มความเสี่ยง',
  },
  // อายุบัญชีเครดิต (วัน)
  {
    match: /days_with_cr_line/i,
    label: 'อายุบัญชีเครดิต (วัน)',
    pos: 'ประวัติสินเชื่อนาน/สม่ำเสมอ',
    neg: 'ประวัติสินเชือสั้น/ข้อมูลจำกัด',
  },
  // ยอดคงค้างหมุนเวียน
  {
    match: /revol_bal/i,
    label: 'ยอดคงค้างหมุนเวียน (Revolving Balance)',
    pos: 'ยอดคงค้างหมุนเวียนต่ำ',
    neg: 'ยอดคงค้างหมุนเวียนสูง',
  },
  // อัตราการใช้วงเงินหมุนเวียน
  {
    match: /revol_util/i,
    label: 'อัตราการใช้วงเงินหมุนเวียน (Utilization)',
    pos: 'ใช้วงเงินหมุนเวียนน้อย',
    neg: 'ใช้วงเงินหมุนเวียนสูง',
  },
  // จำนวนการสอบถามสินเชื่อ 6 เดือน
  {
    match: /inq_last_6mths/i,
    label: 'จำนวนการขอสินเชื่อใหม่ (6 เดือน)',
    pos: 'ยื่นขอไม่บ่อย → เสถียร',
    neg: 'ยื่นขอบ่อย → เพิ่มความเสี่ยง',
  },
  // ประวัติผิดนัด 2 ปี
  {
    match: /delinq_2yrs/i,
    label: 'ประวัติผิดนัด 2 ปี',
    pos: 'ไม่มี/น้อย → ลดความเสี่ยง',
    neg: 'มีประวัติผิดนัด → เพิ่มความเสี่ยง',
  },
  // ประวัติทางการเงินเสีย (ศาล/ภาครัฐ)
  {
    match: /pub_rec/i,
    label: 'ประวัติทางการเงินเสีย (Public Records)',
    pos: 'ไม่มีประวัติทางการเงินเสีย',
    neg: 'มีประวัติทางการเงินเสีย',
  },
  // (target) not_fully_paid — ปกติไม่ต้องแสดง แต่เผื่อไว้
  {
    match: /not_fully_paid/i,
    label: 'ตัวแปรเป้าหมาย: จ่ายไม่ครบ',
    pos: 'ความเสี่ยงจ่ายไม่ครบลดลง',
    neg: 'ความเสี่ยงจ่ายไม่ครบเพิ่มขึ้น',
  },
  // วงเงินที่คาดการณ์
  {
    match: /estimated_credit_limit/i,
    label: 'วงเงินเครดิตที่คาดการณ์',
    pos: 'วงเงินคาดการณ์เพียงพอ/สูง',
    neg: 'วงเงินคาดการณ์ต่ำ/จำกัด',
  },
  // สัดส่วนค่างวดต่อรายได้
  {
    match: /installment_to_income_ratio/i,
    label: 'สัดส่วนค่างวดต่อรายได้',
    pos: 'สัดส่วนค่างวดต่ำ → ภาระไม่หนัก',
    neg: 'สัดส่วนค่างวดสูง → ภาระตึงตัว',
  },
  // ดอกเบี้ยสูงหรือไม่ (feature ที่คุณสร้าง)
  {
    match: /high_interest/i,
    label: 'ดอกเบี้ยสูงหรือไม่',
    pos: 'ดอกเบี้ยไม่สูง → ลดความเสี่ยง',
    neg: 'ดอกเบี้ยสูง → เพิ่มความเสี่ยง',
  },
  // วัตถุประสงค์: รวมหนี้
  {
    match: /purpose_debt_consolidation/i,
    label: 'วัตถุประสงค์: รวมหนี้',
    pos: 'รวมหนี้ — ไม่มีสัญญาณเสี่ยงเพิ่มเติม',
    neg: 'รวมหนี้ — เพิ่มความเสี่ยงเล็กน้อย',
  },
  // วัตถุประสงค์: การศึกษา
  {
    match: /purpose_educational/i,
    label: 'วัตถุประสงค์: การศึกษา',
    pos: 'กู้เพื่อการศึกษา → ความเสี่ยงต่ำกว่าเฉลี่ย',
    neg: 'วัตถุประสงค์นี้เพิ่มความเสี่ยงเล็กน้อย',
  },
  // วัตถุประสงค์: ธุรกิจขนาดเล็ก
  {
    match: /purpose_small_business/i,
    label: 'วัตถุประสงค์: ธุรกิจขนาดเล็ก',
    pos: 'ธุรกิจขนาดเล็ก — ไม่มีสัญญาณเสี่ยงเพิ่ม',
    neg: 'ธุรกิจขนาดเล็ก — รายได้ผันผวน → เพิ่มความเสี่ยง',
  },
  // วัตถุประสงค์: อื่น ๆ
  {
    match: /purpose_all_other/i,
    label: 'วัตถุประสงค์: อื่น ๆ',
    pos: 'วัตถุประสงค์ทั่วไป → ไม่มีสัญญาณความเสี่ยงเพิ่มเติม',
    neg: 'วัตถุประสงค์ไม่ระบุชัดเจน → เพิ่มความเสี่ยงเล็กน้อย',
  },
];


const toThai = (k: string) => {
  const item = factorMap.find((f) => f.match.test(k));
  if (item) return item.label;
  return k
    .replaceAll("_", " ")
    .replace(/<=|>=|<|>|==/g, (m) => ` ${m} `)
    .trim();
};

const explain = (k: string, isPositive: boolean) => {
  const item = factorMap.find((f) => f.match.test(k));
  const text = item
    ? isPositive
      ? item.pos
      : item.neg
    : isPositive
    ? "ส่งเสริมการผ่านเกณฑ์"
    : "เพิ่มความเสี่ยง";
  const bullet = isPositive ? "🟢" : "🔴";
  return `${bullet} ${text}`;
};

interface LoanApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export function LoanApplicationDialog({
  isOpen,
  onClose,
  token,
  onSuccess,
}: LoanApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState<LoanApplication>({
    credit_policy: 1,
    purpose: "debt_consolidation",
    int_rate: 0.12,
    installment: 500,
    log_annual_inc: 11,
    dti: 15,
    fico: 700,
    days_with_cr_line: 5000,
    revol_bal: 20000,
    revol_util: 50,
    inq_last_6mths: 0,
    delinq_2yrs: 0,
    pub_rec: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.submitApplication(token, formData);
      setResult(response);
    } catch (err) {
      alert(
        "เกิดข้อผิดพลาด: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
    if (result) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">ใบสมัครสินเชื่อ</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="space-y-4">
              <div
                className={`p-6 rounded-lg ${
                  result.prediction === "ผ่านเกณฑ์"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <h3 className="text-xl font-bold mb-2">
                  ผลการพิจารณา: {result.prediction}
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">ความเสี่ยงผิดนัด</p>
                    <p className="text-lg font-semibold">
                      {(result.probability * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">FICO Score</p>
                    <p className="text-lg font-semibold">{result.fico_score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">อัตราดอกเบี้ย</p>
                    <p className="text-lg font-semibold">
                      {(result.interest_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ปัจจัยที่มีผลต่อการตัดสินใจ:</h4>
                <div className="space-y-1">
                  {Object.entries(result.explanation).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key}</span>
                      <span className={Number(value) > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Number(value).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div> */}
              {/* <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ปัจจัยที่มีผลต่อการตัดสินใจ:</h4>
                <div className="space-y-2">
                  {Object.entries(result.explanation).map(([key, value]) => {
                    const num = Number(value);
                    const isPos = num > 0;
                    return (
                      <div key={key} className="text-sm">
                        <div className="flex justify-between">
                          <span>{toThai(String(key))}</span>
                          <span className={isPos ? 'text-green-600' : 'text-red-600'}>
                            {num.toFixed(3)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {explain(String(key), isPos)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div> */}
              {/* --- แทนที่บล็อก JSX เดิมด้วยอันนี้ (ไม่แสดงตัวเลข) --- */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">
                  ปัจจัยที่มีผลต่อการตัดสินใจ
                </h4>

                {(() => {
                  const items = Object.entries(result.explanation).map(
                    ([key, value]) => {
                      const num = Number(value);
                      const isPos = num > 0;
                      return {
                        key,
                        isPos,
                        label: toThai(String(key)),
                        desc: explain(String(key), isPos),
                      };
                    }
                  );

                  const positives = items.filter((i) => i.isPos);
                  const negatives = items.filter((i) => !i.isPos);

                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* กลุ่ม: ปัจจัยสนับสนุน */}
                      <section className="rounded-md border border-green-200 bg-green-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-800">
                            ปัจจัยสนับสนุน (ช่วยผ่าน)
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {positives.length > 0 ? (
                            positives.map((f) => (
                              <li
                                key={f.key}
                                className="flex items-start gap-2"
                              >
                                <span className="leading-5">🟢</span>
                                <div>
                                  <div className="text-sm font-medium">
                                    {f.label}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {f.desc.replace(/^🟢 |^🔴 /, "")}
                                  </div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-500">
                              — ไม่มีปัจจัยสนับสนุน —
                            </li>
                          )}
                        </ul>
                      </section>

                      {/* กลุ่ม: ปัจจัยเพิ่มความเสี่ยง */}
                      <section className="rounded-md border border-red-200 bg-red-50 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-sm font-medium text-red-800">
                            ปัจจัยเพิ่มความเสี่ยง (อาจไม่ผ่าน)
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {negatives.length > 0 ? (
                            negatives.map((f) => (
                              <li
                                key={f.key}
                                className="flex items-start gap-2"
                              >
                                <span className="leading-5">🔴</span>
                                <div>
                                  <div className="text-sm font-medium">
                                    {f.label}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {f.desc.replace(/^🟢 |^🔴 /, "")}
                                  </div>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-500">
                              — ไม่มีปัจจัยเสี่ยง —
                            </li>
                          )}
                        </ul>
                      </section>
                    </div>
                  );
                })()}

                <p className="mt-3 text-[11px] text-gray-500">
                  หมายเหตุ: ข้อมูลนี้เป็นสรุปจากโมเดลเพื่อช่วยการพิจารณา
                  ไม่ใช่เกณฑ์ตัดสินสุดท้าย
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-[#ff9933] text-white py-2 rounded-lg font-medium hover:bg-[#e68a2e]"
              >
                ปิด
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    นโยบายสินเชื่อ
                    <span className="block text-xs text-gray-500 font-normal">
                      (Credit Policy)
                    </span>
                  </label>
                  <select
                    value={formData.credit_policy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_policy: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  >
                    <option value={1}>ผ่านเกณฑ์</option>
                    <option value={0}>ไม่ผ่านเกณฑ์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วัตถุประสงค์การกู้
                    <span className="block text-xs text-gray-500 font-normal">
                      (Purpose)
                    </span>
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  >
                    <option value="debt_consolidation">รวมหนี้</option>
                    <option value="small_business">ธุรกิจขนาดเล็ก</option>
                    <option value="educational">การศึกษา</option>
                    <option value="all_other">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อัตราดอกเบี้ยเงินกู้
                    <span className="block text-xs text-gray-500 font-normal">
                      (Interest Rate)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.int_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        int_rate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ยอดผ่อนชำระต่อเดือน
                    <span className="block text-xs text-gray-500 font-normal">
                      (Installment)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.installment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installment: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลอการิทึมรายได้ต่อปี
                    <span className="block text-xs text-gray-500 font-normal">
                      (Log Annual Income)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.log_annual_inc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        log_annual_inc: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อัตราส่วนหนี้ต่อรายได้
                    <span className="block text-xs text-gray-500 font-normal">
                      (Debt-to-Income Ratio)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dti}
                    onChange={(e) =>
                      setFormData({ ...formData, dti: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนเครดิต FICO
                    <span className="block text-xs text-gray-500 font-normal">
                      (FICO Score)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.fico}
                    onChange={(e) =>
                      setFormData({ ...formData, fico: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนวันที่มีเครดิต
                    <span className="block text-xs text-gray-500 font-normal">
                      (Days with Credit Line)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.days_with_cr_line}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        days_with_cr_line: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ยอดเงินหมุนเวียน
                    <span className="block text-xs text-gray-500 font-normal">
                      (Revolving Balance)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.revol_bal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revol_bal: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เปอร์เซ็นต์การใช้เครดิต
                    <span className="block text-xs text-gray-500 font-normal">
                      (Revolving Utilization)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.revol_util}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        revol_util: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนครั้งที่ตรวจสอบ (6 เดือน)
                    <span className="block text-xs text-gray-500 font-normal">
                      (Inquiries Last 6 Months)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.inq_last_6mths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inq_last_6mths: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนครั้งที่ผิดนัด (2 ปี)
                    <span className="block text-xs text-gray-500 font-normal">
                      (Delinquencies 2 Years)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.delinq_2yrs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delinq_2yrs: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บันทึกสาธารณะ
                    <span className="block text-xs text-gray-500 font-normal">
                      (Public Records)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.pub_rec}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pub_rec: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff9933] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#ff9933] text-white py-2 rounded-lg font-medium hover:bg-[#e68a2e] disabled:opacity-50"
                >
                  {loading ? "กำลังประมวลผล..." : "ส่งใบสมัคร"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
