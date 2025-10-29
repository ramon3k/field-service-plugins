USE [FieldServiceDB]
GO
/****** Object:  Table [dbo].[ActivityLog]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ActivityLog](
	[ID] [nvarchar](50) NOT NULL,
	[UserID] [nvarchar](50) NOT NULL,
	[Username] [nvarchar](100) NOT NULL,
	[Action] [nvarchar](200) NOT NULL,
	[Details] [nvarchar](max) NULL,
	[Timestamp] [datetime2](7) NOT NULL,
	[UserTimezone] [nvarchar](100) NULL,
	[IPAddress] [nvarchar](50) NULL,
	[UserAgent] [nvarchar](500) NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Assets]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Assets](
	[AssetID] [nvarchar](50) NOT NULL,
	[SiteID] [nvarchar](50) NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Type] [nvarchar](100) NULL,
	[Model] [nvarchar](100) NULL,
	[SerialNumber] [nvarchar](100) NULL,
	[InstallDate] [date] NULL,
	[WarrantyExpiration] [date] NULL,
	[Status] [nvarchar](50) NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[AssetID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Attachments]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Attachments](
	[AttachmentID] [nvarchar](50) NOT NULL,
	[TicketID] [nvarchar](50) NOT NULL,
	[FileName] [nvarchar](255) NOT NULL,
	[OriginalFileName] [nvarchar](255) NOT NULL,
	[FileType] [nvarchar](100) NOT NULL,
	[FileSize] [int] NOT NULL,
	[FilePath] [nvarchar](500) NOT NULL,
	[UploadedBy] [nvarchar](50) NOT NULL,
	[UploadedAt] [datetime] NOT NULL,
	[Description] [nvarchar](500) NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[AttachmentID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AuditTrail]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AuditTrail](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [nvarchar](50) NOT NULL,
	[AuditID] [nvarchar](50) NOT NULL,
	[Timestamp] [datetime2](7) NOT NULL,
	[UserName] [nvarchar](100) NOT NULL,
	[Action] [nvarchar](200) NOT NULL,
	[Field] [nvarchar](100) NULL,
	[OldValue] [nvarchar](max) NULL,
	[NewValue] [nvarchar](max) NULL,
	[Notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Companies]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Companies](
	[CompanyID] [int] IDENTITY(1,1) NOT NULL,
	[CompanyCode] [nvarchar](50) NOT NULL,
	[CompanyName] [nvarchar](255) NOT NULL,
	[DisplayName] [nvarchar](255) NULL,
	[ContactEmail] [nvarchar](255) NULL,
	[ContactPhone] [nvarchar](50) NULL,
	[Address] [nvarchar](500) NULL,
	[IsActive] [bit] NULL,
	[AllowServiceRequests] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[CompanyID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CoordinatorNotes]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CoordinatorNotes](
	[NoteID] [nvarchar](50) NOT NULL,
	[TicketID] [nvarchar](50) NOT NULL,
	[CreatedBy] [nvarchar](100) NOT NULL,
	[Note] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[NoteID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Customers]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Customers](
	[CustomerID] [nvarchar](50) NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Contact] [nvarchar](100) NULL,
	[Phone] [nvarchar](20) NULL,
	[Email] [nvarchar](100) NULL,
	[Address] [nvarchar](500) NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[CustomerID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GlobalPlugins]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GlobalPlugins](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[displayName] [nvarchar](200) NOT NULL,
	[description] [nvarchar](1000) NULL,
	[version] [nvarchar](20) NOT NULL,
	[author] [nvarchar](100) NULL,
	[authorEmail] [nvarchar](255) NULL,
	[category] [nvarchar](50) NULL,
	[tags] [nvarchar](500) NULL,
	[packagePath] [nvarchar](500) NULL,
	[mainFile] [nvarchar](255) NULL,
	[manifestFile] [nvarchar](255) NULL,
	[minAppVersion] [nvarchar](20) NULL,
	[maxAppVersion] [nvarchar](20) NULL,
	[dependencies] [nvarchar](1000) NULL,
	[hasDatabase] [bit] NULL,
	[hasAPI] [bit] NULL,
	[hasUI] [bit] NULL,
	[hasHooks] [bit] NULL,
	[requiredPermissions] [nvarchar](500) NULL,
	[securityLevel] [nvarchar](20) NULL,
	[status] [nvarchar](20) NULL,
	[isOfficial] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Licenses]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Licenses](
	[LicenseID] [nvarchar](50) NOT NULL,
	[Customer] [nvarchar](200) NOT NULL,
	[Site] [nvarchar](200) NOT NULL,
	[SoftwareName] [nvarchar](200) NOT NULL,
	[SoftwareVersion] [nvarchar](100) NULL,
	[LicenseType] [nvarchar](50) NULL,
	[LicenseKey] [nvarchar](500) NULL,
	[LicenseCount] [int] NULL,
	[UsedCount] [int] NULL,
	[ExpirationDate] [date] NULL,
	[ServicePlan] [nvarchar](100) NULL,
	[ServicePlanExpiration] [date] NULL,
	[Vendor] [nvarchar](200) NULL,
	[PurchaseDate] [date] NULL,
	[PurchasePrice] [decimal](10, 2) NULL,
	[RenewalDate] [date] NULL,
	[RenewalPrice] [decimal](10, 2) NULL,
	[ContactEmail] [nvarchar](100) NULL,
	[Status] [nvarchar](50) NULL,
	[InstallationPath] [nvarchar](500) NULL,
	[LastUpdated] [datetime2](7) NULL,
	[ComplianceNotes] [nvarchar](max) NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[LicenseID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PluginActivityLog]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PluginActivityLog](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NULL,
	[activity] [nvarchar](100) NOT NULL,
	[description] [nvarchar](500) NULL,
	[userId] [nvarchar](100) NULL,
	[userRole] [nvarchar](50) NULL,
	[ipAddress] [nvarchar](45) NULL,
	[userAgent] [nvarchar](500) NULL,
	[metadata] [nvarchar](max) NULL,
	[timestamp] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PluginAPIEndpoints]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PluginAPIEndpoints](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NOT NULL,
	[method] [nvarchar](10) NOT NULL,
	[path] [nvarchar](255) NOT NULL,
	[handlerFunction] [nvarchar](255) NOT NULL,
	[summary] [nvarchar](200) NULL,
	[description] [nvarchar](1000) NULL,
	[requestSchema] [nvarchar](max) NULL,
	[responseSchema] [nvarchar](max) NULL,
	[requiresAuth] [bit] NULL,
	[requiredRole] [nvarchar](50) NULL,
	[requiredPermissions] [nvarchar](500) NULL,
	[rateLimitPerMinute] [int] NULL,
	[rateLimitPerHour] [int] NULL,
	[isEnabled] [bit] NULL,
	[requestCount] [int] NULL,
	[lastRequested] [datetime2](7) NULL,
	[avgResponseTime] [int] NULL,
	[createdAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PluginDatabaseObjects]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PluginDatabaseObjects](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NOT NULL,
	[objectType] [nvarchar](50) NOT NULL,
	[objectName] [nvarchar](255) NOT NULL,
	[schemaName] [nvarchar](100) NULL,
	[creationScript] [nvarchar](max) NULL,
	[rollbackScript] [nvarchar](max) NULL,
	[dependsOn] [nvarchar](1000) NULL,
	[requiredBy] [nvarchar](1000) NULL,
	[isCreated] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
	[lastModified] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PluginHookRegistrations]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PluginHookRegistrations](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NOT NULL,
	[hookId] [uniqueidentifier] NOT NULL,
	[handlerFunction] [nvarchar](255) NOT NULL,
	[priority] [int] NULL,
	[isEnabled] [bit] NULL,
	[executionCount] [int] NULL,
	[totalExecutionTime] [bigint] NULL,
	[lastExecuted] [datetime2](7) NULL,
	[lastError] [nvarchar](1000) NULL,
	[registeredAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PluginMenuItems]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PluginMenuItems](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NOT NULL,
	[label] [nvarchar](100) NOT NULL,
	[icon] [nvarchar](100) NULL,
	[route] [nvarchar](255) NULL,
	[component] [nvarchar](255) NULL,
	[parentMenu] [nvarchar](100) NULL,
	[sortOrder] [int] NULL,
	[requiredRole] [nvarchar](50) NULL,
	[requiredPermissions] [nvarchar](500) NULL,
	[isEnabled] [bit] NULL,
	[isVisible] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ServiceRequests]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ServiceRequests](
	[RequestID] [nvarchar](50) NOT NULL,
	[CustomerName] [nvarchar](200) NOT NULL,
	[ContactEmail] [nvarchar](100) NOT NULL,
	[ContactPhone] [nvarchar](20) NULL,
	[SiteName] [nvarchar](200) NULL,
	[Address] [nvarchar](500) NULL,
	[IssueDescription] [nvarchar](max) NOT NULL,
	[Priority] [nvarchar](20) NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[SubmittedAt] [datetime2](7) NOT NULL,
	[ProcessedBy] [nvarchar](100) NULL,
	[ProcessedAt] [datetime2](7) NULL,
	[ProcessedNote] [nvarchar](max) NULL,
	[TicketID] [nvarchar](50) NULL,
	[IPAddress] [nvarchar](50) NULL,
	[UserAgent] [nvarchar](500) NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[RequestID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Sites]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Sites](
	[SiteID] [nvarchar](50) NOT NULL,
	[CustomerID] [nvarchar](50) NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Customer] [nvarchar](200) NOT NULL,
	[Address] [nvarchar](500) NULL,
	[Contact] [nvarchar](100) NULL,
	[Phone] [nvarchar](20) NULL,
	[GeoLocation] [nvarchar](50) NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[SiteID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SystemHooks]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SystemHooks](
	[id] [uniqueidentifier] NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[displayName] [nvarchar](200) NOT NULL,
	[description] [nvarchar](500) NULL,
	[hookType] [nvarchar](50) NOT NULL,
	[category] [nvarchar](50) NULL,
	[parameters] [nvarchar](1000) NULL,
	[returnType] [nvarchar](100) NULL,
	[triggerContext] [nvarchar](200) NULL,
	[isAsync] [bit] NULL,
	[createdAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TenantPluginInstallations]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TenantPluginInstallations](
	[id] [uniqueidentifier] NOT NULL,
	[tenantId] [nvarchar](50) NOT NULL,
	[pluginId] [uniqueidentifier] NOT NULL,
	[installedVersion] [nvarchar](20) NOT NULL,
	[installedAt] [datetime2](7) NULL,
	[installedBy] [nvarchar](100) NULL,
	[isEnabled] [bit] NULL,
	[isConfigured] [bit] NULL,
	[configuration] [nvarchar](max) NULL,
	[customSettings] [nvarchar](max) NULL,
	[lastActivated] [datetime2](7) NULL,
	[lastDeactivated] [datetime2](7) NULL,
	[activationCount] [int] NULL,
	[status] [nvarchar](20) NULL,
	[errorMessage] [nvarchar](1000) NULL,
	[updatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[tenantId] ASC,
	[pluginId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tickets]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tickets](
	[TicketID] [nvarchar](50) NOT NULL,
	[Title] [nvarchar](300) NOT NULL,
	[Status] [nvarchar](50) NOT NULL,
	[Priority] [nvarchar](20) NOT NULL,
	[Customer] [nvarchar](200) NOT NULL,
	[Site] [nvarchar](200) NOT NULL,
	[AssetIDs] [nvarchar](max) NULL,
	[LicenseIDs] [nvarchar](max) NULL,
	[Category] [nvarchar](100) NULL,
	[Description] [nvarchar](max) NOT NULL,
	[ScheduledStart] [datetime2](7) NULL,
	[ScheduledEnd] [datetime2](7) NULL,
	[AssignedTo] [nvarchar](200) NULL,
	[Owner] [nvarchar](100) NULL,
	[SLA_Due] [datetime2](7) NULL,
	[Resolution] [nvarchar](max) NULL,
	[ClosedBy] [nvarchar](100) NULL,
	[ClosedDate] [datetime2](7) NULL,
	[GeoLocation] [nvarchar](50) NULL,
	[Tags] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[TicketID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TimeClockBreaks]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TimeClockBreaks](
	[BreakID] [uniqueidentifier] NOT NULL,
	[EntryID] [uniqueidentifier] NOT NULL,
	[BreakType] [nvarchar](50) NULL,
	[BreakStartTime] [datetime2](7) NOT NULL,
	[BreakEndTime] [datetime2](7) NULL,
	[BreakDuration] [int] NULL,
	[Notes] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[BreakID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TimeClockEntries]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TimeClockEntries](
	[EntryID] [uniqueidentifier] NOT NULL,
	[CompanyCode] [nvarchar](50) NOT NULL,
	[TechnicianID] [nvarchar](100) NOT NULL,
	[TechnicianName] [nvarchar](200) NULL,
	[ClockInTime] [datetime2](7) NOT NULL,
	[ClockOutTime] [datetime2](7) NULL,
	[TotalHours] [decimal](5, 2) NULL,
	[Notes] [nvarchar](max) NULL,
	[Location] [nvarchar](500) NULL,
	[ClockInMethod] [nvarchar](50) NULL,
	[ClockOutMethod] [nvarchar](50) NULL,
	[Status] [nvarchar](20) NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[TicketID] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[EntryID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[ID] [nvarchar](50) NOT NULL,
	[Username] [nvarchar](50) NOT NULL,
	[Email] [nvarchar](100) NOT NULL,
	[FullName] [nvarchar](100) NOT NULL,
	[Role] [nvarchar](20) NOT NULL,
	[PasswordHash] [nvarchar](255) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[Permissions] [nvarchar](max) NULL,
	[Vendor] [nvarchar](200) NULL,
	[CompanyCode] [varchar](8) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vendors]    Script Date: 10/29/2025 7:37:57 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vendors](
	[VendorID] [nvarchar](50) NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Contact] [nvarchar](100) NULL,
	[Phone] [nvarchar](20) NULL,
	[Email] [nvarchar](100) NULL,
	[ServiceAreas] [nvarchar](max) NULL,
	[Specialties] [nvarchar](max) NULL,
	[Rating] [decimal](3, 2) NULL,
	[ServicesTexas] [bit] NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CompanyCode] [varchar](8) NOT NULL,
	[CitiesServed] [nvarchar](max) NULL,
	[StateLicenseNumber] [nvarchar](200) NULL,
	[StateLicenseExpiration] [date] NULL,
	[COIProvider] [nvarchar](400) NULL,
	[COIPolicyNumber] [nvarchar](200) NULL,
	[COIExpiration] [date] NULL,
	[Certifications] [nvarchar](max) NULL,
	[VendorStatus] [nvarchar](50) NULL,
	[ComplianceNotes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ActivityLog_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ActivityLog_CompanyCode] ON [dbo].[ActivityLog]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ActivityLog_Timestamp]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ActivityLog_Timestamp] ON [dbo].[ActivityLog]
(
	[Timestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ActivityLog_UserID]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ActivityLog_UserID] ON [dbo].[ActivityLog]
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Assets_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Assets_CompanyCode] ON [dbo].[Assets]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Attachments_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Attachments_CompanyCode] ON [dbo].[Attachments]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Attachments_TicketID]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Attachments_TicketID] ON [dbo].[Attachments]
(
	[TicketID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Attachments_UploadedAt]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Attachments_UploadedAt] ON [dbo].[Attachments]
(
	[UploadedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Companies_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Companies_CompanyCode] ON [dbo].[Companies]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Companies_IsActive]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Companies_IsActive] ON [dbo].[Companies]
(
	[IsActive] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Customers_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Customers_CompanyCode] ON [dbo].[Customers]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_GlobalPlugins_Category]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_GlobalPlugins_Category] ON [dbo].[GlobalPlugins]
(
	[category] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_GlobalPlugins_Name]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_GlobalPlugins_Name] ON [dbo].[GlobalPlugins]
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_GlobalPlugins_Status]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_GlobalPlugins_Status] ON [dbo].[GlobalPlugins]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Licenses_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Licenses_CompanyCode] ON [dbo].[Licenses]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginActivity_Activity]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginActivity_Activity] ON [dbo].[PluginActivityLog]
(
	[activity] ASC,
	[timestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginActivity_Plugin]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginActivity_Plugin] ON [dbo].[PluginActivityLog]
(
	[pluginId] ASC,
	[timestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginActivity_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginActivity_Tenant] ON [dbo].[PluginActivityLog]
(
	[tenantId] ASC,
	[timestamp] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginAPI_Method_Path]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginAPI_Method_Path] ON [dbo].[PluginAPIEndpoints]
(
	[method] ASC,
	[path] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginAPI_Plugin]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginAPI_Plugin] ON [dbo].[PluginAPIEndpoints]
(
	[pluginId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginAPI_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginAPI_Tenant] ON [dbo].[PluginAPIEndpoints]
(
	[tenantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginDB_Object]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginDB_Object] ON [dbo].[PluginDatabaseObjects]
(
	[objectType] ASC,
	[objectName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginDB_Plugin]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginDB_Plugin] ON [dbo].[PluginDatabaseObjects]
(
	[pluginId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginDB_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginDB_Tenant] ON [dbo].[PluginDatabaseObjects]
(
	[tenantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginHooks_Hook]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginHooks_Hook] ON [dbo].[PluginHookRegistrations]
(
	[hookId] ASC,
	[priority] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginHooks_Plugin]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginHooks_Plugin] ON [dbo].[PluginHookRegistrations]
(
	[pluginId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginHooks_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginHooks_Tenant] ON [dbo].[PluginHookRegistrations]
(
	[tenantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginMenu_Parent]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginMenu_Parent] ON [dbo].[PluginMenuItems]
(
	[parentMenu] ASC,
	[sortOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PluginMenu_Plugin]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginMenu_Plugin] ON [dbo].[PluginMenuItems]
(
	[pluginId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_PluginMenu_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_PluginMenu_Tenant] ON [dbo].[PluginMenuItems]
(
	[tenantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ServiceRequests_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ServiceRequests_CompanyCode] ON [dbo].[ServiceRequests]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_ServiceRequests_Status]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ServiceRequests_Status] ON [dbo].[ServiceRequests]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ServiceRequests_SubmittedAt]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_ServiceRequests_SubmittedAt] ON [dbo].[ServiceRequests]
(
	[SubmittedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Sites_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Sites_CompanyCode] ON [dbo].[Sites]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_SystemHooks_Category]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_SystemHooks_Category] ON [dbo].[SystemHooks]
(
	[category] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_SystemHooks_Name]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_SystemHooks_Name] ON [dbo].[SystemHooks]
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TenantPlugins_Enabled]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TenantPlugins_Enabled] ON [dbo].[TenantPluginInstallations]
(
	[tenantId] ASC,
	[isEnabled] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TenantPlugins_Status]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TenantPlugins_Status] ON [dbo].[TenantPluginInstallations]
(
	[tenantId] ASC,
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TenantPlugins_Tenant]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TenantPlugins_Tenant] ON [dbo].[TenantPluginInstallations]
(
	[tenantId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Tickets_AssignedTo]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_AssignedTo] ON [dbo].[Tickets]
(
	[AssignedTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Tickets_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_CompanyCode] ON [dbo].[Tickets]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Tickets_CreatedAt]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_CreatedAt] ON [dbo].[Tickets]
(
	[CreatedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Tickets_Customer]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_Customer] ON [dbo].[Tickets]
(
	[Customer] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Tickets_Priority]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_Priority] ON [dbo].[Tickets]
(
	[Priority] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Tickets_Status]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Tickets_Status] ON [dbo].[Tickets]
(
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_TimeClockBreaks_Entry]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TimeClockBreaks_Entry] ON [dbo].[TimeClockBreaks]
(
	[EntryID] ASC,
	[BreakStartTime] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TimeClockEntries_Company]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TimeClockEntries_Company] ON [dbo].[TimeClockEntries]
(
	[CompanyCode] ASC,
	[ClockInTime] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TimeClockEntries_Status]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TimeClockEntries_Status] ON [dbo].[TimeClockEntries]
(
	[Status] ASC,
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TimeClockEntries_Technician]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TimeClockEntries_Technician] ON [dbo].[TimeClockEntries]
(
	[TechnicianID] ASC,
	[ClockInTime] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_TimeClockEntries_Ticket]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_TimeClockEntries_Ticket] ON [dbo].[TimeClockEntries]
(
	[TicketID] ASC,
	[ClockInTime] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Users_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Users_CompanyCode] ON [dbo].[Users]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Vendors_CompanyCode]    Script Date: 10/29/2025 7:37:57 AM ******/
CREATE NONCLUSTERED INDEX [IX_Vendors_CompanyCode] ON [dbo].[Vendors]
(
	[CompanyCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ActivityLog] ADD  DEFAULT (getutcdate()) FOR [Timestamp]
GO
ALTER TABLE [dbo].[ActivityLog] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Assets] ADD  DEFAULT ('Active') FOR [Status]
GO
ALTER TABLE [dbo].[Assets] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Assets] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Attachments] ADD  DEFAULT (getdate()) FOR [UploadedAt]
GO
ALTER TABLE [dbo].[Attachments] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Companies] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Companies] ADD  DEFAULT ((1)) FOR [AllowServiceRequests]
GO
ALTER TABLE [dbo].[Companies] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Companies] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[CoordinatorNotes] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Customers] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ((0)) FOR [hasDatabase]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ((0)) FOR [hasAPI]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ((0)) FOR [hasUI]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ((0)) FOR [hasHooks]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ('standard') FOR [securityLevel]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ('available') FOR [status]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT ((0)) FOR [isOfficial]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT (getutcdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[GlobalPlugins] ADD  DEFAULT (getutcdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ('Subscription') FOR [LicenseType]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ((1)) FOR [LicenseCount]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ((0)) FOR [UsedCount]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ((0)) FOR [PurchasePrice]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ((0)) FOR [RenewalPrice]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ('Active') FOR [Status]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT (getutcdate()) FOR [LastUpdated]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Licenses] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[PluginActivityLog] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PluginActivityLog] ADD  DEFAULT (getutcdate()) FOR [timestamp]
GO
ALTER TABLE [dbo].[PluginAPIEndpoints] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PluginAPIEndpoints] ADD  DEFAULT ((1)) FOR [requiresAuth]
GO
ALTER TABLE [dbo].[PluginAPIEndpoints] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[PluginAPIEndpoints] ADD  DEFAULT ((0)) FOR [requestCount]
GO
ALTER TABLE [dbo].[PluginAPIEndpoints] ADD  DEFAULT (getutcdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[PluginDatabaseObjects] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PluginDatabaseObjects] ADD  DEFAULT ('dbo') FOR [schemaName]
GO
ALTER TABLE [dbo].[PluginDatabaseObjects] ADD  DEFAULT ((0)) FOR [isCreated]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT ((10)) FOR [priority]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT ((0)) FOR [executionCount]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT ((0)) FOR [totalExecutionTime]
GO
ALTER TABLE [dbo].[PluginHookRegistrations] ADD  DEFAULT (getutcdate()) FOR [registeredAt]
GO
ALTER TABLE [dbo].[PluginMenuItems] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[PluginMenuItems] ADD  DEFAULT ((100)) FOR [sortOrder]
GO
ALTER TABLE [dbo].[PluginMenuItems] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[PluginMenuItems] ADD  DEFAULT ((1)) FOR [isVisible]
GO
ALTER TABLE [dbo].[PluginMenuItems] ADD  DEFAULT (getutcdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[ServiceRequests] ADD  DEFAULT ('Medium') FOR [Priority]
GO
ALTER TABLE [dbo].[ServiceRequests] ADD  DEFAULT ('New') FOR [Status]
GO
ALTER TABLE [dbo].[ServiceRequests] ADD  DEFAULT (getdate()) FOR [SubmittedAt]
GO
ALTER TABLE [dbo].[ServiceRequests] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Sites] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Sites] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[SystemHooks] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[SystemHooks] ADD  DEFAULT ((0)) FOR [isAsync]
GO
ALTER TABLE [dbo].[SystemHooks] ADD  DEFAULT (getutcdate()) FOR [createdAt]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT (getutcdate()) FOR [installedAt]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT ((1)) FOR [isEnabled]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT ((0)) FOR [isConfigured]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT ((0)) FOR [activationCount]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT ('installed') FOR [status]
GO
ALTER TABLE [dbo].[TenantPluginInstallations] ADD  DEFAULT (getutcdate()) FOR [updatedAt]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT ('New') FOR [Status]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT ('Normal') FOR [Priority]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT ('Operations Coordinator') FOR [Owner]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Tickets] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[TimeClockBreaks] ADD  DEFAULT (newid()) FOR [BreakID]
GO
ALTER TABLE [dbo].[TimeClockBreaks] ADD  DEFAULT ('Lunch') FOR [BreakType]
GO
ALTER TABLE [dbo].[TimeClockBreaks] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TimeClockEntries] ADD  DEFAULT (newid()) FOR [EntryID]
GO
ALTER TABLE [dbo].[TimeClockEntries] ADD  DEFAULT ('Manual') FOR [ClockInMethod]
GO
ALTER TABLE [dbo].[TimeClockEntries] ADD  DEFAULT ('Active') FOR [Status]
GO
ALTER TABLE [dbo].[TimeClockEntries] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TimeClockEntries] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Vendors] ADD  DEFAULT ((0)) FOR [ServicesTexas]
GO
ALTER TABLE [dbo].[Vendors] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Vendors] ADD  DEFAULT ('DEFAULT') FOR [CompanyCode]
GO
ALTER TABLE [dbo].[Vendors] ADD  DEFAULT ('Active') FOR [VendorStatus]
GO
ALTER TABLE [dbo].[ActivityLog]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([ID])
GO
ALTER TABLE [dbo].[Assets]  WITH CHECK ADD FOREIGN KEY([SiteID])
REFERENCES [dbo].[Sites] ([SiteID])
GO
ALTER TABLE [dbo].[Attachments]  WITH CHECK ADD  CONSTRAINT [FK_Attachments_Ticket] FOREIGN KEY([TicketID])
REFERENCES [dbo].[Tickets] ([TicketID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Attachments] CHECK CONSTRAINT [FK_Attachments_Ticket]
GO
ALTER TABLE [dbo].[Attachments]  WITH CHECK ADD  CONSTRAINT [FK_Attachments_User] FOREIGN KEY([UploadedBy])
REFERENCES [dbo].[Users] ([ID])
GO
ALTER TABLE [dbo].[Attachments] CHECK CONSTRAINT [FK_Attachments_User]
GO
ALTER TABLE [dbo].[AuditTrail]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [dbo].[Tickets] ([TicketID])
GO
ALTER TABLE [dbo].[CoordinatorNotes]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [dbo].[Tickets] ([TicketID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PluginActivityLog]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[PluginAPIEndpoints]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PluginDatabaseObjects]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PluginHookRegistrations]  WITH CHECK ADD FOREIGN KEY([hookId])
REFERENCES [dbo].[SystemHooks] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PluginHookRegistrations]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PluginMenuItems]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Sites]  WITH CHECK ADD FOREIGN KEY([CustomerID])
REFERENCES [dbo].[Customers] ([CustomerID])
GO
ALTER TABLE [dbo].[TenantPluginInstallations]  WITH CHECK ADD FOREIGN KEY([pluginId])
REFERENCES [dbo].[GlobalPlugins] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TimeClockBreaks]  WITH CHECK ADD  CONSTRAINT [FK_TimeClockBreaks_Entry] FOREIGN KEY([EntryID])
REFERENCES [dbo].[TimeClockEntries] ([EntryID])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TimeClockBreaks] CHECK CONSTRAINT [FK_TimeClockBreaks_Entry]
GO
ALTER TABLE [dbo].[TimeClockEntries]  WITH CHECK ADD  CONSTRAINT [FK_TimeClockEntries_Company] FOREIGN KEY([CompanyCode])
REFERENCES [dbo].[Companies] ([CompanyCode])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TimeClockEntries] CHECK CONSTRAINT [FK_TimeClockEntries_Company]
GO
ALTER TABLE [dbo].[ServiceRequests]  WITH CHECK ADD CHECK  (([Priority]='High' OR [Priority]='Medium' OR [Priority]='Low'))
GO
ALTER TABLE [dbo].[ServiceRequests]  WITH CHECK ADD CHECK  (([Status]='Dismissed' OR [Status]='Processed' OR [Status]='New'))
GO
ALTER TABLE [dbo].[Tickets]  WITH CHECK ADD CHECK  (([Priority]='Critical' OR [Priority]='High' OR [Priority]='Normal' OR [Priority]='Low'))
GO
ALTER TABLE [dbo].[Tickets]  WITH CHECK ADD CHECK  (([Status]='Closed' OR [Status]='Complete' OR [Status]='On-Hold' OR [Status]='In-Progress' OR [Status]='Scheduled' OR [Status]='New'))
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [CK_Users_Role] CHECK  (([Role]='Technician' OR [Role]='Coordinator' OR [Role]='Admin' OR [Role]='SystemAdmin'))
GO
ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [CK_Users_Role]
GO
