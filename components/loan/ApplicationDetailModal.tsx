// ============================================
// components/loan/ApplicationDetailModal.tsx
// Modal สำหรับแสดงรายละเอียดการให้สินเชื่อรายบุคคล
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { api, ApplicationDetail } from '@/lib/api';
import { X, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const factorMap: Array<{
  match: RegExp;
  label: string;
  pos: string;
  neg: string;
}> = [
  {
    match: /credit_policy/i,
    label: 'ผ่านนโยบายเครดิตภายใน',
    pos: 'ผ่านเกณฑ์ภายใน → ลดความเสี่ยง',
    neg: 'ไม่ผ่าน/มีข้อยกเว้น → เพิ่มความเสี่ยง',
  },
  {
    match: /int_rate/i,
    label: 'อัตราดอกเบี้ย',
    pos: 'อัตราดอกเบี้ยอยู่ในช่วงปลอดภัย',
    neg: 'อัตราดอกเบี้ยสูงกว่าช่วงปลอดภัย',
  },
  {
    match: /installment/i,
    label: 'ค่างวด/เดือน',
    pos: 'ค่างวดเหมาะสม → ลดความเสี่ยง',
    neg: 'ค่างวดสูงเกินศักยภาพ → เพิ่มความเสี่ยง',
  },
  {
    match: /log_annual_inc/i,
    label: 'รายได้ต่อปี (ปรับสเกล)',
    pos: 'รายได้ต่อปีสูง → ลดความเสี่ยง',
    neg: 'รายได้ต่อปีต่ำ → เพิ่มความเสี่ยง',
  },
  {
    match: /dti/i,
    label: 'สัดส่วนหนี้ต่อรายได้ (DTI)',
    pos: 'DTI ต่ำ → จัดการหนี้ดี',
    neg: 'DTI สูง → ความสามารถชำระหนี้ตึงตัว',
  },
  {
    match: /fico/i,
    label: 'คะแนนเครดิต (FICO)',
    pos: 'คะแนนเครดิตสูง → ลดความเสี่ยง',
    neg: 'คะแนนเครดิตต่ำ → เพิ่มความเสี่ยง',
  },
  {
    match: /days_with_cr_line/i,
    label: 'อายุบัญชีเครดิต (วัน)',
    pos: 'ประวัติสินเชื่อนาน/สม่ำเสมอ',
    neg: 'ประวัติสินเชือสั้น/ข้อมูลจำกัด',
  },
  {
    match: /revol_bal/i,
    label: 'ยอดคงค้างหมุนเวียน (Revolving Balance)',
    pos: 'ยอดคงค้างหมุนเวียนต่ำ',
    neg: 'ยอดคงค้างหมุนเวียนสูง',
  },
  {
    match: /revol_util/i,
    label: 'อัตราการใช้วงเงินหมุนเวียน (Utilization)',
    pos: 'ใช้วงเงินหมุนเวียนน้อย',
    neg: 'ใช้วงเงินหมุนเวียนสูง',
  },
  {
    match: /inq_last_6mths/i,
    label: 'จำนวนการขอสินเชื่อใหม่ (6 เดือน)',
    pos: 'ยื่นขอไม่บ่อย → เสถียร',
    neg: 'ยื่นขอบ่อย → เพิ่มความเสี่ยง',
  },
  {
    match: /delinq_2yrs/i,
    label: 'ประวัติผิดนัด 2 ปี',
    pos: 'ไม่มี/น้อย → ลดความเสี่ยง',
    neg: 'มีประวัติผิดนัด → เพิ่มความเสี่ยง',
  },
  {
    match: /pub_rec/i,
    label: 'ประวัติทางการเงินเสีย (Public Records)',
    pos: 'ไม่มีประวัติทางการเงินเสีย',
    neg: 'มีประวัติทางการเงินเสีย',
  },
  {
    match: /high_interest/i,
    label: 'ดอกเบี้ยสูงหรือไม่',
    pos: 'ดอกเบี้ยไม่สูง → ลดความเสี่ยง',
    neg: 'ดอกเบี้ยสูง → เพิ่มความเสี่ยง',
  },
  {
    match: /purpose_debt_consolidation/i,
    label: 'วัตถุประสงค์: รวมหนี้',
    pos: 'รวมหนี้ — ไม่มีสัญญาณเสี่ยงเพิ่มเติม',
    neg: 'รวมหนี้ — เพิ่มความเสี่ยงเล็กน้อย',
  },
  {
    match: /purpose_educational/i,
    label: 'วัตถุประสงค์: การศึกษา',
    pos: 'กู้เพื่อการศึกษา → ความเสี่ยงต่ำกว่าเฉลี่ย',
    neg: 'วัตถุประสงค์นี้เพิ่มความเสี่ยงเล็กน้อย',
  },
  {
    match: /purpose_small_business/i,
    label: 'วัตถุประสงค์: ธุรกิจขนาดเล็ก',
    pos: 'ธุรกิจขนาดเล็ก — ไม่มีสัญญาณเสี่ยงเพิ่ม',
    neg: 'ธุรกิจขนาดเล็ก — รายได้ผันผวน → เพิ่มความเสี่ยง',
  },
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
    .replaceAll('_', ' ')
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
    ? 'ส่งเสริมการผ่านเกณฑ์'
    : 'เพิ่มความเสี่ยง';
  return text;
};

const purposeLabels: Record<string, string> = {
  debt_consolidation: 'รวมหนี้',
  small_business: 'ธุรกิจขนาดเล็ก',
  educational: 'การศึกษา',
  all_other: 'อื่นๆ',
  credit_card: 'บัตรเครดิต',
  home_improvement: 'ปรับปรุงบ้าน',
};

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number | null;
  token: string;
}

export function ApplicationDetailModal({
  isOpen,
  onClose,
  applicationId,
  token,
}: ApplicationDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);

  useEffect(() => {
    if (isOpen && applicationId && token) {
      loadDetail();
    }
  }, [isOpen, applicationId, token]);

  const loadDetail = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const data = await api.getApplicationDetail(token, applicationId);
      setDetail(data);
    } catch (err) {
      console.error('Error loading application detail:', err);
      alert('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            รายละเอียดใบสมัครเลขที่ #{applicationId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">กำลังโหลดข้อมูล...</div>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* ข้อมูลหลัก */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-gray-600" size={20} />
                    <span className="text-sm font-medium text-gray-600">วันที่สมัคร</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(detail.application_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-gray-600" size={20} />
                    <span className="text-sm font-medium text-gray-600">คะแนน FICO</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{detail.fico}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-gray-600" size={20} />
                    <span className="text-sm font-medium text-gray-600">วัตถุประสงค์</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {purposeLabels[detail.purpose] || detail.purpose}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-gray-600" size={20} />
                    <span className="text-sm font-medium text-gray-600">อัตราดอกเบี้ย</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {(detail.int_rate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* ผลการพิจารณา */}
              <div
                className={`p-6 rounded-lg ${
                  detail.model_prediction === 0
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}
              >
                <h3 className="text-xl font-bold mb-4">
                  ผลการพิจารณา:{' '}
                  <span
                    className={
                      detail.model_prediction === 0
                        ? 'text-green-700'
                        : 'text-red-700'
                    }
                  >
                    {detail.model_prediction === 0 ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ความเสี่ยงผิดนัด</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-800">
                        {(detail.model_probability * 100).toFixed(2)}%
                      </span>
                      <span className="text-sm text-gray-500">
                        ({detail.model_probability < 0.5 ? 'ความเสี่ยงต่ำ' : 'ความเสี่ยงสูง'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        detail.model_prediction === 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <p className="text-sm font-medium">สถานะ</p>
                      <p className="text-lg font-bold">
                        {detail.model_prediction === 0 ? '✓ อนุมัติ' : '✗ ปฏิเสธ'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ปัจจัยที่มีผลต่อการตัดสินใจ */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">
                  ปัจจัยที่มีผลต่อการตัดสินใจ
                </h4>

                {(() => {
                  const items = Object.entries(detail.lime_explanation)
                    .filter(([key]) => !/^purpose_/.test(key) || key === `purpose_${detail.purpose}`)
                    .map(([key, value]) => {
                      const num = Number(value);
                      const isPos = num > 0;
                      return {
                        key,
                        value: num,
                        isPos,
                        label: toThai(String(key)),
                        desc: explain(String(key), isPos),
                      };
                    })
                    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

                  const positives = items.filter((i) => i.isPos);
                  const negatives = items.filter((i) => !i.isPos);

                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* ปัจจัยสนับสนุน */}
                      <section className="rounded-md border border-green-200 bg-green-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-800">
                            ปัจจัยสนับสนุน (ช่วยผ่าน)
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {positives.length > 0 ? (
                            positives.map((f) => (
                              <li key={f.key} className="flex items-start gap-2">
                                <span className="leading-5">🟢</span>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {f.label}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {f.desc}
                                  </div>
                                  <div className="text-xs text-green-700 font-medium mt-1">
                                    น้ำหนัก: +{f.value.toFixed(3)}
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

                      {/* ปัจจัยเพิ่มความเสี่ยง */}
                      <section className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-sm font-medium text-red-800">
                            ปัจจัยเพิ่มความเสี่ยง (อาจไม่ผ่าน)
                          </span>
                        </div>
                        <ul className="space-y-3">
                          {negatives.length > 0 ? (
                            negatives.map((f) => (
                              <li key={f.key} className="flex items-start gap-2">
                                <span className="leading-5">🔴</span>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {f.label}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {f.desc}
                                  </div>
                                  <div className="text-xs text-red-700 font-medium mt-1">
                                    น้ำหนัก: {f.value.toFixed(3)}
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

                <p className="mt-4 text-xs text-gray-500">
                  หมายเหตุ: ข้อมูลนี้เป็นสรุปจากโมเดล AI เพื่อช่วยการพิจารณา
                  ไม่ใช่เกณฑ์ตัดสินสุดท้าย
                </p>
              </div>

              {/* ปุ่มปิด */}
              <button
                onClick={onClose}
                className="w-full bg-[#ff9933] text-white py-3 rounded-lg font-medium hover:bg-[#e68a2e] transition-colors"
              >
                ปิด
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">ไม่พบข้อมูล</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}