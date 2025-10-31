// localStorage helper for demo persistence
export class LocalStorageManager {
  private static STORAGE_KEY = 'fieldservice_tickets'
  
  static saveTickets(tickets: any[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tickets))
      console.log('✅ Data saved to localStorage')
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error)
    }
  }
  
  static loadTickets(): any[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        console.log('✅ Data loaded from localStorage')
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error)
      return null
    }
  }
  
  static clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('✅ localStorage cleared')
  }
  
  static hasData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null
  }
}