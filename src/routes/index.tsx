import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RECORDS_TITLE,
  addRecord,
  deleteRecord,
  downloadRecordsPdf,
  fetchRecords,
  updateRecord,
  type ComplaintRecord,
} from "@/lib/complaints";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OAUSTECH NCN Complaint Records 2026 — Front Desk Console" },
      {
        name: "description",
        content:
          "Front desk console for logging OAUSTECH NCN student complaints and corrections, viewing all records and downloading them as PDF.",
      },
      { property: "og:title", content: "OAUSTECH NCN Complaint Records 2026" },
      {
        property: "og:description",
        content:
          "Log student complaints and corrections, view the complete records table and download it as PDF.",
      },
    ],
  }),
  component: Index,
});

const emptyForm = {
  full_name: "",
  matric_no: "",
  payment_1k: "",
  complain: "",
  email: "",
};

const inputClass =
  "w-full bg-paper/50 border border-ink/15 rounded-md px-3 py-2.5 text-sm placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold";
const labelClass = "text-xs font-semibold text-ink/70 mb-1.5 block";

function Index() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["complaint_records"],
    queryFn: fetchRecords,
  });

  const numbered = useMemo(
    () => records.map((r, i) => ({ record: r, serial: i + 1 })),
    [records],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return numbered;
    return numbered.filter(({ record: r }) =>
      [r.full_name, r.matric_no, r.payment_1k, r.complain, r.email]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [numbered, search]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["complaint_records"] });

  const create = useMutation({
    mutationFn: addRecord,
    onSuccess: () => {
      setForm(emptyForm);
      setShowRecords(true);
      toast.success("Record submitted");
      invalidate();
    },
    onError: (error: { code?: string }) => {
      if (error?.code === "23505") {
        toast.error("A record with that matric no already exists. Use Edit to update it.");
        return;
      }
      toast.error("Could not save the record. Please try again.");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & typeof emptyForm) =>
      updateRecord(id, input),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingId(null);
      setShowRecords(true);
      toast.success("Record updated");
      invalidate();
    },
    onError: () => toast.error("Could not update the record. Please try again."),
  });

  const remove = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      toast.success("Record removed");
      invalidate();
    },
    onError: () => toast.error("Could not remove the record."),
  });

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = (r: ComplaintRecord) => {
    setEditingId(r.id);
    setForm({
      full_name: r.full_name,
      matric_no: r.matric_no,
      payment_1k: r.payment_1k,
      complain: r.complain,
      email: r.email,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: form.full_name.trim(),
      matric_no: form.matric_no.trim(),
      payment_1k: form.payment_1k.trim(),
      complain: form.complain.trim(),
      email: form.email.trim(),
    };
    if (!payload.full_name || !payload.matric_no) {
      toast.error("Full name and matric no are required");
      return;
    }

    const clash = records.find(
      (r) =>
        r.matric_no.trim().toLowerCase() === payload.matric_no.toLowerCase() &&
        r.id !== editingId,
    );

    if (clash) {
      if (editingId) {
        toast.error("Another record already uses that matric no.");
        return;
      }
      toast.error(`${payload.matric_no} already has a record. Opened it for editing.`);
      setShowRecords(true);
      startEdit(clash);
      return;
    }

    if (editingId) {
      update.mutate({ id: editingId, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  const onDownload = async () => {
    if (records.length === 0) {
      toast.error("There are no records to download yet");
      return;
    }
    try {
      await downloadRecordsPdf(records);
    } catch {
      toast.error("Could not build the PDF");
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <Toaster />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b-2 border-brand pb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 grid place-items-center bg-brand text-paper font-display font-semibold text-2xl rounded-sm">
              OA
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                Office of Student Affairs
              </p>
              <h1 className="font-display font-semibold text-3xl leading-none text-brand">
                Front Desk Console
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-2 bg-brand/8 border border-brand/15 rounded-full px-3 py-1.5">
              <span className="size-2 rounded-full bg-gold" /> Saved online
            </span>
            <span className="text-xs text-ink/50">
              {isLoading ? "Loading records…" : `${records.length} records stored`}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <section className="lg:col-span-5">
            <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10 bg-paper/60">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {editingId ? "Editing record" : "New entry"}
                  </p>
                  <h2 className="font-display font-semibold text-lg text-brand">
                    {editingId ? "Update this record" : "Log a complaint"}
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-ink/40">
                  {editingId ? "Matric no is the identifier" : `Entry #${records.length + 1}`}
                </span>
              </div>
              <form className="p-5 space-y-3.5" onSubmit={onSubmit}>
                <div className="grid grid-cols-2 gap-3.5">
                  <label className="block">
                    <span className={labelClass}>Full name</span>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="e.g. Adaeze Okonkwo"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Matric No</span>
                    <input
                      type="text"
                      value={form.matric_no}
                      onChange={(e) => set("matric_no", e.target.value)}
                      placeholder="25/NCN/0417"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>1K payment</span>
                  <input
                    type="text"
                    value={form.payment_1k}
                    onChange={(e) => set("payment_1k", e.target.value)}
                    placeholder="₦1,000.00"
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Complain</span>
                  <textarea
                    rows={3}
                    value={form.complain}
                    onChange={(e) => set("complain", e.target.value)}
                    placeholder="Describe the issue or correction…"
                    className={`${inputClass} resize-none`}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="name@oaustech.edu.ng"
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 bg-brand text-paper font-semibold text-sm rounded-md py-3 hover:bg-brand-2 transition-colors disabled:opacity-60"
                  >
                    {busy
                      ? "Saving…"
                      : editingId
                        ? "Update record"
                        : "Submit record"}
                  </button>
                  <button
                    type="button"
                    onClick={editingId ? cancelEdit : () => setForm(emptyForm)}
                    className="px-4 bg-white border border-ink/15 text-ink font-semibold text-sm rounded-md hover:border-ink/30 transition-colors"
                  >
                    {editingId ? "Cancel edit" : "Clear"}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-sm h-full flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-ink/10">
                <div>
                  <h2 className="font-display font-semibold text-2xl text-brand leading-none">
                    {RECORDS_TITLE}
                  </h2>
                  <p className="text-xs text-ink/50 mt-1">
                    {records.length} record{records.length === 1 ? "" : "s"} · saved online
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowRecords((v) => !v)}
                    className="inline-flex items-center gap-2 bg-white border border-ink/15 text-ink text-sm font-semibold rounded-md px-4 py-2.5 hover:border-ink/30 transition-colors"
                  >
                    <span className="size-1.5 rounded-full bg-brand-2" />
                    {showRecords ? "Hide records" : "View records"}
                  </button>
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-2 bg-gold text-ink text-sm font-semibold rounded-md px-4 py-2.5 hover:bg-gold/90 transition-colors"
                  >
                    Download as PDF
                  </button>
                </div>
              </div>

              <form
                className="flex flex-wrap gap-2.5 px-5 py-3.5 border-b border-ink/10 bg-paper/40"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput);
                  setShowRecords(true);
                }}
              >
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by matric no, name, email…"
                  className={`${inputClass} flex-1 min-w-[200px] bg-white`}
                />
                <button
                  type="submit"
                  className="bg-brand-2 text-paper text-sm font-semibold rounded-md px-4 py-2.5 hover:bg-brand transition-colors"
                >
                  Search
                </button>
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchInput("");
                    }}
                    className="bg-white border border-ink/15 text-ink text-sm font-semibold rounded-md px-4 py-2.5 hover:border-ink/30 transition-colors"
                  >
                    Clear search
                  </button>
                ) : null}
              </form>

              {showRecords ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-ink/50 border-b border-ink/10 bg-paper/50">
                          <th className="px-5 py-3 font-semibold">S/N</th>
                          <th className="px-4 py-3 font-semibold">Full name</th>
                          <th className="px-4 py-3 font-semibold">Matric No</th>
                          <th className="px-4 py-3 font-semibold">1K payment</th>
                          <th className="px-4 py-3 font-semibold">Complain</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        {visible.length === 0 && !isLoading ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-10 text-center text-ink/50">
                              {search
                                ? `No record matches “${search}”.`
                                : "No records yet. Submit the first entry on the left."}
                            </td>
                          </tr>
                        ) : null}
                        {visible.map(({ record: r, serial }) => (
                          <tr
                            key={r.id}
                            className={
                              editingId === r.id ? "bg-gold/12" : "hover:bg-paper/40"
                            }
                          >
                            <td className="px-5 py-3.5 font-semibold text-ink/50">{serial}</td>
                            <td className="px-4 py-3.5 font-semibold text-brand">{r.full_name}</td>
                            <td className="px-4 py-3.5 text-ink/70">{r.matric_no}</td>
                            <td className="px-4 py-3.5 text-ink/70">{r.payment_1k}</td>
                            <td className="px-4 py-3.5 text-ink/70">{r.complain}</td>
                            <td className="px-4 py-3.5 text-ink/60">{r.email}</td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => startEdit(r)}
                                className="text-xs font-semibold text-brand-2 hover:text-brand transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => remove.mutate(r.id)}
                                className="ml-3 text-xs font-semibold text-ink/40 hover:text-destructive transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-t border-ink/10 bg-paper/40 text-xs text-ink/50">
                    <span>
                      Showing {visible.length} of {records.length} record
                      {records.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-gold" /> Auto-saved online
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-5 py-16 text-center">
                  <p className="max-w-xs text-sm text-ink/50">
                    Records are stored online. Click{" "}
                    <span className="font-semibold text-brand">View records</span> to open the full
                    table, or download every entry as a PDF.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
