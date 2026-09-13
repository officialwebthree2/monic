import { supabase } from "@/integrations/supabase/client";

export type ComplaintRecord = {
  id: string;
  full_name: string;
  matric_no: string;
  payment_1k: string;
  complain: string;
  email: string;
  created_at: string;
};

export const RECORDS_TITLE = "OAUSTECH NCN COMPLAINT RECORDS 2026";

export async function fetchRecords(): Promise<ComplaintRecord[]> {
  const { data, error } = await supabase
    .from("complaint_records")
    .select("id, full_name, matric_no, payment_1k, complain, email, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ComplaintRecord[];
}

export async function addRecord(input: {
  full_name: string;
  matric_no: string;
  payment_1k: string;
  complain: string;
  email: string;
}) {
  const { error } = await supabase.from("complaint_records").insert(input);
  if (error) throw error;
}

export async function updateRecord(
  id: string,
  input: {
    full_name: string;
    matric_no: string;
    payment_1k: string;
    complain: string;
    email: string;
  },
) {
  const { error } = await supabase.from("complaint_records").update(input).eq("id", id);
  if (error) throw error;
}

export async function findByMatricNo(matric_no: string): Promise<ComplaintRecord | null> {
  const { data, error } = await supabase
    .from("complaint_records")
    .select("id, full_name, matric_no, payment_1k, complain, email, created_at")
    .ilike("matric_no", matric_no)
    .maybeSingle();
  if (error) throw error;
  return (data as ComplaintRecord | null) ?? null;
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from("complaint_records").delete().eq("id", id);
  if (error) throw error;
}

export async function downloadRecordsPdf(records: ComplaintRecord[]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(RECORDS_TITLE, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${records.length} record${records.length === 1 ? "" : "s"} · generated ${new Date().toLocaleString()}`,
    doc.internal.pageSize.getWidth() / 2,
    56,
    { align: "center" },
  );

  autoTable(doc, {
    startY: 72,
    head: [["S/N", "Full Name", "Matric No", "1K Payment", "Complain", "Email"]],
    body: records.map((r, i) => [
      String(i + 1),
      r.full_name,
      r.matric_no,
      r.payment_1k,
      r.complain,
      r.email,
    ]),
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", lineColor: [220, 220, 210] },
    headStyles: { fillColor: [18, 60, 43], textColor: [244, 243, 236], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 246, 240] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 130 },
      2: { cellWidth: 110 },
      3: { cellWidth: 80 },
      4: { cellWidth: 240 },
      5: { cellWidth: 150 },
    },
    margin: { left: 28, right: 28 },
  });

  doc.save("OAUSTECH-NCN-COMPLAINT-RECORDS-2026.pdf");
}
