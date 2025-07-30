// Dashboard functionality
class DashboardManager {
  constructor() {
    this.apiBaseUrl = "http://127.0.0.1:8000/api"
    this.currentPage = 1
    this.pageSize = 10
    this.currentFilters = {}
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadDashboardData()
    this.loadHosts()
  }

  bindEvents() {
    // Filter controls
    document.getElementById("apply-filters").addEventListener("click", () => {
      this.applyFilters()
    })

    document.getElementById("reset-filters").addEventListener("click", () => {
      this.resetFilters()
    })

    document.getElementById("export-data").addEventListener("click", () => {
      this.exportData()
    })

    // Search input with debounce
    let searchTimeout
    document.getElementById("search-input").addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        this.currentFilters.search = e.target.value
        this.loadVisitorLogs()
      }, 500)
    })

    // Pagination
    document.getElementById("prev-page").addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.loadVisitorLogs()
      }
    })

    document.getElementById("next-page").addEventListener("click", () => {
      this.currentPage++
      this.loadVisitorLogs()
    })

    // Error alert close
    document.querySelector("#error-alert .alert-close").addEventListener("click", () => {
      this.hideError()
    })

    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadDashboardData()
    }, 30000)
  }

  async loadDashboardData() {
    try {
      // Load statistics
      await this.loadStatistics()

      // Load visitor logs
      await this.loadVisitorLogs()
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      this.showError("Failed to load dashboard data. Please refresh the page.")
    }
  }

  async loadStatistics() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/dashboard/stats/`)
      if (!response.ok) throw new Error("Failed to load statistics")

      const stats = await response.json()

      // Update statistics display
      document.getElementById("total-visitors").textContent = stats.total_visitors_today || 0
      document.getElementById("active-visits").textContent = stats.active_visits || 0
      document.getElementById("avg-duration").textContent = stats.avg_duration || "0m"
      document.getElementById("peak-hour").textContent = stats.peak_hour || "-"
    } catch (error) {
      console.error("Error loading statistics:", error)
      // Don't show error for stats, just log it
    }
  }

  async loadHosts() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/hosts/`)
      if (!response.ok) throw new Error("Failed to load hosts")

      const hosts = await response.json()
      const hostFilter = document.getElementById("host-filter")

      // Clear existing options except "All Hosts"
      hostFilter.innerHTML = '<option value="all">All Hosts</option>'

      hosts.forEach((host) => {
        const option = document.createElement("option")
        option.value = host.id
        option.textContent = `${host.name} - ${host.department}`
        hostFilter.appendChild(option)
      })
    } catch (error) {
      console.error("Error loading hosts:", error)
    }
  }

  async loadVisitorLogs() {
    const tbody = document.getElementById("logs-tbody")
    tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="loading-spinner"></div>
                    Loading visitor logs...
                </td>
            </tr>
        `

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        page_size: this.pageSize,
        ...this.currentFilters,
      })

      const response = await fetch(`${this.apiBaseUrl}/visitor-logs/?${params}`)
      if (!response.ok) throw new Error("Failed to load visitor logs")

      const data = await response.json()

      this.renderVisitorLogs(data.results)
      this.updatePagination(data)
    } catch (error) {
      console.error("Error loading visitor logs:", error)
      tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <span style="color: #dc2626;">Failed to load visitor logs</span>
                    </td>
                </tr>
            `
    }
  }

  renderVisitorLogs(logs) {
    const tbody = document.getElementById("logs-tbody")

    if (logs.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        No visitor logs found for the selected criteria.
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = logs
      .map(
        (log) => `
            <tr>
                <td>
                    <img src="${log.photo_url || "/placeholder.svg?height=40&width=40"}" 
                         alt="Visitor photo" 
                         class="photo-display-small"
                         style="width: 40px; height: 40px;">
                </td>
                <td>
                    <div style="font-weight: 500;">${this.escapeHtml(log.name)}</div>
                </td>
                <td>
                    <code style="font-size: 0.75rem;">${log.fayda_id}</code>
                </td>
                <td>
                    <div>${this.escapeHtml(log.host_name)}</div>
                    <div style="font-size: 0.75rem; color: #6b7280;">${this.escapeHtml(log.host_department)}</div>
                </td>
                <td>
                    <div>${new Date(log.checkin_time).toLocaleDateString()}</div>
                    <div style="font-size: 0.75rem; color: #6b7280;">
                        ${new Date(log.checkin_time).toLocaleTimeString()}
                    </div>
                </td>
                <td>
                    ${
                      log.checkout_time
                        ? `
                        <div>${new Date(log.checkout_time).toLocaleDateString()}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">
                            ${new Date(log.checkout_time).toLocaleTimeString()}
                        </div>
                    `
                        : '<span style="color: #6b7280;">-</span>'
                    }
                </td>
                <td>
                    ${
                      log.checkout_time
                        ? this.calculateDuration(new Date(log.checkin_time), new Date(log.checkout_time))
                        : '<span style="color: #6b7280;">Ongoing</span>'
                    }
                </td>
                <td>
                    <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" 
                         title="${this.escapeHtml(log.reason)}">
                        ${this.escapeHtml(log.reason)}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${log.checkout_time ? "status-completed" : "status-active"}">
                        ${log.checkout_time ? "Checked Out" : "Inside"}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        ${
                          !log.checkout_time
                            ? `
                            <button type="button" 
                                    class="btn btn-sm btn-outline"
                                    onclick="dashboard.forceCheckout('${log.id}')"
                                    title="Force checkout">
                                Checkout
                            </button>
                        `
                            : ""
                        }
                        <button type="button" 
                                class="btn btn-sm btn-outline"
                                onclick="dashboard.viewDetails('${log.id}')"
                                title="View details">
                            View
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")
  }

  updatePagination(data) {
    const totalRecords = data.count
    const totalPages = Math.ceil(totalRecords / this.pageSize)
    const startRecord = (this.currentPage - 1) * this.pageSize + 1
    const endRecord = Math.min(this.currentPage * this.pageSize, totalRecords)

    document.getElementById("showing-start").textContent = startRecord
    document.getElementById("showing-end").textContent = endRecord
    document.getElementById("total-records").textContent = totalRecords
    document.getElementById("page-info").textContent = `Page ${this.currentPage} of ${totalPages}`

    // Update pagination buttons
    document.getElementById("prev-page").disabled = this.currentPage <= 1
    document.getElementById("next-page").disabled = this.currentPage >= totalPages
  }

  applyFilters() {
    this.currentFilters = {
      date_range: document.getElementById("date-filter").value,
      status: document.getElementById("status-filter").value,
      host: document.getElementById("host-filter").value,
      search: document.getElementById("search-input").value,
    }

    // Remove empty filters
    Object.keys(this.currentFilters).forEach((key) => {
      if (!this.currentFilters[key] || this.currentFilters[key] === "all") {
        delete this.currentFilters[key]
      }
    })

    this.currentPage = 1
    this.loadVisitorLogs()

    announceToScreenReader("Filters applied, loading updated results")
  }

  resetFilters() {
    document.getElementById("date-filter").value = "today"
    document.getElementById("status-filter").value = "all"
    document.getElementById("host-filter").value = "all"
    document.getElementById("search-input").value = ""

    this.currentFilters = {}
    this.currentPage = 1
    this.loadVisitorLogs()

    announceToScreenReader("Filters reset")
  }

  async exportData() {
    try {
      const params = new URLSearchParams({
        export: "csv",
        ...this.currentFilters,
      })

      const response = await fetch(`${this.apiBaseUrl}/visitor-logs/export/?${params}`)
      if (!response.ok) throw new Error("Failed to export data")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `visitor-logs-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      announceToScreenReader("Data export started")
    } catch (error) {
      console.error("Error exporting data:", error)
      this.showError("Failed to export data. Please try again.")
    }
  }

  async forceCheckout(visitId) {
    if (!confirm("Are you sure you want to force checkout this visitor?")) {
      return
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/checkout/force/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visit_id: visitId }),
      })

      if (!response.ok) throw new Error("Failed to force checkout")

      this.loadVisitorLogs()
      this.loadStatistics()

      announceToScreenReader("Visitor checked out successfully")
    } catch (error) {
      console.error("Error forcing checkout:", error)
      this.showError("Failed to checkout visitor. Please try again.")
    }
  }

  viewDetails(visitId) {
    // This would open a modal or navigate to a details page
    // For now, just show an alert
    alert(`View details for visit ID: ${visitId}`)
  }

  calculateDuration(checkinTime, checkoutTime) {
    const diffMs = checkoutTime - checkinTime
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  showError(message) {
    document.getElementById("error-message").textContent = message
    document.getElementById("error-alert").classList.remove("hidden")

    setTimeout(() => {
      this.hideError()
    }, 5000)
  }

  hideError() {
    document.getElementById("error-alert").classList.add("hidden")
  }
}

// Global dashboard instance for onclick handlers
let dashboard

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  dashboard = new DashboardManager()
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
  module.exports = DashboardManager
}
