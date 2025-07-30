// Host management functionality
class HostManager {
  constructor() {
    this.apiBaseUrl = "http://127.0.0.1:8000/api"
    this.currentEditId = null
    this.currentDeleteId = null
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadHosts()
  }

  bindEvents() {
    // Add host form
    document.getElementById("add-host-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleAddHost()
    })

    // Edit host form
    document.getElementById("edit-host-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleEditHost()
    })

    // Search functionality
    let searchTimeout
    document.getElementById("host-search").addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        this.filterHosts(e.target.value)
      }, 300)
    })

    // Modal controls
    document.getElementById("cancel-edit").addEventListener("click", () => {
      this.hideEditModal()
    })

    document.getElementById("cancel-delete").addEventListener("click", () => {
      this.hideDeleteModal()
    })

    document.getElementById("confirm-delete").addEventListener("click", () => {
      this.confirmDelete()
    })

    // Modal close buttons
    document.querySelectorAll(".modal-close").forEach((button) => {
      button.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal")
        modal.classList.add("hidden")
      })
    })

    // Modal backdrop clicks
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal")
        modal.classList.add("hidden")
      })
    })

    // Alert close buttons
    document.querySelectorAll(".alert-close").forEach((button) => {
      button.addEventListener("click", (e) => {
        const alert = e.target.closest(".alert")
        alert.classList.add("hidden")
      })
    })

    // Form reset
    document.querySelector('#add-host-form button[type="reset"]').addEventListener("click", () => {
      this.hideAllFieldErrors()
    })
  }

  async loadHosts() {
    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/`)
      if (!response.ok) throw new Error("Failed to load hosts")

      const hosts = await response.json()
      this.renderHosts(hosts)
    } catch (error) {
      console.error("Error loading hosts:", error)
      this.showError("Failed to load hosts. Please refresh the page.")
    } finally {
      this.hideLoading()
    }
  }

  renderHosts(hosts) {
    const tbody = document.getElementById("hosts-tbody")

    if (hosts.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        No hosts found. Add your first host using the form above.
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = hosts
      .map(
        (host) => `
            <tr data-host-id="${host.id}">
                <td>
                    <div style="font-weight: 500;">${this.escapeHtml(host.name)}</div>
                </td>
                <td>
                    <div>${this.escapeHtml(host.department)}</div>
                </td>
                <td>
                    <div style="font-weight: 500; color: #1e40af;">${host.total_visitors || 0}</div>
                </td>
                <td>
                    <div style="font-size: 0.875rem; color: #6b7280;">
                        ${host.last_visit ? new Date(host.last_visit).toLocaleDateString() : "Never"}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-active">Active</span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="button" 
                                class="btn btn-sm btn-outline"
                                onclick="hostManager.editHost('${host.id}')"
                                title="Edit host">
                            ✏️ Edit
                        </button>
                        <button type="button" 
                                class="btn btn-sm btn-danger"
                                onclick="hostManager.deleteHost('${host.id}', '${this.escapeHtml(host.name)}')"
                                title="Delete host">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  filterHosts(searchTerm) {
    const rows = document.querySelectorAll("#hosts-tbody tr[data-host-id]")
    const term = searchTerm.toLowerCase()

    rows.forEach((row) => {
      const name = row.cells[0].textContent.toLowerCase()
      const department = row.cells[1].textContent.toLowerCase()

      if (name.includes(term) || department.includes(term)) {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    })
  }

  async handleAddHost() {
    const formData = new FormData(document.getElementById("add-host-form"))
    const hostData = {
      name: formData.get("name").trim(),
      department: formData.get("department").trim(),
    }

    // Validate form
    if (!this.validateHostForm(hostData, "add")) {
      return
    }

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hostData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add host")
      }

      const newHost = await response.json()

      this.hideLoading()
      this.showSuccess("Host added successfully")
      document.getElementById("add-host-form").reset()
      this.hideAllFieldErrors()
      this.loadHosts()

      announceToScreenReader(`Host ${newHost.name} added successfully`)
    } catch (error) {
      console.error("Error adding host:", error)
      this.hideLoading()
      this.showError(error.message || "Failed to add host. Please try again.")
    }
  }

  async editHost(hostId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/${hostId}/`)
      if (!response.ok) throw new Error("Failed to load host details")

      const host = await response.json()

      // Populate edit form
      document.getElementById("edit-host-id").value = host.id
      document.getElementById("edit-host-name").value = host.name
      document.getElementById("edit-host-department").value = host.department

      this.currentEditId = hostId
      this.showEditModal()
    } catch (error) {
      console.error("Error loading host for edit:", error)
      this.showError("Failed to load host details.")
    }
  }

  async handleEditHost() {
    const formData = new FormData(document.getElementById("edit-host-form"))
    const hostData = {
      name: formData.get("name").trim(),
      department: formData.get("department").trim(),
    }

    // Validate form
    if (!this.validateHostForm(hostData, "edit")) {
      return
    }

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/${this.currentEditId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hostData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update host")
      }

      const updatedHost = await response.json()

      this.hideLoading()
      this.hideEditModal()
      this.showSuccess("Host updated successfully")
      this.loadHosts()

      announceToScreenReader(`Host ${updatedHost.name} updated successfully`)
    } catch (error) {
      console.error("Error updating host:", error)
      this.hideLoading()
      this.showError(error.message || "Failed to update host. Please try again.")
    }
  }

  deleteHost(hostId, hostName) {
    this.currentDeleteId = hostId
    document.getElementById("delete-host-name").textContent = hostName
    this.showDeleteModal()
  }

  async confirmDelete() {
    if (!this.currentDeleteId) return

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/${this.currentDeleteId}/`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete host")
      }

      this.hideLoading()
      this.hideDeleteModal()
      this.showSuccess("Host deleted successfully")
      this.loadHosts()

      announceToScreenReader("Host deleted successfully")
    } catch (error) {
      console.error("Error deleting host:", error)
      this.hideLoading()
      this.showError(error.message || "Failed to delete host. Please try again.")
    }
  }

  validateHostForm(data, formType) {
    let isValid = true
    const prefix = formType === "edit" ? "edit-" : ""

    // Validate name
    if (!data.name) {
      this.showFieldError(`${prefix}name-error`, "Host name is required")
      isValid = false
    } else if (data.name.length < 2) {
      this.showFieldError(`${prefix}name-error`, "Host name must be at least 2 characters")
      isValid = false
    } else {
      this.hideFieldError(`${prefix}name-error`)
    }

    // Validate department
    if (!data.department) {
      this.showFieldError(`${prefix}department-error`, "Department is required")
      isValid = false
    } else if (data.department.length < 2) {
      this.showFieldError(`${prefix}department-error`, "Department must be at least 2 characters")
      isValid = false
    } else {
      this.hideFieldError(`${prefix}department-error`)
    }

    return isValid
  }

  showEditModal() {
    document.getElementById("edit-host-modal").classList.remove("hidden")
    document.getElementById("edit-host-name").focus()
  }

  hideEditModal() {
    document.getElementById("edit-host-modal").classList.add("hidden")
    this.currentEditId = null
    this.hideAllFieldErrors()
  }

  showDeleteModal() {
    document.getElementById("delete-host-modal").classList.remove("hidden")
  }

  hideDeleteModal() {
    document.getElementById("delete-host-modal").classList.add("hidden")
    this.currentDeleteId = null
  }

  showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
  }

  showSuccess(message) {
    document.getElementById("success-message").textContent = message
    document.getElementById("success-alert").classList.remove("hidden")

    setTimeout(() => {
      document.getElementById("success-alert").classList.add("hidden")
    }, 5000)
  }

  showError(message) {
    document.getElementById("error-message").textContent = message
    document.getElementById("error-alert").classList.remove("hidden")

    setTimeout(() => {
      document.getElementById("error-alert").classList.add("hidden")
    }, 5000)
  }

  showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.textContent = message
      errorElement.classList.add("show")
    }
  }

  hideFieldError(errorId) {
    const errorElement = document.getElementById(errorId)
    if (errorElement) {
      errorElement.classList.remove("show")
    }
  }

  hideAllFieldErrors() {
    const errorElements = document.querySelectorAll(".form-error")
    errorElements.forEach((element) => {
      element.classList.remove("show")
    })
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Global host manager instance for onclick handlers
let hostManager

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  hostManager = new HostManager()
})

// Utility functions for accessibility
function announceToScreenReader(message) {
  const announcement = document.createElement("div")
  announcement.setAttribute("aria-live", "polite")
  announcement.setAttribute("aria-atomic", "true")
  announcement.className = "sr-only"
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = HostManager
}
