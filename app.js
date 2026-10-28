(() => {
  "use strict";

  const STORAGE_KEY = "dailyExpenseTracker.v1";
  const CURRENCY = "INR";
  const LOCALE = "en-IN";

  const $ = (id) => document.getElementById(id);
  const form = $("expenseForm");
  const dateInput = $("expenseDate");
  const amountInput = $("expenseAmount");
  const categoryInput = $("expenseCategory");
  const descriptionInput = $("expenseDescription");
  const submitButton = $("submitButton");
  const cancelEditButton = $("cancelEditButton");
  const formHeading = $("formHeading");
  const formMessage = $("formMessage");
  const tableBody = $("expenseTableBody");
  const emptyState = $("emptyState");
  const searchInput = $("searchInput");
  const filterDate = $("filterDate");
  const filterCategory = $("filterCategory");
  const deleteDialog = $("deleteDialog");
  const confirmDeleteButton = $("confirmDeleteButton");

  let expenses = loadExpenses();
  let editingId = null;
  let pendingDeleteId = null;

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat(LOCALE, {
      day: "2-digit", month: "short", year: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function loadExpenses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.date === "string" &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        item.amount > 0 &&
        typeof item.category === "string"
      );
    } catch (error) {
      console.error("Could not read saved expenses:", error);
      return [];
    }
  }

  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      return true;
    } catch (error) {
      console.error("Could not save expenses:", error);
      showMessage("Unable to save. Your browser storage may be full or unavailable.", true);
      return false;
    }
  }

  function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.style.color = isError ? "var(--red)" : "var(--green)";
  }

  function clearForm() {
    form.reset();
    dateInput.value = localDateString();
    editingId = null;
    formHeading.textContent = "Add an expense";
    submitButton.innerHTML = '<span aria-hidden="true">＋</span> Add expense';
    cancelEditButton.classList.add("hidden");
  }

  function filteredExpenses() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const date = filterDate.value;
    const category = filterCategory.value;

    return [...expenses]
      .filter((expense) => {
        const searchable = `${expense.description} ${expense.category}`.toLocaleLowerCase();
        return (!query || searchable.includes(query)) &&
          (!date || expense.date === date) &&
          (!category || expense.category === category);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  function renderSummary() {
    const today = localDateString();
    const todayTotal = expenses
      .filter((expense) => expense.date === today)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const allTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    $("todayTotal").textContent = formatMoney(todayTotal);
    $("allTotal").textContent = formatMoney(allTotal);
    $("todayDateLabel").textContent = `For ${formatDate(today)}`;
    $("entryCount").textContent = `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`;
  }

  function createCell(className, text) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function renderTable() {
    const shown = filteredExpenses();
    tableBody.replaceChildren();

    for (const expense of shown) {
      const row = document.createElement("tr");
      row.appendChild(createCell("date-cell", formatDate(expense.date)));

      const descriptionCell = document.createElement("td");
      const name = document.createElement("span");
      name.className = "expense-name";
      name.textContent = expense.description || expense.category;
      descriptionCell.appendChild(name);

      if (expense.description && expense.description !== expense.category) {
        const description = document.createElement("span");
        description.className = "expense-description";
        description.textContent = expense.description;
        descriptionCell.replaceChildren();
        const categoryName = document.createElement("span");
        categoryName.className = "expense-name";
        categoryName.textContent = expense.category;
        descriptionCell.append(categoryName, description);
      }
      row.appendChild(descriptionCell);

      const categoryCell = document.createElement("td");
      const pill = document.createElement("span");
      pill.className = "category-pill";
      pill.textContent = expense.category;
      categoryCell.appendChild(pill);
      row.appendChild(categoryCell);

      row.appendChild(createCell("amount-cell", formatMoney(expense.amount)));

      const actionsCell = createCell("actions-column", "");
      const actions = document.createElement("div");
      actions.className = "row-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "small-action";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit expense ${expense.description || expense.category}`);
      editButton.addEventListener("click", () => startEdit(expense.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "small-action delete";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete expense ${expense.description || expense.category}`);
      deleteButton.addEventListener("click", () => askDelete(expense.id));

      actions.append(editButton, deleteButton);
      actionsCell.appendChild(actions);
      row.appendChild(actionsCell);
      tableBody.appendChild(row);
    }

    emptyState.classList.toggle("hidden", shown.length > 0);
    if (shown.length === 0) {
      emptyState.querySelector("h3").textContent = expenses.length ? "No matching expenses" : "No expenses yet";
      emptyState.querySelector("p").textContent = expenses.length
        ? "Try changing your search or filters."
        : "Add your first expense using the form above.";
    }

    $("visibleCount").textContent = `${shown.length} ${shown.length === 1 ? "expense" : "expenses"}`;
    $("filteredTotal").textContent = formatMoney(shown.reduce((sum, expense) => sum + expense.amount, 0));
  }

  function render() {
    renderSummary();
    renderTable();
  }

  function startEdit(id) {
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return;

    editingId = id;
    dateInput.value = expense.date;
    amountInput.value = String(expense.amount);
    categoryInput.value = expense.category;
    descriptionInput.value = expense.description || "";
    formHeading.textContent = "Edit expense";
    submitButton.innerHTML = '<span aria-hidden="true">✓</span> Save changes';
    cancelEditButton.classList.remove("hidden");
    showMessage("Editing the selected expense.");
    formHeading.scrollIntoView({ behavior: "smooth", block: "center" });
    amountInput.focus({ preventScroll: true });
  }

  function askDelete(id) {
    pendingDeleteId = id;
    if (typeof deleteDialog.showModal === "function") {
      deleteDialog.showModal();
    } else if (window.confirm("Delete this expense? This cannot be undone.")) {
      deleteExpense(id);
    }
  }

  function deleteExpense(id) {
    const previous = expenses;
    expenses = expenses.filter((item) => item.id !== id);
    if (!saveExpenses()) {
      expenses = previous;
      render();
      return;
    }
    if (editingId === id) clearForm();
    showMessage("Expense deleted.");
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const date = dateInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();

    if (!date) {
      showMessage("Please select an expense date.", true);
      dateInput.focus();
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Enter an amount greater than zero.", true);
      amountInput.focus();
      return;
    }

    const previous = expenses;
    if (editingId) {
      expenses = expenses.map((item) => item.id === editingId
        ? { ...item, date, amount, category, description, updatedAt: Date.now() }
        : item);
    } else {
      expenses.push({
        id: (window.crypto && typeof window.crypto.randomUUID === "function")
          ? window.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date,
        amount,
        category,
        description,
        createdAt: Date.now()
      });
    }

    if (!saveExpenses()) {
      expenses = previous;
      return;
    }

    const wasEditing = editingId !== null;
    clearForm();
    showMessage(wasEditing ? "Expense updated successfully." : "Expense added successfully.");
    render();
  });

  cancelEditButton.addEventListener("click", () => {
    clearForm();
    showMessage("Edit cancelled.");
  });

  confirmDeleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (pendingDeleteId) deleteExpense(pendingDeleteId);
    pendingDeleteId = null;
    deleteDialog.close();
  });

  deleteDialog.addEventListener("close", () => {
    pendingDeleteId = null;
  });

  [searchInput, filterDate, filterCategory].forEach((control) => {
    control.addEventListener("input", renderTable);
    control.addEventListener("change", renderTable);
  });

  $("clearFiltersButton").addEventListener("click", () => {
    searchInput.value = "";
    filterDate.value = "";
    filterCategory.value = "";
    renderTable();
  });

  $("exportButton").addEventListener("click", () => {
    if (expenses.length === 0) {
      showMessage("There are no expenses to export.", true);
      return;
    }

    const headers = ["Date", "Category", "Description", "Amount (INR)"];
    const rows = [...expenses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => [item.date, item.category, item.description || "", item.amount.toFixed(2)]);

    const csvCell = (value) => {
      // Prevent spreadsheet formula injection for text fields.
      let text = String(value ?? "");
      if (/^[\s]*[=+@]/.test(text) || /^[\s]*-/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${localDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("CSV export downloaded.");
  });

  dateInput.value = localDateString();
  render();
})();
