import React, { useState, useEffect } from 'react'
import type { Ticket } from '../types'
import { sqlApiService } from '../services/SqlApiService'

type Props = {
  ticket: Ticket
  onClose: () => void
  companyName?: string // Optional company name for branding
}

type SiteData = {
  SiteID: string
  Site: string
  Name: string
  Address: string
  ContactName: string
  ContactPhone: string
}

export default function PrintableServiceTicket({ ticket, onClose, companyName = 'Field Service' }: Props) {
  const [siteData, setSiteData] = useState<SiteData | null>(null)

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const sites = await sqlApiService.getSites()
        const site = sites.find((s: any) => s.Site === ticket.Site || s.Name === ticket.Site)
        if (site) {
          setSiteData({
            SiteID: site.SiteID,
            Site: site.Site || site.Name,
            Name: site.Name || site.Site,
            Address: site.Address || '',
            ContactName: site.ContactName || site.Contact || '',
            ContactPhone: site.ContactPhone || site.Phone || ''
          })
        }
      } catch (error) {
        console.error('Error fetching site data:', error)
      }
    }

    if (ticket.Site) {
      fetchSiteData()
    }
  }, [ticket.Site])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handlePrint = () => {
    // Create a new window with just the printable content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Service Ticket - ${ticket.TicketID}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: black;
              background: white;
              font-size: 10pt;
              line-height: 1.1;
            }
            h1, h2, h3 {
              color: black;
              margin-top: 0;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid black;
              padding-bottom: 0.4rem;
              margin-bottom: 0.8rem;
            }
            .company-name {
              font-size: 1.6rem;
              font-weight: bold;
              margin: 0;
            }
            .ticket-title {
              font-size: 1.2rem;
              font-weight: bold;
              margin: 0.2rem 0;
            }
            .subtitle {
              font-size: 0.9rem;
              font-weight: 500;
              margin: 0.2rem 0 0 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.8rem;
              margin-bottom: 0.8rem;
            }
            .info-section {
              border: 1px solid black;
              padding: 0.5rem;
            }
            .section-title {
              font-weight: bold;
              font-size: 0.95rem;
              margin-bottom: 0.5rem;
              text-decoration: underline;
            }
            .field {
              margin-bottom: 0.4rem;
              font-size: 10pt;
            }
            .field-label {
              font-weight: bold;
              display: inline-block;
              width: 100px;
            }
            .description-section {
              border: 1px solid black;
              padding: 0.5rem;
              margin-bottom: 0.8rem;
              min-height: 50px;
            }
            .notes-section {
              border: 1px solid black;
              padding: 0.5rem;
              margin-bottom: 0.8rem;
              min-height: 50px;
            }
            .status-section {
              border: 1px solid black;
              padding: 0.6rem;
              margin-bottom: 0.8rem;
            }
            .checkbox-item {
              margin-bottom: 0.4rem;
              display: flex;
              align-items: center;
              font-size: 10pt;
            }
            .checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid black;
              margin-right: 10px;
              display: inline-block;
            }
            .parts-section {
              border: 1px solid black;
              padding: 0.5rem;
              margin-bottom: 0.8rem;
              min-height: 50px;
            }
            .times-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
              margin-bottom: 1rem;
            }
            .time-section {
              border: 1px solid black;
              padding: 0.6rem;
            }
            .signatures-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
              margin-bottom: 0.5rem;
            }
            .signature-section {
              border: 1px solid black;
              padding: 0.5rem;
            }
            .signature-line {
              border-bottom: 1px solid black;
              height: 1.5rem;
              margin-bottom: 0.2rem;
            }
            .footer {
              margin-top: 0.5rem;
              text-align: center;
              font-size: 8pt;
              border-top: 1px solid black;
              padding-top: 0.3rem;
            }
            @media print {
              body { margin: 0; }
              @page { margin: 0.3in; size: letter; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">${companyName}</h1>
            <h2 class="ticket-title">Field Service Ticket</h2>
            <p class="subtitle">Service Request Documentation</p>
          </div>

          <div class="info-grid">
            <div class="info-section">
              <div class="section-title">Service Ticket Information</div>
              <div class="field">
                <span class="field-label">Ticket Number:</span>
                <span style="font-family: monospace; font-size: 11pt; font-weight: bold;">${ticket.TicketID || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="field-label">Title:</span>
                <span style="font-weight: bold;">${ticket.Title || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="field-label">Date of Service:</span>
                <span>${formatDateOnly(ticket.ScheduledStart || ticket.CreatedAt)}</span>
              </div>
              <div class="field">
                <span class="field-label">Status:</span>
                <span><strong>${ticket.Status || 'N/A'}</strong></span>
              </div>
              <div class="field">
                <span class="field-label">Priority:</span>
                <span><strong>${ticket.Priority || 'N/A'}</strong></span>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">Customer & Site Information</div>
              <div class="field">
                <span class="field-label">Customer Name:</span>
                <span>${ticket.Customer || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="field-label">Site Name:</span>
                <span>${ticket.Site || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="field-label">Site Address:</span>
                <span>${siteData?.Address || '_____________________________'}</span>
              </div>
              <div class="field">
                <span class="field-label">Site Contact Name:</span>
                <span>${siteData?.ContactName || '_____________________________'}</span>
              </div>
            </div>
          </div>

          <div class="description-section">
            <div class="section-title">Service Description</div>
            <p style="margin: 0; font-size: 10pt;">${ticket.Description || 'No description provided'}</p>
          </div>

          <div class="notes-section">
            <div class="section-title">Technician Notes</div>
          </div>

          <div class="status-section">
            <div class="section-title">Service Completion Status</div>
            <div style="display: flex; gap: 2rem;">
              <div class="checkbox-item">
                <span class="checkbox"></span>
                <span style="font-weight: 500;">Resolved</span>
              </div>
              <div class="checkbox-item">
                <span class="checkbox"></span>
                <span style="font-weight: 500;">Return Trip Needed</span>
              </div>
            </div>
          </div>

          <div class="parts-section">
            <div class="section-title">Parts Used</div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.4rem; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 0.3rem; font-size: 10pt;">
              <div>Part Description</div>
              <div>Part Number</div>
              <div>Quantity</div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.3rem; border-bottom: 1px solid #ccc; padding-bottom: 0.3rem; font-size: 9pt;">
              <div>_________________________________</div>
              <div>_______________</div>
              <div>_______</div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.3rem; border-bottom: 1px solid #ccc; padding-bottom: 0.3rem; font-size: 9pt;">
              <div>_________________________________</div>
              <div>_______________</div>
              <div>_______</div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.3rem; font-size: 9pt;">
              <div>_________________________________</div>
              <div>_______________</div>
              <div>_______</div>
            </div>
          </div>

          <div style="border: 1px solid black; padding: 0.6rem; margin-bottom: 1rem;">
            <div class="section-title">Service Times & Technician</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div class="field">
                <span style="font-weight: bold; display: block; margin-bottom: 0.2rem;">Start Time:</span>
                <span>${formatDate(ticket.ScheduledStart) !== 'N/A' ? formatDate(ticket.ScheduledStart) : '_______________'}</span>
              </div>
              <div class="field">
                <span style="font-weight: bold; display: block; margin-bottom: 0.2rem;">Stop Time:</span>
                <span>${formatDate(ticket.ScheduledEnd) !== 'N/A' ? formatDate(ticket.ScheduledEnd) : '_______________'}</span>
              </div>
              <div class="field">
                <span style="font-weight: bold; display: block; margin-bottom: 0.2rem;">Tech Name:</span>
                <span>${ticket.AssignedTo || '_______________'}</span>
              </div>
            </div>
          </div>

          <div class="signatures-grid">
            <div class="signature-section">
              <div style="margin-bottom: 0.3rem; font-weight: bold; font-size: 9pt;">Technician Sign-off:</div>
              <div class="signature-line"></div>
              <div style="text-align: center; font-size: 8pt;">
                <strong>Technician Signature</strong> - Date: ${formatDateOnly(new Date().toISOString())}
              </div>
            </div>

            <div class="signature-section">
              <div style="margin-bottom: 0.3rem; font-weight: bold; font-size: 9pt;">Customer Sign-off:</div>
              <div style="margin-bottom: 0.3rem; font-size: 8pt;">
                Print Name: ___________________________
              </div>
              <div class="signature-line"></div>
              <div style="text-align: center; font-size: 8pt;">
                <strong>Customer Signature</strong> - Date: _______________
              </div>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">Generated: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for the content to load, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} className="print-modal">
      <div style={{ 
        width: '90vw',
        maxWidth: '800px',
        height: '90vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: 'black'
      }}>
        {/* Header - Only visible on screen */}
        <div 
          className="no-print"
          style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid black',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'black' }}>Print Service Ticket</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4a5568',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '2rem',
          backgroundColor: 'white',
          color: 'black'
        }} className="printable-content" id="printable-content">
          {/* Company Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            borderBottom: '3px solid black',
            paddingBottom: '1rem'
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2.2rem', 
              fontWeight: 'bold',
              color: 'black'
            }}>
              {companyName}
            </h1>
            <h2 style={{ 
              margin: '0.5rem 0', 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: 'black'
            }}>
              Field Service Ticket
            </h2>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              color: 'black',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}>
              Service Request Documentation
            </p>
          </div>

          {/* Ticket Header Information */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '2px solid black',
            backgroundColor: 'white'
          }}>
            <div>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: 'black',
                borderBottom: '1px solid black',
                paddingBottom: '0.5rem'
              }}>
                Service Ticket Information
              </h3>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Ticket Number:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold' }}>{ticket.TicketID}</span>
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Title:</strong> <span style={{ fontWeight: 'bold' }}>{ticket.Title}</span>
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Date of Service:</strong> {formatDateOnly(ticket.ScheduledStart || ticket.CreatedAt)}
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Status:</strong> <strong>{ticket.Status}</strong>
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Priority:</strong> <strong>{ticket.Priority}</strong>
              </div>
            </div>

            <div>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: 'black',
                borderBottom: '1px solid black',
                paddingBottom: '0.5rem'
              }}>
                Customer & Site Information
              </h3>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Customer Name:</strong> {ticket.Customer}
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Site Name:</strong> {ticket.Site}
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Site Address:</strong> {siteData?.Address || '_________________________'}
              </div>
              <div style={{ marginBottom: '0.8rem', color: 'black' }}>
                <strong>Site Contact Name:</strong> {siteData?.ContactName || '_________________________'}
              </div>
            </div>
          </div>

          {/* Time and Technician Information */}
          <div style={{ 
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '2px solid black',
            backgroundColor: 'white'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black',
              borderBottom: '1px solid black',
              paddingBottom: '0.5rem'
            }}>
              Service Times & Technician
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', color: 'black' }}>
              <div>
                <strong>Start Time:</strong><br />
                {formatDate(ticket.ScheduledStart) !== 'N/A' ? formatDate(ticket.ScheduledStart) : '___________'}
              </div>
              <div>
                <strong>Stop Time:</strong><br />
                {formatDate(ticket.ScheduledEnd) !== 'N/A' ? formatDate(ticket.ScheduledEnd) : '___________'}
              </div>
              <div>
                <strong>Tech Name:</strong><br />
                {ticket.AssignedTo || '___________________________'}
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black',
              borderBottom: '1px solid black',
              paddingBottom: '0.5rem'
            }}>
              Problem Description
            </h3>
            <div style={{ 
              padding: '1rem',
              border: '2px solid black',
              backgroundColor: 'white',
              minHeight: '6rem',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: 'black'
            }}>
              {ticket.Description || 'No description provided.'}
            </div>
          </div>

          {/* Tech Notes Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black',
              borderBottom: '1px solid black',
              paddingBottom: '0.5rem'
            }}>
              Technician Notes
            </h3>
            <div style={{ 
              padding: '1rem',
              border: '2px solid black',
              backgroundColor: 'white',
              minHeight: '8rem',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: 'black'
            }}>
              {ticket.Resolution || ''}
            </div>
          </div>

          {/* Service Completion Status */}
          <div style={{ 
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '2px solid black',
            backgroundColor: 'white'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black',
              borderBottom: '1px solid black',
              paddingBottom: '0.5rem'
            }}>
              Service Completion Status
            </h3>
            <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid black',
                  backgroundColor: ticket.Status === 'Complete' || ticket.Status === 'Closed' ? 'black' : 'white'
                }}></div>
                <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'black' }}>Resolved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid black',
                  backgroundColor: ticket.Status === 'On-Hold' ? 'black' : 'white'
                }}></div>
                <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'black' }}>Return Trip Needed</span>
              </div>
            </div>
          </div>

          {/* Parts Used Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black',
              borderBottom: '1px solid black',
              paddingBottom: '0.5rem'
            }}>
              Parts Used
            </h3>
            <div style={{ 
              padding: '1rem',
              border: '2px solid black',
              backgroundColor: 'white',
              minHeight: '6rem',
              color: 'black'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '0.5rem' }}>
                <div>Part Description</div>
                <div>Part Number</div>
                <div>Quantity</div>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
                  <div>_________________________________</div>
                  <div>_______________</div>
                  <div>_______</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {ticket.Tags && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: 'black',
                borderBottom: '1px solid black',
                paddingBottom: '0.5rem'
              }}>
                Service Categories
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ticket.Tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid black',
                      backgroundColor: 'white',
                      color: 'black',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Section */}
          <div style={{ 
            marginTop: '3rem',
            borderTop: '3px solid black',
            paddingTop: '2rem'
          }}>
            <h3 style={{ 
              margin: '0 0 2rem 0', 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: 'black'
            }}>
              Service Confirmation & Sign-off
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
              <div>
                <div style={{ marginBottom: '1rem', color: 'black' }}>
                  <strong>Technician Information:</strong>
                </div>
                <div style={{ marginBottom: '1rem', color: 'black' }}>
                  Name: {ticket.AssignedTo || '___________________________'}
                </div>
                <div style={{ 
                  borderBottom: '2px solid black',
                  height: '3rem',
                  marginBottom: '0.5rem'
                }}></div>
                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'black' }}>
                  <strong>Technician Signature</strong>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'black', marginTop: '0.5rem' }}>
                  Date: {formatDateOnly(new Date().toISOString())}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '1rem', color: 'black' }}>
                  <strong>Customer Sign-off:</strong>
                </div>
                <div style={{ marginBottom: '1rem', color: 'black' }}>
                  Print Name: ___________________________
                </div>
                <div style={{ 
                  borderBottom: '2px solid black',
                  height: '3rem',
                  marginBottom: '0.5rem'
                }}></div>
                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'black' }}>
                  <strong>Customer Signature</strong>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'black', marginTop: '0.5rem' }}>
                  Date: _______________
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'black',
            borderTop: '1px solid black',
            paddingTop: '1rem'
          }}>
            <p>This service ticket was generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}