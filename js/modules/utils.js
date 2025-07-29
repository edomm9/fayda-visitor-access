// Utility functions for the Fayda Visitor Access System

// Error handling functions
export function showError(inputElement, message) {
  const errorElement = document.getElementById(inputElement.id + "Error")
  if (errorElement) {
    inputElement.classList.add("error")
    errorElement.textContent = message
    errorElement.style.display = "block"
    inputElement.setAttribute("aria-invalid", "true")
  }
}

export function clearError(inputElement) {
  const errorElement = document.getElementById(inputElement.id + "Error")
  if (errorElement) {
    inputElement.classList.remove("error")
    errorElement.style.display = "none"
    inputElement.setAttribute("aria-invalid", "false")
  }
}

export function clearAllErrors(form) {
  const errorInputs = form.querySelectorAll(".error")
  errorInputs.forEach((input) => clearError(input))
}

// Date and time formatting
export function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// String utilities
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str, length = 50) {
  return str.length > length ? str.substring(0, length) + "..." : str
}

// Validation utilities
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s\-$$$$]{10,}$/
  return phoneRegex.test(phone)
}

export function validateFaydaId(id) {
  const cleanId = id.replace(/\D/g, "")
  return cleanId.length === 12 && /^\d{12}$/.test(cleanId)
}

// DOM utilities
export function createElement(tag, className = "", textContent = "") {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (textContent) element.textContent = textContent
  return element
}

export function toggleClass(element, className) {
  element.classList.toggle(className)
}

// Local storage utilities
export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

export function loadFromStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error("Error loading from localStorage:", error)
    return defaultValue
  }
}

// Theme utilities
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme)
  saveToStorage("theme", theme)
}

export function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Animation utilities
export function fadeIn(element, duration = 300) {
  element.style.opacity = "0"
  element.style.display = "block"

  let start = null
  function animate(timestamp) {
    if (!start) start = timestamp
    const progress = timestamp - start
    const opacity = Math.min(progress / duration, 1)

    element.style.opacity = opacity

    if (progress < duration) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}

export function fadeOut(element, duration = 300) {
  let start = null
  const initialOpacity = Number.parseFloat(getComputedStyle(element).opacity)

  function animate(timestamp) {
    if (!start) start = timestamp
    const progress = timestamp - start
    const opacity = initialOpacity * (1 - Math.min(progress / duration, 1))

    element.style.opacity = opacity

    if (progress < duration) {
      requestAnimationFrame(animate)
    } else {
      element.style.display = "none"
    }
  }

  requestAnimationFrame(animate)
}

// Debounce utility
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Search utilities
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text

  const regex = new RegExp(`(${searchTerm})`, "gi")
  return text.replace(regex, "<mark>$1</mark>")
}

// Export utilities
export function downloadCSV(data, filename) {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

function convertToCSV(data) {
  if (!data.length) return ""

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(",")

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value
      })
      .join(","),
  )

  return [csvHeaders, ...csvRows].join("\n")
}

// Notification utilities
export function showNotification(message, type = "info", duration = 5000) {
  const notification = createElement("div", `notification notification-${type}`)
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentElement) {
      fadeOut(notification, 300)
      setTimeout(() => notification.remove(), 300)
    }
  }, duration)
}

// Print utilities
export function printElement(elementId) {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}
