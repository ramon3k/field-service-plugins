// src/api/SharePointAPI.ts
import { SharePointService } from '../services/SharePointService';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, Customer, Site } from '../types';

class SharePointAPI {
  private sharePointService: SharePointService | null = null;

  private getSharePointService(): SharePointService {
    const { graphClient } = useAuth();
    if (!graphClient) {
      throw new Error('Not authenticated with Microsoft Graph');
    }
    
    if (!this.sharePointService) {
      this.sharePointService = new SharePointService(graphClient, 'default-site-id');
    }
    
    return this.sharePointService;
  }

  async listTickets(): Promise<Ticket[]> {
    const service = this.getSharePointService();
    return await service.getTickets();
  }

  async createTicket(ticket: Partial<Ticket>): Promise<Ticket> {
    const service = this.getSharePointService();
    
    // Generate a unique ticket ID if not provided
    if (!ticket.TicketID) {
      const timestamp = Date.now();
      ticket.TicketID = `TKT-${timestamp}`;
    }

    // Set default values
    const newTicket = {
      ...ticket,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      Status: ticket.Status || 'New',
      Priority: ticket.Priority || 'Normal'
    };

    return await service.createTicket(newTicket);
  }

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    const service = this.getSharePointService();
    
    const updatedTicket = {
      ...updates,
      UpdatedAt: new Date().toISOString()
    };

    return await service.updateTicket(ticketId, updatedTicket);
  }

  async listCustomers(): Promise<Customer[]> {
    const service = this.getSharePointService();
    return await service.getCustomers();
  }

  async listSites(): Promise<Site[]> {
    const service = this.getSharePointService();
    return await service.getSites();
  }

  async initializeSharePointLists(): Promise<void> {
    const service = this.getSharePointService();
    await service.createListsIfNotExist();
  }
}

// Create a singleton instance
export const sharePointAPI = new SharePointAPI();