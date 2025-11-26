# [ ] Tài chính Analystic - Bổ sung thêm
- Index Tổng doanh thu, Tổng chi phí, Tổng lợi nhuận, Biên lợi nhuận thuần
- Biểu đồ stacked column + line thể hiện Dòng tiền từ hoạt động kinh doanh (Operating Cash Flow) theo tháng bao gồm expense, income và net income
- Treemap chi phí vận hành + hàng bán

# [ ] Khách hàng Analystic - Bổ sung thêm

## 🔍 1. Global Filters (Top Panel)

Dùng để điều khiển toàn bộ dashboard:

| Filter           | Options                                  |
| ---------------- | ---------------------------------------- |
| Thời gian        | Date Range Picker (Last 30 days, Custom) |
| Nền tảng         | Facebook, Zalo, TikTok                   |
| Khu vực          | Multi choice Province/City               |
| Loại khách hàng  | New, Repeat, Potential, High Value       |
| Giá trị đơn hàng | Multi choice Range bin                   |

---

## 🧮 2. Index Overview (Top KPI Tiles)

| Chỉ số chính                     | Ý nghĩa                        |
| -------------------------------- | ------------------------------ |
| 🧍 Tổng số khách hàng            | Unique Customers               |
| 🔁 Repeat Rate (%)               | Tỷ lệ khách hàng quay lại      |
| 🛒 Avg Purchase Gap              | Khoảng cách giữa các lần mua   |
| 💰 Customer Lifetime Value (LTV) | Giá trị khách hàng theo chu kỳ |
| ⭐ Top Platform Performance      | Nền tảng hiệu quả nhất         |
| 📍 Top Geo Cluster               | Vùng có khách hàng tốt nhất    |

👉 Hiển thị dưới dạng KPI card + trending arrow.

---

## 📊 3. Insight Diagrams (Chia theo vùng phân tích)

---

### 🕒 A. Customer Behavior Zone

| Insight                                                   | Biểu đồ phù hợp             |
| ----------------------------------------------------------| --------------------------- |
| Phân bố thời gian mua (hour/weekday/Loại KH)              | Dot plot                    |
| Khoảng cách giữa các lần mua (Purchase Gap/Loại KH)       | Strip Plot                  |
| Tần suất mua lặp lại theo thời gian (Freq/Loại KH/Time)   | Timeline Layered Plot       |
| Repeat vs One-time                                        | Pareto Chart                |

📌 Mục tiêu: Nhìn ra chu kỳ mua hàng, tần suất, dấu hiệu churn.

---

### 🌍 B. Geographic Insight Zone

| Insight                                          | Biểu đồ            |
| -------------------------------------------------| ------------------ |
| Phân bố khách hàng theo tỉnh/thành               | Geo Heat Map       |
| Giá trị đơn hàng trung bình theo vùng + Platform | Bar Chart          |
| Repeat rate theo khu vực + Platform              | Bubble Map         |
| LTV by khu vực + Platform                        | Box Plot           |

📌 Mục tiêu: Nhận biết “Hot Zone” & tiềm năng từng khu vực.

---

### 🧬 C. Customer Segmentation Zone

| Insight                                                  | Diagram                        |
| -------------------------------------------------------- | ------------------------------ |
| Nhóm khách hành vi vs doanh thu vs đơn hàng              | Cluster Scatter Plot (K-means) |
| Top 20% khách hàng đóng góp bao nhiêu % doanh thu        | 80/20 Pareto Chart             |
| LTV Distribution vs loại khách hàng                      | Histogram Chart                |

📌 Mục tiêu: Ưu tiên khách hàng giá trị, phân loại khách.

---

## 🎨 Layout Structure

```
-----------------------------------------------------------
| Filters (Time | Platform | Region | Segmentation | ...) |
-----------------------------------------------------------
| KPI Cards: Total | Repeat Rate | Avg Gap | LTV | Geo... |
-----------------------------------------------------------
| Tabs: Behavior | Geo | Platform | Segmentation          |
-----------------------------------------------------------
| Insight Diagrams based on selected Tab                  |
-----------------------------------------------------------
```