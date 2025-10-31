# CSV Export Feature Testing Checklist

## 🚀 **Setup Instructions**

1. **Start Backend Server:**
   ```bash
   cd server
   node api-server.js
   ```

2. **Start Frontend Development Server:**
   ```bash
   npm run dev
   ```

3. **Open Application:**
   - Navigate to `http://localhost:5175` in your browser
   - Login with your credentials

---

## 📋 **Testing Checklist**

### **1. 🎫 Tickets Tab Export**
- [ ] Navigate to the **Tickets** tab
- [ ] Verify the **"📊 Export CSV"** button appears next to the Reset button in the filters section
- [ ] **Test with no filters:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `service-tickets_YYYY-MM-DD.csv`
  - [ ] Open file and verify all ticket data is exported with proper headers
- [ ] **Test with filters applied:**
  - [ ] Apply filters (customer, site, status, priority, date range)
  - [ ] Click Export CSV
  - [ ] Verify only filtered tickets are exported
- [ ] **Verify data format:**
  - [ ] Priority shows emojis (🔴 Critical, 🟠 High, 🟡 Normal, 🔵 Low)
  - [ ] Status shows emojis (🆕 Open, ⚡ In Progress, ✅ Complete, etc.)
  - [ ] Dates are formatted properly
  - [ ] Site addresses are included

### **2. 🔒 Closed Tickets Tab Export**
- [ ] Navigate to the **Closed** tab
- [ ] Verify the **"📊 Export CSV"** button appears in the Sort By section
- [ ] **Test export functionality:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `closed-tickets_YYYY-MM-DD.csv`
  - [ ] Open file and verify closed ticket data is exported
- [ ] **Test with filters:**
  - [ ] Use search, status, priority filters
  - [ ] Use sort options (Closed Date, Duration, Priority)
  - [ ] Export and verify filtered data
- [ ] **Verify special data:**
  - [ ] Resolution Duration is calculated and shown (e.g., "2d 5h" or "8h")
  - [ ] Closed Date is properly formatted
  - [ ] Status and priority have emojis

### **3. 👥 Customers Tab Export**
- [ ] Navigate to the **Customers** tab
- [ ] Verify the **"📊 Export CSV"** button appears next to the search bar
- [ ] **Test export functionality:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `customers_YYYY-MM-DD.csv`
  - [ ] Open file and verify customer data is exported
- [ ] **Test with search:**
  - [ ] Use search bar to filter customers
  - [ ] Export and verify only matching customers are included
- [ ] **Verify data completeness:**
  - [ ] Customer ID, Name, Contact, Email, Phone, Address, Notes are included

### **4. 🏢 Sites Tab Export**
- [ ] Navigate to the **Sites** tab
- [ ] Verify the **"📊 Export CSV"** button appears next to the customer filter
- [ ] **Test export functionality:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `sites_YYYY-MM-DD.csv`
  - [ ] Open file and verify site data is exported
- [ ] **Test with filters:**
  - [ ] Use search bar and customer filter
  - [ ] Export and verify filtered data
- [ ] **Verify data completeness:**
  - [ ] Site ID, Customer, Site Name, Address, City, State, ZIP, Contact info, Geo Location, Notes

### **5. 📄 Licenses Tab Export**
- [ ] Navigate to the **Licenses** tab
- [ ] Verify the **"📊 Export CSV"** button appears in the filter bar
- [ ] **Test export functionality:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `software-licenses_YYYY-MM-DD.csv`
  - [ ] Open file and verify license data is exported
- [ ] **Test with filters:**
  - [ ] Use search, customer, site, status, vendor, and type filters
  - [ ] Export and verify filtered data
- [ ] **Verify calculated data:**
  - [ ] Status is calculated based on expiration dates (Active, Expiring Soon, Expired)
  - [ ] Expiration dates are properly formatted
  - [ ] All license details are included

### **6. 👤 Users Tab Export** *(Admin only)*
- [ ] Navigate to the **Users** tab (requires Admin role)
- [ ] Verify the **"📊 Export CSV"** button appears next to "Add New User" button
- [ ] **Test export functionality:**
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `users_YYYY-MM-DD.csv`
  - [ ] Open file and verify user data is exported
- [ ] **Verify data format:**
  - [ ] User ID, Username, Full Name, Email, Role, Vendor/Company included
  - [ ] Status shows "Active" or "Inactive" instead of true/false

### **7. 📋 Activity Log Tab Export** *(Admin only)*
- [ ] Navigate to the **Activity** tab (requires Admin role)
- [ ] Verify the **"📊 Export CSV"** button appears in the action buttons section
- [ ] **Test export functionality:**
  - [ ] Apply filters (search, time range, action, user)
  - [ ] Click Export CSV button
  - [ ] Verify file downloads as `activity-log_YYYY-MM-DD.csv`
  - [ ] Open file and verify activity data is exported
- [ ] **Test edge cases:**
  - [ ] Button should be disabled when no activities are loaded
  - [ ] Button should be disabled during loading
- [ ] **Verify data completeness:**
  - [ ] ID, Timestamp, Username, Action, Details, IP Address, User Agent

---

## 🔍 **General Testing Points**

### **File Download Behavior:**
- [ ] All files download automatically without requiring save dialog
- [ ] Filenames include current date (YYYY-MM-DD format)
- [ ] Files open correctly in Excel/Google Sheets/LibreOffice

### **Data Integrity:**
- [ ] No data corruption or encoding issues
- [ ] Special characters (commas, quotes, newlines) are properly escaped
- [ ] Unicode characters display correctly
- [ ] Empty fields show as blank (not "undefined" or "null")

### **Button Behavior:**
- [ ] Export buttons have consistent styling across all tabs
- [ ] Tooltips show the correct count of items being exported
- [ ] Buttons are appropriately positioned in each tab's layout
- [ ] Icons (📊) display correctly

### **Performance:**
- [ ] Large datasets export without freezing the browser
- [ ] Export completes within reasonable time
- [ ] No console errors during export

### **Error Handling:**
- [ ] Empty datasets show appropriate message instead of downloading empty file
- [ ] Network errors are handled gracefully

---

## ✅ **Expected Results**

If all tests pass, you should have:
- **8 functional CSV export buttons** across different tabs
- **Properly formatted CSV files** with appropriate headers
- **Filtered data export** that respects current view filters
- **Consistent user experience** across all export features
- **Excel-compatible files** with proper UTF-8 encoding

---

## 🐛 **Common Issues to Check**

1. **Server Connection:** Ensure both backend (port 5001) and frontend (port 5175) servers are running
2. **Permissions:** Some features require Admin role (Users, Activity Log)
3. **Data Availability:** Ensure sample data exists in each section
4. **Browser Compatibility:** Test in Chrome, Firefox, Edge
5. **File Downloads:** Check browser download settings if files don't download

---

## 📝 **Test Results Template**

Copy this template to track your testing:

```
✅ Tickets Export: [PASS/FAIL] - Notes: 
✅ Closed Tickets Export: [PASS/FAIL] - Notes: 
✅ Customers Export: [PASS/FAIL] - Notes: 
✅ Sites Export: [PASS/FAIL] - Notes: 
✅ Licenses Export: [PASS/FAIL] - Notes: 
✅ Users Export: [PASS/FAIL] - Notes: 
✅ Activity Log Export: [PASS/FAIL] - Notes: 

Overall CSV Export Implementation: [PASS/FAIL]
```