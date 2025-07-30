// Application state management
class AppState {
  constructor() {
    this.currentUser = null
    this.visitors = this.loadVisitors()
    this.hosts = this.loadHosts()
    this.settings = this.loadSettings()
  }

  // User management
  login(username, password) {
    // Mock authentication - in real app, this would be an API call
    const users = {
      admin: "admin123",
      guard: "guard123",
      security: "security123",
    }

    if (users[username] && users[username] === password) {
      this.currentUser = {
        username,
        role: username === "admin" ? "admin" : "guard",
        loginTime: new Date().toISOString(),
      }
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser))
      return true
    }
    return false
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
  }

  getCurrentUser() {
    if (!this.currentUser) {
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        this.currentUser = JSON.parse(stored)
      }
    }
    return this.currentUser
  }

  requireAuth() {
    if (!this.getCurrentUser()) {
      window.location.href = "index.html"
      return false
    }
    return true
  }

  // Visitor management
  addVisitor(visitorData) {
    const visitor = {
      id: Date.now().toString(),
      faydaId: visitorData.faydaId,
      fullName: visitorData.fullName,
      personToVisit: visitorData.personToVisit,
      reasonForVisit: visitorData.reasonForVisit,
      checkInTime: new Date().toISOString(),
      status: "checked-in",
    }

    this.visitors.unshift(visitor)
    this.saveVisitors()
    return visitor
  }

  checkOutVisitor(faydaId) {
    const visitor = this.visitors.find((v) => v.faydaId === faydaId && v.status === "checked-in")

    if (visitor) {
      visitor.status = "checked-out"
      visitor.checkOutTime = new Date().toISOString()
      this.saveVisitors()
      return visitor
    }

    return null
  }

  // Add method to get checked-in visitor by Fayda ID
  getCheckedInVisitor(faydaId) {
    return this.visitors.find((v) => v.faydaId === faydaId && v.status === "checked-in")
  }

  getVisitors() {
    return this.visitors
  }

  searchVisitors(query) {
    const lowercaseQuery = query.toLowerCase()
    return this.visitors.filter(
      (visitor) =>
        visitor.fullName.toLowerCase().includes(lowercaseQuery) ||
        visitor.faydaId.includes(query) ||
        visitor.personToVisit.toLowerCase().includes(lowercaseQuery) ||
        visitor.reasonForVisit.toLowerCase().includes(lowercaseQuery),
    )
  }

  filterVisitorsByDate(date) {
    const targetDate = new Date(date).toDateString()
    return this.visitors.filter((visitor) => new Date(visitor.checkInTime).toDateString() === targetDate)
  }

  getVisitorStats() {
    const today = new Date().toDateString()
    const todayVisitors = this.visitors.filter((visitor) => new Date(visitor.checkInTime).toDateString() === today)

    const hostCounts = {}
    this.visitors.forEach((visitor) => {
      hostCounts[visitor.personToVisit] = (hostCounts[visitor.personToVisit] || 0) + 1
    })

    const mostVisitedHost = Object.keys(hostCounts).reduce((a, b) => (hostCounts[a] > hostCounts[b] ? a : b), "")

    return {
      totalToday: todayVisitors.length,
      totalAllTime: this.visitors.length,
      mostVisitedHost: mostVisitedHost || "N/A",
      recentVisitors: this.visitors.slice(0, 5),
    }
  }

  // Host management
  getHosts() {
    return this.hosts
  }

  addHost(hostName) {
    if (!this.hosts.includes(hostName)) {
      this.hosts.push(hostName)
      this.saveHosts()
    }
  }

  removeHost(hostName) {
    this.hosts = this.hosts.filter((host) => host !== hostName)
    this.saveHosts()
  }

  // Settings management
  getSettings() {
    return this.settings
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    this.applyTheme()
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.settings.theme)
    // Also apply to body for immediate effect
    document.body.setAttribute("data-theme", this.settings.theme)
  }

  // Data persistence
  loadVisitors() {
    const stored = localStorage.getItem("visitors")
    return stored ? JSON.parse(stored) : []
  }

  saveVisitors() {
    localStorage.setItem("visitors", JSON.stringify(this.visitors))
  }

  loadHosts() {
    const stored = localStorage.getItem("hosts")
    return stored
      ? JSON.parse(stored)
      : [
          "Dr. Ahmed Hassan - Medical Director",
          "Ms. Fatima Al-Zahra - HR Manager",
          "Mr. Omar Khalil - IT Director",
          "Dr. Layla Mansour - Chief of Staff",
          "Mr. Yusuf Ibrahim - Finance Manager",
        ]
  }

  saveHosts() {
    localStorage.setItem("hosts", JSON.stringify(this.hosts))
  }

  loadSettings() {
    const stored = localStorage.getItem("settings")
    const defaultSettings = {
      theme: "light",
      autoLogout: 30,
      showNotifications: true,
    }

    this.settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    return this.settings
  }

  saveSettings() {
    localStorage.setItem("settings", JSON.stringify(this.settings))
  }

  // Add method to initialize theme on page load
  initializeTheme() {
    const settings = this.getSettings()
    this.applyTheme()
  }
}

// Update the Fayda ID database to include photos
export const faydaDatabase = {
  123456789012: {
    name: "Ahmed Mohammed Ali",
    photo: "/placeholder.svg?height=120&width=120&text=Ahmed+M",
  },
  987654321098: {
    name: "Fatima Hassan Omar",
    photo: "/placeholder.svg?height=120&width=120&text=Fatima+H",
  },
  456789123456: {
    name: "Omar Khalil Ibrahim",
    photo: "/placeholder.svg?height=120&width=120&text=Omar+K",
  },
  789123456789: {
    name: "Layla Mansour Said",
    photo: "/placeholder.svg?height=120&width=120&text=Layla+M",
  },
  321654987321: {
    name: "Yusuf Ahmed Hassan",
    photo: "/placeholder.svg?height=120&width=120&text=Yusuf+A",
  },
  654321098765: {
    name: "Nour Abdullah Mahmoud",
    photo: "/placeholder.svg?height=120&width=120&text=Nour+A",
  },
  111222333444: {
    name: "Hassan Ali Mohammed",
    photo: "/placeholder.svg?height=120&width=120&text=Hassan+A",
  },
  555666777888: {
    name: "Amina Khalil Omar",
    photo: "/placeholder.svg?height=120&width=120&text=Amina+K",
  },
  999888777666: {
    name: "Mahmoud Hassan Ali",
    photo: "/placeholder.svg?height=120&width=120&text=Mahmoud+H",
  },
  147258369012: {
    name: "Zeinab Omar Khalil",
    photo: "/placeholder.svg?height=120&width=120&text=Zeinab+O",
  },
}

// Create global app instance
export const app = new AppState()

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  app.initializeTheme()
})
