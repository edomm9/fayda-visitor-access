// Login functionality
class LoginManager {
  constructor() {
    this.apiBaseUrl = "http://localhost:8000/api"
    this.init()
  }

  init() {
    this.bindEvents()
    this.checkExistingSession()
  }

  bindEvents() {
    // Login form submission
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Error alert close
    document.querySelector("#error-alert .alert-close").addEventListener("click", () => {
      this.hideError()
    })

    // Form field validation
    document.getElementById("username").addEventListener("blur", () => {
      this.validateUsername()
    })

    document.getElementById("password").addEventListener("blur", () => {
      this.validatePassword()
    })

    document.getElementById("role").addEventListener("change", () => {
      this.validateRole()
    })
  }

  checkExistingSession() {
    // Check if user is already logged in
    const token = localStorage.getItem("authToken")
    const userRole = localStorage.getItem("userRole")

    if (token && userRole) {
      // Redirect to appropriate page based on role
      this.redirectAfterLogin(userRole)
    }
  }

  async handleLogin() {
    const formData = new FormData(document.getElementById("login-form"))
    const loginData = {
      username: formData.get("username").trim(),
      password: formData.get("password"),
      role: formData.get("role"),
    }

    // Validate form
    if (!this.validateLoginForm(loginData)) {
      return
    }

    this.showLoading()

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials")
      }

      // Store authentication data
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userRole", data.role)
      localStorage.setItem("userName", data.name)

      this.hideLoading()

      // Show success message briefly before redirect
      this.showSuccess("Login successful! Redirecting...")

      setTimeout(() => {
        this.redirectAfterLogin(data.role)
      }, 1000)
    } catch (error) {
      console.error("Login error:", error)
      this.hideLoading()
      this.showError(error.message || "Login failed. Please check your credentials.")
    }
  }

  validateLoginForm(data) {
    let isValid = true

    // Validate username
    if (!data.username) {
      this.showFieldError("username-error", "Username is required")
      isValid = false
    } else if (data.username.length < 3) {
      this.showFieldError("username-error", "Username must be at least 3 characters")
      isValid = false
    } else {
      this.hideFieldError("username-error")
    }

    // Validate password
    if (!data.password) {
      this.showFieldError("password-error", "Password is required")
      isValid = false
    } else if (data.password.length < 6) {
      this.showFieldError("password-error", "Password must be at least 6 characters")
      isValid = false
    } else {
      this.hideFieldError("password-error")
    }

    // Validate role
    if (!data.role) {
      this.showFieldError("role-error", "Please select your role")
      isValid = false
    } else {
      this.hideFieldError("role-error")
    }

    return isValid
  }

  validateUsername() {
    const username = document.getElementById("username").value.trim()

    if (!username) {
      this.hideFieldError("username-error")
      return false
    }

    if (username.length < 3) {
      this.showFieldError("username-error", "Username must be at least 3 characters")
      return false
    }

    this.hideFieldError("username-error")
    return true
  }

  validatePassword() {
    const password = document.getElementById("password").value

    if (!password) {
      this.hideFieldError("password-error")
      return false
    }

    if (password.length < 6) {
      this.showFieldError("password-error", "Password must be at least 6 characters")
      return false
    }

    this.hideFieldError("password-error")
    return true
  }

  validateRole() {
    const role = document.getElementById("role").value

    if (!role) {
      this.showFieldError("role-error", "Please select your role")
      return false
    }

    this.hideFieldError("role-error")
    return true
  }

  redirectAfterLogin(role) {
    switch (role) {
      case "admin":
        window.location.href = "dashboard.html"
        break
      case "guard":
        window.location.href = "checkin.html"
        break
      default:
        window.location.href = "index.html"
    }
  }

  showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
  }

  showSuccess(message) {
    // Create a temporary success alert
    const successAlert = document.createElement("div")
    successAlert.className = "alert alert-success"
    successAlert.innerHTML = `
            <span class="alert-icon">✅</span>
            <span>${message}</span>
        `

    document.querySelector(".login-card").appendChild(successAlert)

    setTimeout(() => {
      if (successAlert.parentNode) {
        successAlert.parentNode.removeChild(successAlert)
      }
    }, 3000)
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
}

// Logout functionality
function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userRole")
  localStorage.removeItem("userName")
  window.location.href = "login.html"
}

// Check authentication for protected pages
function checkAuth(requiredRole = null) {
  const token = localStorage.getItem("authToken")
  const userRole = localStorage.getItem("userRole")

  if (!token) {
    window.location.href = "login.html"
    return false
  }

  if (requiredRole && userRole !== requiredRole && userRole !== "admin") {
    alert("Access denied. Insufficient permissions.")
    window.location.href = "index.html"
    return false
  }

  return true
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new LoginManager()
})

// Export for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LoginManager, logout, checkAuth }
}
