import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import MedicineCard from "../../../components/MedicineCard";
import type { RootState } from "../../../app/store";
import { ROLES } from "../../../constants/role";
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  restoreMedicine,
} from "../../../api/medicineApi";
import type { Medicine } from "../../../types/medicine";
import { PageHeader, Icon, EmptyState, SearchBar } from "../../../components/UI";

/* ─── Giữ nguyên type ─── */
type ModalState =
  | { type: "add" }
  | { type: "edit"; data: Medicine }
  | { type: "delete"; data: Medicine }
  | { type: "restore"; data: Medicine }
  | null;

export default function MedicinePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldOpenAddModal =
    user?.role === ROLES.MANAGER && searchParams.get("action") === "add";

  /* ─── Giữ nguyên toàn bộ state & handlers ─── */
  const [products, setProducts] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(
    shouldOpenAddModal ? { type: "add" } : null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!shouldOpenAddModal) return;
    setSearchParams({}, { replace: true });
  }, [setSearchParams, shouldOpenAddModal]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((p) =>
      `${p.name} ${p.description ?? ""}`.toLowerCase().includes(keyword),
    );
  }, [search, products]);

  const resetForm = () => { setName(""); setDescription(""); };

  const handleEditOpen = (medicine: Medicine) => {
    setName(medicine.name);
    setDescription(medicine.description);
    setImage(null);
    setModal({ type: "edit", data: medicine });
  };

  const handleDeleteOpen = (medicine: Medicine) => {
    setModal({ type: "delete", data: medicine });
  };

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines("all");
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getMedicines("all");
        setProducts(res.data);
      } catch (err) { console.error(err); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (image) formData.append("image", image);
    await createMedicine(formData);
    await fetchMedicines();
    resetForm(); setImage(null); setModal(null);
  };

  const handleUpdate = async () => {
    if (!modal || modal.type !== "edit") return;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (image) formData.append("image", image);
    await updateMedicine(modal.data.id, formData);
    await fetchMedicines();
    resetForm(); setModal(null); setImage(null);
  };

  const handleDelete = async () => {
    if (!modal || modal.type !== "delete") return;
    try {
      await deleteMedicine(modal.data.id);
      await fetchMedicines();
      setModal(null);
    } catch (err) { console.error("Delete failed:", err); }
  };

  const handleRestore = async (medicine: Medicine) => {
    try {
      await restoreMedicine(medicine.id);
      await fetchMedicines();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page animate-fade-in">
      {/* ─── Header ─── */}
      <PageHeader
        title="Danh sách thuốc"
        subtitle="Tìm kiếm và tra cứu thuốc trong hệ thống"
        actions={
          user?.role === ROLES.MANAGER ? (
            <button id="btn-add-medicine" className="btn btn-primary" onClick={() => setModal({ type: "add" })}>
              <Icon name="add" size={16} /> Thêm thuốc
            </button>
          ) : undefined
        }
      />

      {/* ─── Search & count ─── */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, mô tả..."
          style={{ flex: 1 }}
        />
        <div style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} thuốc
        </div>
      </div>

      {/* ─── Medicine grid (giữ nguyên MedicineCard component) ─── */}
      {filteredProducts.length === 0 ? (
        <div className="metric-card">
          <EmptyState icon="medication" message="Không tìm thấy thuốc nào" />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProducts.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              role={user?.role}
              onEdit={handleEditOpen}
              onDelete={handleDeleteOpen}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      {/* ─── Modals ─── */}
      {modal && (
        <div className="modal-overlay">
          {/* Add / Edit */}
          {(modal.type === "add" || modal.type === "edit") && (
            <div className="modal-box-sm wms-form">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {modal.type === "add" ? "Thêm thuốc" : "Cập nhật thông tin thuốc"}
                </h2>
                <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => { setModal(null); resetForm(); setImage(null); }}>
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Ảnh thuốc</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) setImage(e.target.files[0]); }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Tên thuốc</label>
                  <input
                    id="medicine-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên thuốc"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Mô tả</label>
                  <textarea
                    id="medicine-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về thuốc"
                    rows={3}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => { setModal(null); resetForm(); setImage(null); }}>Hủy</button>
                <button className="btn btn-primary" onClick={modal.type === "add" ? handleCreate : handleUpdate}>
                  <Icon name="save" size={16} /> Lưu
                </button>
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {modal.type === "delete" && (
            <div className="modal-box-sm">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--error-container)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon name="delete" size={28} style={{ color: "var(--error)" }} />
                </div>
                <h2 className="font-headline" style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Xác nhận xoá</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>
                  Bạn có chắc muốn xoá thuốc <strong>{modal.data.name}</strong>?
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Icon name="delete" size={16} /> Xoá
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
