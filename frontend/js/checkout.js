// Checkout functionality
class CheckoutManager {
  constructor() {
    this.apiBaseUrl = "http://127.0.0.1:8000/api"
    this.currentVisitData = null
    this.init()
  }

  init() {
    this.bindEvents()
  }

  bindEvents() {
    // Checkout form submission
    document.getElementById("checkout-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleCheckoutSubmission()
    })

    // Confirm checkout
    document.getElementById("confirm-checkout").addEventListener("click", () => {
      this.confirmCheckout()
    })

    // Cancel checkout
    document.getElementById("cancel-checkout").addEventListener("click", () => {
      this.cancelCheckout()
    })

    // New checkout button
    document.getElementById("new-checkout").addEventListener("click", () => {
      this.resetForm()
    })

    // Error alert close
    document.querySelector("#error-alert .alert-close").addEventListener("click", () => {
      this.hideError()
    })

    // Real-time Fayda ID validation
    document.getElementById("checkout-fayda-id").addEventListener("input", (e) => {
      this.validateFaydaId(e.target.value)
    })
  }

  validateFaydaId(value) {
    const faydaIdInput = document.getElementById("checkout-fayda-id")
    const errorElement = document.getElementById("checkout-fayda-error")

    // Remove non-numeric characters
    const cleanValue = value.replace(/\D/g, "")
    if (cleanValue !== value) {
      faydaIdInput.value = cleanValue
    }

    if (cleanValue.length === 0) {
      this.hideFieldError("checkout-fayda-error")
      return false
    }

    if (cleanValue.length !== 12) {
      this.showFieldError("checkout-fayda-error", "Fayda ID must be exactly 12 digits")
      return false
    }

    this.hideFieldError("checkout-fayda-error")
    return true
  }

  async handleCheckoutSubmission() {
    const faydaId = document.getElementById("checkout-fayda-id").value.trim()

    if (!this.validateFaydaId(faydaId)) {
      return
    }

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/checkout/find-active/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fayda_id: faydaId }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No active visit found for this Fayda ID")
        }
        throw new Error("Failed to find active visit")
      }

      const visitData = await response.json()
      this.currentVisitData = visitData

      this.hideLoading()
      this.displayVisitConfirmation(visitData)
    } catch (error) {
      console.error("Error finding active visit:", error)
      this.hideLoading()
      this.showError(error.message || "Failed to find active visit. Please verify the Fayda ID.")
    }
  }

  displayVisitConfirmation(visitData) {
    // Update visitor information
    document.getElementById("checkout-visitor-photo").src = visitData.photo_url || "/placeholder.svg?height=60&width=60"
    document.getElementById("checkout-visitor-photo").alt = `Photo of ${visitData.name}`
    document.getElementById("checkout-visitor-name").textContent = visitData.name
    document.getElementById("checkout-visitor-id").textContent = `Fayda ID: ${visitData.fayda_id}`

    // Update visit information
    document.getElementById("checkout-host").textContent = visitData.host_name
    document.getElementById("checkout-checkin-time").textContent = new Date(visitData.checkin_time).toLocaleString()
    document.getElementById("checkout-reason").textContent = visitData.reason

    // Show confirmation card
    document.getElementById("checkout-input-card").classList.add("hidden")
    document.getElementById("visit-confirmation-card").classList.remove("hidden")

    announceToScreenReader(`Found active visit for ${visitData.name}. Please confirm checkout.`)
  }

  async confirmCheckout() {
    if (!this.currentVisitData) {
      this.showError("No visit data available")
      return
    }

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: this.currentVisitData.id,
          fayda_id: this.currentVisitData.fayda_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete checkout")
      }

      const result = await response.json()

      this.hideLoading()
      this.showSuccess(result)
    } catch (error) {
      console.error("Error completing checkout:", error)
      this.hideLoading()
      this.showError("Failed to complete checkout. Please try again.")
    }
  }

  cancelCheckout() {
    this.resetForm()
    announceToScreenReader("Checkout cancelled")
  }

  showSuccess(result) {
    const checkinTime = new Date(this.currentVisitData.checkin_time)
    const checkoutTime = new Date(result.checkout_time)
    const duration = this.calculateDuration(checkinTime, checkoutTime)

    document.getElementById("checkout-success-message").textContent =
      `${this.currentVisitData.name} has been successfully checked out.`
    document.getElementById("visit-duration").textContent = duration

    // Hide confirmation card and show success
    document.getElementById("visit-confirmation-card").classList.add("hidden")
    document.getElementById("checkout-success-card").classList.remove("hidden")

    announceToScreenReader(`Checkout successful. Visit duration: ${duration}`)
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

  resetForm() {
    // Clear form data
    document.getElementById("checkout-form").reset()

    // Clear visit data
    this.currentVisitData = null

    // Hide all errors
    this.hideError()
    this.hideAllFieldErrors()

    // Show input card, hide others
    document.getElementById("checkout-input-card").classList.remove("hidden")
    document.getElementById("visit-confirmation-card").classList.add("hidden")
    document.getElementById("checkout-success-card").classList.add("hidden")

    // Focus on input
    document.getElementById("checkout-fayda-id").focus()
  }

  showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
  }

  showError(message) {
    document.getElementById("error-message").textContent = message
    document.getElementById("error-alert").classList.remove("hidden")

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideError()
    }, 5000)
  }

  hideError() {
    document.getElementById("error-alert").classList.add("hidden")
  }

  showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId)
    errorElement.textContent = message
    errorElement.classList.add("show")
  }

  hideFieldError(errorId) {
    const errorElement = document.getElementById(errorId)
    errorElement.classList.remove("show")
  }

  hideAllFieldErrors() {
    const errorElements = document.querySelectorAll(".form-error")
    errorElements.forEach((element) => {
      element.classList.remove("show")
    })
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new CheckoutManager()
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
  module.exports = CheckoutManager
}
