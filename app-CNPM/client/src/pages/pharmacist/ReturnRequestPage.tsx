import { useMemo, useState, useEffect } from "react";
import ProductSelector from "../../components/ProductSelector";
import QuantityStepper from "../../components/QuantityStepper";
import { Icon, EmptyState } from "../../components/UI";
import { getMedicines } from "../../api/medicineApi";
import { createImportRequest } from "../../api/medicineRequestApi";
import type { Medicine } from "../../types/medicine";

type ReturnItem = {
  productId: number;
  productName: string;
  quantity: number;
  reason: string;
};

export default function ReturnMedicinePage() {
  const [products, setProducts] = useState<Medicine[]>([]);
  const [productId, setProductId] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  useEffect(() => {
    getMedicines("active").then((res) => {
      setProducts(res.data);
      if (res.data.length > 0) setProductId(res.data[0].id);
    }).catch(console.error);
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const totalQuantity = returnItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    setReturnItems((prev) => {
      const existedIndex = prev.findIndex((i) => i.productId === productId);

      if (existedIndex !== -1) {
        const updated = [...prev];
        updated[existedIndex] = {
          ...updated[existedIndex],
          quantity: updated[existedIndex].quantity + quantity,
          reason: reason || updated[existedIndex].reason,
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          reason: reason || "Không có lý do",
        },
      ];
    });

    setQuantity(1);
    setReason("");
  };

  const handleRemove = (id: number) => {
    setReturnItems((prev) => prev.filter((item) => item.productId !== id));
  };

  const handleSubmit = async () => {
    if (returnItems.length === 0) return;

    try {
      for (const item of returnItems) {
        await createImportRequest({
          medicine_id: item.productId,
          quantity: item.quantity,
          note: `Trả thuốc: ${item.reason}`,
        });
      }
      alert("Đã gửi yêu cầu trả thuốc!");
      setReturnItems([]);
      setQuantity(1);
      setReason("");
      if (products.length > 0) setProductId(products[0].id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi yêu cầu trả thuốc");
    }
  };

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Trả thuốc</h1>
          <p className="page-subtitle">Chọn thuốc, số lượng và lý do trả trước khi gửi yêu cầu</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10,
            padding: "10px 18px",
          }}
        >
          <Icon name="assignment_return" size={18} style={{ color: "#d97706" }} />
          <span style={{ fontSize: "0.78rem", color: "#d97706", fontWeight: 600 }}>Loại thuốc trả</span>
          <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.4rem", color: "#b45309", lineHeight: 1 }}>
            {returnItems.length}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 20, flex: 1 }}>
        {/* LEFT FORM */}
        <div className="metric-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderBottom: "1px solid var(--outline-variant)", paddingBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--on-surface)" }}>Thêm thuốc cần trả</p>
            <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 3 }}>
              Mỗi yêu cầu có thể chứa nhiều loại thuốc.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Chọn thuốc</label>
            <ProductSelector products={products} value={productId} onChange={setProductId} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số lượng trả</label>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Lý do trả thuốc</label>
            <textarea
              className="wms-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Dùng không hết, hết hạn sử dụng..."
            />
          </div>

          <button
            className="btn btn-warning"
            style={{ marginTop: "auto", justifyContent: "center", padding: "12px", borderRadius: 10, background: "#f59e0b", color: "#fff" }}
            onClick={handleAddItem}
          >
            <Icon name="add" size={18} /> Thêm vào danh sách trả
          </button>
        </div>

        {/* RIGHT CART */}
        <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* HEADER */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Danh sách thuốc trả</p>
              <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 2 }}>Kiểm tra lại trước khi gửi yêu cầu</p>
            </div>
            {returnItems.length > 0 && (
              <button className="btn btn-ghost" style={{ color: "var(--error)", fontSize: "0.78rem" }} onClick={() => setReturnItems([])}>
                <Icon name="clear_all" size={14} /> Xóa tất cả
              </button>
            )}
          </div>

          {/* LIST */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {returnItems.length === 0 ? (
              <EmptyState icon="assignment_return" message="Chưa có thuốc nào cần trả" />
            ) : (
              returnItems.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 64px 1.4fr 48px",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--outline-variant)",
                    gap: 12
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.productName}</p>
                  <p style={{ textAlign: "center", fontWeight: 700, color: "#d97706", fontSize: "1rem" }}>
                    {item.quantity}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.reason}
                  </p>
                  <button
                    className="btn btn-ghost"
                    style={{ color: "var(--error)", padding: "4px 8px", justifyContent: "center" }}
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div style={{ borderTop: "1px solid var(--outline-variant)", padding: "16px 20px", background: "var(--surface-container-lowest)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Tổng số lượng trả</span>
              <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{totalQuantity}</span>
            </div>
            <button
              className="btn btn-warning"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: 10, background: "#f59e0b", color: "#fff", opacity: returnItems.length === 0 ? 0.5 : 1 }}
              onClick={handleSubmit}
              disabled={returnItems.length === 0}
            >
              <Icon name="send" size={18} /> Gửi yêu cầu trả thuốc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
