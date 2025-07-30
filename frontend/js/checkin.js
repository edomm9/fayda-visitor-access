// Checkin functionality
class CheckinManager {
  constructor() {
    // Use environment variable or fallback to localhost for development
    this.apiBaseUrl =
      window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000/api/"
        : "https://127.0.0.1:8000/api/"
    this.currentVisitorData = null
    this.currentStep = 1
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadHosts()
  }

  bindEvents() {
    // Fayda ID form submission
    document.getElementById("fayda-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleFaydaSubmission()
    })

    // QR Code scanning
    document.getElementById("qr-scan-btn").addEventListener("click", () => {
      this.handleQRScan()
    })

    // Identity verification
    document.getElementById("verify-confirm").addEventListener("click", () => {
      this.confirmIdentity()
    })

    document.getElementById("verify-reject").addEventListener("click", () => {
      this.rejectIdentity()
    })

    // Visit form submission
    document.getElementById("visit-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleVisitSubmission()
    })

    // Back button
    document.getElementById("back-to-verify").addEventListener("click", () => {
      this.showStep(2)
    })

    // New checkin button
    document.getElementById("new-checkin").addEventListener("click", () => {
      this.resetForm()
    })

    // Error alert close
    document.querySelector("#error-alert .alert-close").addEventListener("click", () => {
      this.hideError()
    })

    // Real-time Fayda ID validation
    document.getElementById("fayda-id").addEventListener("input", (e) => {
      this.validateFaydaId(e.target.value)
    })
  }

  async loadHosts() {
    try {
      const response = await fetch(`${this.apiBaseUrl}hosts/`)
      if (!response.ok) throw new Error("Failed to load hosts")

      const hosts = await response.json()
      const hostSelect = document.getElementById("host-select")

      // Clear existing options except the first one
      hostSelect.innerHTML = '<option value="">Select person to visit...</option>'

      hosts.forEach((host) => {
        const option = document.createElement("option")
        option.value = host.id
        option.textContent = `${host.name} - ${host.department}`
        hostSelect.appendChild(option)
      })
    } catch (error) {
      console.error("Error loading hosts:", error)
      this.showError("Failed to load host list. Please refresh the page.")
    }
  }

  validateFaydaId(value) {
    const faydaIdInput = document.getElementById("fayda-id")
    const errorElement = document.getElementById("fayda-id-error")

    // Remove non-numeric characters
    const cleanValue = value.replace(/\D/g, "")
    if (cleanValue !== value) {
      faydaIdInput.value = cleanValue
    }

    if (cleanValue.length === 0) {
      this.hideFieldError("fayda-id-error")
      return false
    }

    if (cleanValue.length !== 12) {
      this.showFieldError("fayda-id-error", "Fayda ID must be exactly 12 digits")
      return false
    }

    this.hideFieldError("fayda-id-error")
    return true
  }

  async handleFaydaSubmission() {
    const faydaId = document.getElementById("fayda-id").value.trim()

    if (!this.validateFaydaId(faydaId)) {
      return
    }

    this.showLoading()

    try {
      // Initiate OIDC flow with VeriFayda
      const response = await fetch(`${this.apiBaseUrl}oidc/initiate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fayda_id: faydaId,
          auth_type: "full", // Request full profile information
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initiate authentication")
      }

      const data = await response.json()

      // Store Fayda ID for later use
      sessionStorage.setItem("pendingFaydaId", faydaId)
      sessionStorage.setItem("oidcState", data.state)

      this.hideLoading()

      // Show user that they will be redirected
      this.showInfo("Redirecting to VeriFayda for authentication...")

      // Small delay to show the message, then redirect
      setTimeout(() => {
        window.location.href = data.auth_url
      }, 1500)
    } catch (error) {
      console.error("Error initiating OIDC:", error)
      this.hideLoading()
      this.showError("Failed to initiate visitor verification. Please try again.")
    }
  }

  handleQRScan() {
    // Simulate QR code scanning - in real implementation, this would use camera API
    this.showError("QR Code scanning feature will be implemented with camera integration.")

    // For demo purposes, you could implement a simple input dialog:
    // const qrData = prompt('Enter QR code data (for demo):');
    // if (qrData && qrData.length === 12) {
    //     document.getElementById('fayda-id').value = qrData;
    //     this.handleFaydaSubmission();
    // }
  }

  // This method would be called after successful OIDC callback
  displayVisitorInfo(visitorData) {
    this.currentVisitorData = visitorData

    // Update visitor display
    document.getElementById("visitor-photo").src = visitorData.picture || "/placeholder.svg?height=120&width=120"
    document.getElementById("visitor-photo").alt = `Photo of ${visitorData.name}`
    document.getElementById("visitor-name").textContent = visitorData.name
    document.getElementById("visitor-id").textContent = `Fayda ID: ${visitorData.fayda_id}`

    // Additional details
    const extraDetails = []
    if (visitorData.birthdate) {
      extraDetails.push(`DOB: ${new Date(visitorData.birthdate).toLocaleDateString()}`)
    }
    if (visitorData.gender) {
      extraDetails.push(`Gender: ${visitorData.gender}`)
    }
    document.getElementById("visitor-details-extra").textContent = extraDetails.join(" | ")

    this.showStep(2)
  }

  confirmIdentity() {
    if (!this.currentVisitorData) {
      this.showError("No visitor data available")
      return
    }

    this.showStep(3)
  }

  rejectIdentity() {
    this.showError("Identity verification failed. Please try again with correct information.")
    this.resetForm()
  }

  async handleVisitSubmission() {
    const hostId = document.getElementById("host-select").value
    const reason = document.getElementById("visit-reason").value.trim()

    // Validate form
    let isValid = true

    if (!hostId) {
      this.showFieldError("host-error", "Please select a person to visit")
      isValid = false
    } else {
      this.hideFieldError("host-error")
    }

    if (!reason) {
      this.showFieldError("reason-error", "Please enter a reason for the visit")
      isValid = false
    } else if (reason.length < 5) {
      this.showFieldError("reason-error", "Please provide a more detailed reason")
      isValid = false
    } else {
      this.hideFieldError("reason-error")
    }

    if (!isValid) return

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}checkin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fayda_id: this.currentVisitorData.fayda_id,
          name: this.currentVisitorData.name,
          photo_url: this.currentVisitorData.picture,
          host_id: Number.parseInt(hostId),
          reason: reason,
          additional_info: {
            birthdate: this.currentVisitorData.birthdate,
            gender: this.currentVisitorData.gender,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete check-in")
      }

      const result = await response.json()

      this.hideLoading()
      this.showSuccess(result)
    } catch (error) {
      console.error("Error completing check-in:", error)
      this.hideLoading()
      this.showError("Failed to complete check-in. Please try again.")
    }
  }

  showStep(stepNumber) {
    // Hide all cards
    document.getElementById("fayda-input-card").classList.add("hidden")
    document.getElementById("visitor-verification-card").classList.add("hidden")
    document.getElementById("visit-details-card").classList.add("hidden")
    document.getElementById("success-card").classList.add("hidden")

    // Show current step
    switch (stepNumber) {
      case 1:
        document.getElementById("fayda-input-card").classList.remove("hidden")
        break
      case 2:
        document.getElementById("visitor-verification-card").classList.remove("hidden")
        break
      case 3:
        document.getElementById("visit-details-card").classList.remove("hidden")
        break
      case 4:
        document.getElementById("success-card").classList.remove("hidden")
        break
    }

    this.currentStep = stepNumber
  }

  showSuccess(result) {
    const hostSelect = document.getElementById("host-select")
    const selectedHost = hostSelect.options[hostSelect.selectedIndex].text

    document.getElementById("success-message").textContent =
      `${this.currentVisitorData.name} has been successfully checked in to visit ${selectedHost}.`

    this.showStep(4)
  }

  resetForm() {
    // Clear form data
    document.getElementById("fayda-form").reset()
    document.getElementById("visit-form").reset()

    // Clear visitor data
    this.currentVisitorData = null

    // Hide all errors
    this.hideError()
    this.hideAllFieldErrors()

    // Return to step 1
    this.showStep(1)

    // Clear session storage
    sessionStorage.removeItem("pendingFaydaId")
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

  showInfo(message) {
    // Create info alert if it doesn't exist
    let infoAlert = document.getElementById("info-alert")
    if (!infoAlert) {
      infoAlert = document.createElement("div")
      infoAlert.id = "info-alert"
      infoAlert.className = "alert alert-info hidden"
      infoAlert.setAttribute("role", "alert")
      infoAlert.innerHTML = `
            <span class="alert-icon">ℹ️</span>
            <span id="info-message">Information</span>
            <button type="button" class="alert-close" aria-label="Close">&times;</button>
        `
      document.querySelector(".main-content").appendChild(infoAlert)

      // Add close event listener
      infoAlert.querySelector(".alert-close").addEventListener("click", () => {
        this.hideInfo()
      })
    }

    document.getElementById("info-message").textContent = message
    infoAlert.classList.remove("hidden")

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideInfo()
    }, 3000)
  }

  hideInfo() {
    const infoAlert = document.getElementById("info-alert")
    if (infoAlert) {
      infoAlert.classList.add("hidden")
    }
  }
}

// Handle OIDC callback if present
function handleOIDCCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get("code")
  const state = urlParams.get("state")
  const error = urlParams.get("error")

  if (error) {
    console.error("OIDC Error:", error)
    const checkinManager = new CheckinManager()
    checkinManager.showError("Authentication failed. Please try again.")
    return
  }

  if (code && state) {
    handleOIDCTokenExchange(code, state)
    return
  }
}

async function handleOIDCTokenExchange(code, state) {
  const checkinManager = new CheckinManager()
  checkinManager.showLoading()

  try {
    const response = await fetch(`${checkinManager.apiBaseUrl}oidc/callback/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        state: state,
      }),
    })

    if (!response.ok) {
      throw new Error("Token exchange failed")
    }

    const visitorData = await response.json()
    checkinManager.hideLoading()
    checkinManager.displayVisitorInfo(visitorData)

    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname)
  } catch (error) {
    console.error("Error in token exchange:", error)
    checkinManager.hideLoading()
    checkinManager.showError("Failed to verify visitor identity. Please try again.")
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Check if this is an OIDC callback
  if (window.location.search.includes("code=")) {
    handleOIDCCallback()
  } else {
    // Normal initialization
    new CheckinManager()
  }
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
  module.exports = CheckinManager
}

// checkin.html (bottom of file or in separate checkin.js)
window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (code && state) {
    try {
      const res = await fetch("http://localhost:8000/api/oidc/callback/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state })
      });

      const user = await res.json();
      document.getElementById("user-name").innerText = user.name;
      document.getElementById("user-photo").src = user.picture;

      // You can store the data in localStorage or a session variable
    } catch (err) {
      alert("Error fetching user data: " + err.message);
    }
  }
});
