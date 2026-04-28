import { useMemo, useState, useEffect } from "react";
import type { Medicine } from "../../types/medicine";
import { getMedicines } from "../../api/medicineApi";
import { createExportRequest } from "../../api/medicineRequestApi";
import ProductSelector from "../../components/ProductSelector";
import QuantityStepper from "../../components/QuantityStepper";
import { Icon, EmptyState } from "../../components/UI";

type RequestItem = { productId: number; productName: string; quantity: number };

export default function TakeMedicinePage() {
  /* ─── Giữ nguyên toàn bộ state & handlers ─── */
  const [products, setProducts] = useState<Medicine[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await getMedicines("active");
      setProducts(res.data);
      if (res.data.length > 0) setProductId(res.data[0].id);
    };
    fetchProducts();
  }, []);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [productId, products]);
  const totalQuantity = requestItems.reduce((total, item) => total + item.quantity, 0);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    setRequestItems((prev) => {
      const existed = prev.find((i) => i.productId === productId);
      if (existed) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { productId: selectedProduct.id, productName: selectedProduct.name, quantity }];
    });
    setQuantity(1);
  };

  const handleIncrease = (id: number) => setRequestItems((prev) => prev.map((item) => item.productId === id ? { ...item, quantity: item.quantity + 1 } : item));
  const handleDecrease = (id: number) => setRequestItems((prev) => prev.map((item) => item.productId === id ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  const handleRemove = (id: number) => setRequestItems((prev) => prev.filter((i) => i.productId !== id));

  const handleSubmit = async () => {
    if (requestItems.length === 0) return;
    try {
      await createExportRequest(
        requestItems.map((i) => ({ medicine_id: i.productId, quantity: i.quantity }))
      );
      alert("Gửi yêu cầu thành công!");
      setRequestItems([]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi yêu cầu");
    }
  };

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column" }}>
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Yêu cầu lấy thuốc</h1>
          <p className="page-subtitle">Chọn thuốc và số lượng, gửi yêu cầu xuất kho</p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(30,64,175,0.06)",
            border: "1px solid rgba(30,64,175,0.15)",
            borderRadius: 10,
            padding: "10px 18px",
          }}
        >
          <Icon name="shopping_cart" size={18} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600 }}>Mặt hàng</span>
          <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--primary)", lineHeight: 1 }}>
            {requestItems.length}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 20, flex: 1 }}>
        {/* ─── Left: Add form (giữ nguyên ProductSelector & QuantityStepper) ─── */}
        <div className="metric-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderBottom: "1px solid var(--outline-variant)", paddingBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--on-surface)" }}>Thêm thuốc</p>
            <p style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 3 }}>
              *Chỉ hiển thị thuốc có trong kho
            </p>
          </div>

          {/* Product selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Chọn thuốc</label>
            <ProductSelector products={products} value={productId} onChange={setProductId} />
          </div>

          {/* Quantity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label className="text-label-sm" style={{ color: "var(--on-surface-variant)" }}>Số lượng</label>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <button
            id="btn-add-to-request"
            className="btn btn-primary"
            style={{ marginTop: "auto", justifyContent: "center", padding: "12px", borderRadius: 10 }}
            onClick={handleAddItem}
          >
            <Icon name="add_shopping_cart" size={18} /> Thêm vào yêu cầu
          </button>
        </div>

        {/* ─── Right: Cart ─── */}
        <div className="metric-card" style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Danh sách thuốc yêu cầu</p>
              <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginTop: 2 }}>Kiểm tra lại trước khi gửi</p>
            </div>
            {requestItems.length > 0 && (
              <button className="btn btn-ghost" style={{ color: "var(--error)", fontSize: "0.78rem" }} onClick={() => setRequestItems([])}>
                <Icon name="clear_all" size={14} /> Xóa tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {requestItems.length === 0 ? (
              <EmptyState icon="medication" message="Chưa có thuốc nào trong yêu cầu" />
            ) : (
              requestItems.map((item, i) => (
                <div
                  key={`${item.productId}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 88px 48px",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--outline-variant)",
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.productName}</p>

                  <p style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)", fontSize: "1rem" }}>
                    {item.quantity}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1 }} onClick={() => handleDecrease(item.productId)}>−</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "1rem", lineHeight: 1 }} onClick={() => handleIncrease(item.productId)}>+</button>
                  </div>

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

          {/* Footer */}
          <div style={{ borderTop: "1px solid var(--outline-variant)", padding: "16px 20px", background: "var(--surface-container-lowest)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)" }}>Tổng số lượng</span>
              <span className="font-headline" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{totalQuantity}</span>
            </div>
            <button
              id="btn-submit-request"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: 10 }}
              onClick={handleSubmit}
              disabled={requestItems.length === 0}
            >
              <Icon name="send" size={18} /> Gửi yêu cầu xuất kho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
