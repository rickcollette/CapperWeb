# Capper WebUI Design

Capper WebUI is designed as a real control plane, not just a pretty wrapper around CLI commands. The frontend feels like a lightweight private AWS console for capsules: instances, images, networks, storage, IAM, marketplace, factory sync, and capinit/metadata.

Capper already provides the right backend concepts: a `Controller` exposing image and instance managers with IAM authorization, a daemon control plane, runtime support for bwrap/chroot/crun/runc, S3-compatible object storage, buckets, objects, volumes, networks, DNS, and IAM primitives. The UI sits on top of those instead of duplicating logic in the browser.

## Recommended Stack

Use:

```txt
Vite
React
TypeScript
React Router
TanStack Query
Zustand
TailwindCSS
shadcn/ui
Lucide Icons
Monaco Editor
xterm.js
Recharts
```

The UI should be a **single-page control plane** that talks to a Capper API daemon.

Recommended project name:

```txt
capper-webui
```

Repo layout:

```txt
webui/
  package.json
  vite.config.ts
  index.html
  src/
    main.tsx
    app/
      App.tsx
      router.tsx
      providers.tsx
    api/
      client.ts
      instances.ts
      images.ts
      networks.ts
      storage.ts
      iam.ts
      marketplace.ts
      factory.ts
      capinit.ts
      dns.ts
    components/
      layout/
        AppShell.tsx
        Sidebar.tsx
        Topbar.tsx
        Breadcrumbs.tsx
      common/
        StatusBadge.tsx
        ConfirmDialog.tsx
        ResourceMeter.tsx
        EmptyState.tsx
        CodeBlock.tsx
        DataTable.tsx
      terminal/
        InstanceTerminal.tsx
      editor/
        JsonEditor.tsx
    pages/
      Dashboard.tsx
      instances/
        InstanceList.tsx
        InstanceDetail.tsx
        CreateInstance.tsx
      images/
        ImageList.tsx
        ImageDetail.tsx
        CreateImage.tsx
        UploadImage.tsx
      capsules/
        CapsuleRegistry.tsx
        CapsuleDetail.tsx
      marketplace/
        Marketplace.tsx
        MarketplaceImageDetail.tsx
        PublishImage.tsx
      factory/
        FactoryDashboard.tsx
        FactoryJobs.tsx
        FactoryImageSync.tsx
      networks/
        NetworkList.tsx
        NetworkDetail.tsx
        CreateNetwork.tsx
      storage/
        StorageDashboard.tsx
        BucketList.tsx
        BucketDetail.tsx
        VolumeList.tsx
        VolumeDetail.tsx
      capinit/
        CapInitDashboard.tsx
        MetadataTemplates.tsx
        CloudInitEditor.tsx
      dns/
        Zones.tsx
        ZoneDetail.tsx
        Records.tsx
      iam/
        Users.tsx
        Groups.tsx
        Roles.tsx
        Policies.tsx
      settings/
        Settings.tsx
        ApiKeys.tsx
        AuditLog.tsx
    types/
      capper.ts
    styles/
      globals.css
```

# Visual Direction

Capper should look like a **dark enterprise infrastructure console**:

```txt
Background: near-black graphite
Primary: electric cyan / blue
Warning: amber
Danger: red
Success: green
Accent: violet for AI/GPU/factory workflows
Cards: dark slate with subtle borders
Typography: Inter or IBM Plex Sans
Code: JetBrains Mono
```

The tone should be serious and technical. No cartoon cloud fluff. This is infrastructure.

# Main Navigation

Left sidebar:

```txt
Dashboard
Instances
Images
Capsule Registry
Marketplace
Factory
Networks
Storage
DNS
CapInit
IAM
Audit Log
Settings
```

Top bar:

```txt
Current account/org
Current host/cluster
Search
Notifications
User menu
Daemon status
```

The daemon status should show:

```txt
Online
Degraded
Offline
Read-only
Supervisor paused
Factory disconnected
```

# Dashboard

The dashboard should answer:

> “What is running, what is broken, what is consuming resources, and what needs my attention?”

Cards:

```txt
Running Instances
Stopped Instances
Images Available
Networks
Buckets
Volumes
Marketplace Pending Review
Factory Sync Status
Daemon Health
```

Main panels:

```txt
Resource Usage
- CPU allocated
- Memory allocated
- Disk used
- Network throughput
- GPU passthrough allocation

Recent Activity
- instance started
- image imported
- bucket created
- marketplace scan failed
- capinit template changed

Alerts
- instance crashed
- image failed scan
- bucket quota exceeded
- network bridge down
- metadata service unreachable
```

Since Capper already tracks runtime launches, process IDs, logs, resource limits, and restart behavior, the dashboard should surface those directly. Runtime support includes bwrap, chroot, crun, and runc modes, with resource limits applied from capsule manifests. 

# Instances UI

## Instance List

Table columns:

```txt
Name
Instance ID
Image
State
Capsule Type
CPU
Memory
GPU
Network
IP Address
Uptime
Restart Policy
Actions
```

Actions:

```txt
Start
Stop
Restart
Connect
View Logs
Clone
Delete
```

Filters:

```txt
Running
Stopped
Failed
By image
By network
By capsule type
By owner
```

## Instance Detail

Tabs:

```txt
Overview
Console
Logs
Metrics
Networking
Storage
CapInit
Security
Events
JSON
```

Overview should show:

```txt
State
PID
Runtime mode
Image digest
Entrypoint
Working directory
Hostname
Created time
Started time
Owner
IAM policy result
```

The runtime already creates `stdout.log`, `stderr.log`, `launch.json`, and `startup-error` files for instances. The WebUI should expose those cleanly as logs and startup diagnostics. 

## Console

Use `xterm.js`.

Backend endpoint should expose a websocket:

```txt
GET /api/v1/instances/:id/terminal
```

This should map to Capper’s existing `connect` / `exec` behavior.

UI behavior:

```txt
Open shell
Reconnect
Copy selection
Paste
Download transcript
Resize terminal
```

## Logs

Tabs:

```txt
stdout
stderr
startup-error
events
supervisor
```

Add live tail:

```txt
GET /api/v1/instances/:id/logs/stdout?follow=true
GET /api/v1/instances/:id/logs/stderr?follow=true
```

# Create Instance Flow

This should be a guided wizard.

## Step 1: Select Image

Cards/table:

```txt
Image name
Version
Digest
Publisher
Risk score
Last scan
Size
```

## Step 2: Select Capsule Type

Capsule types are your locked resource profiles.

Examples:

```txt
micro
small
medium
large
ai-gpu-small
ai-gpu-large
storage-heavy
network-heavy
```

Each capsule type defines:

```json
{
  "name": "ai-gpu-small",
  "cpuCores": 4,
  "memoryBytes": 17179869184,
  "diskBytes": 107374182400,
  "gpu": {
    "enabled": true,
    "mode": "passthrough",
    "count": 1
  },
  "maxProcesses": 512,
  "networkMbps": 1000
}
```

The UI should **not** let the user hand-wave resources. Pick a capsule type, then optionally request an override if policy allows it.

## Step 3: Network

```txt
No network
Private network
NAT network
Attach to existing network
Expose service port
Register DNS name
```

Capper already has virtual network concepts including bridge/NAT behavior and veth naming for instances. The WebUI should make that visible without exposing Linux plumbing unless the user opens “Advanced.” 

## Step 4: Storage

```txt
Ephemeral only
Attach existing volume
Create new volume
Mount object bucket
```

## Step 5: CapInit

This is where your “cloud-init style” system belongs.

Options:

```txt
No initialization
Use template
Paste YAML
Upload capinit file
Use marketplace default
```

Editor:

```yaml
hostname: web-01
users:
  - name: app
    groups: ["sudo"]
packages:
  - nginx
write_files:
  - path: /etc/motd
    content: |
      Welcome to Capper
runcmd:
  - systemctl enable nginx
  - systemctl start nginx
metadata:
  app: demo
  environment: dev
```

## Step 6: Review + Launch

Show final generated launch plan:

```txt
Image
Digest
Capsule type
Network
Volumes
CapInit template
Estimated resource usage
Security warnings
IAM decision
```

Button:

```txt
Launch Instance
```

# Images UI

Capper image management should have three modes:

```txt
Local Images
Registry Images
Factory Images
```

## Image List

Columns:

```txt
Name
Version
Digest
Size
Created
Source
Signed
SBOM
Provenance
Scan Status
Actions
```

Actions:

```txt
Run
Inspect
Export
Delete
Publish
Scan
Generate SBOM
Generate Provenance
```

The loader already resolves `.cap` images, supports direct paths and store lookup, extracts the image, verifies checksums, reads `capsule.json`, and verifies manifest digests. That maps perfectly to an Image Detail screen with “trust chain” visibility. 

## Image Detail

Tabs:

```txt
Overview
Manifest
Files
SBOM
Provenance
Security Scan
Versions
Marketplace
```

Show:

```txt
Digest
Entrypoint
Args
Env
Mounts
User UID/GID
Working directory
Network default
Resource limits
Image format version
```

The manifest tab should use Monaco read-only JSON.

# Capsule Registry UI

This is where you manage **instance types**, not images.

## Capsule Type List

Columns:

```txt
Name
CPU
Memory
Disk
GPU
Network
Max Processes
Allowed Runtime
Status
```

Actions:

```txt
Create
Edit
Clone
Deprecate
Delete
```

## Capsule Type Editor

Fields:

```txt
Name
Display name
Description
CPU shares / cores
Memory hard limit
Disk quota
Max process count
Max file size
Network bandwidth
GPU passthrough allowed
GPU count
Allowed runtimes
Allowed networks
Allowed storage classes
IAM visibility
```

Important: capsule types should be immutable once published. Editing should create a new version.

Example:

```txt
ai-gpu-small:v1
ai-gpu-small:v2
```

This avoids breaking existing deployments.

# Marketplace UI

This should be one of the most important parts of the system.

Marketplace image lifecycle:

```txt
Draft
Submitted
Scanning
Quarantined
Approved Private
Approved Public
Rejected
Deprecated
```

## Marketplace Main Page

Tabs:

```txt
Public Marketplace
Private Marketplace
Pending Review
My Published Images
Quarantine
```

Image cards:

```txt
Name
Publisher
Version
Description
Risk rating
Last scan
Downloads/deployments
Public/private badge
```

## Publish Image Flow

Steps:

```txt
Select local/factory image
Add metadata
Select visibility
Run automated scan
Review findings
Submit for approval
```

Visibility:

```txt
Private: available only to current organization/account
Public: available to everyone
```

## Scan Results

Show:

```txt
Malware scan
SBOM scan
Known CVEs
Suspicious binaries
Setuid files
Unexpected network listeners
Package provenance
Secrets detection
Filesystem anomalies
Entrypoint behavior
```

Buttons:

```txt
Approve Public
Approve Private
Reject
Quarantine
Request Changes
```

This matches the workflow you described: factory builds an image, scans it to make sure it is not evil, then flags it for public or private marketplace.

# Factory UI

The factory is where images are produced, scanned, versioned, and pushed into the Capper main system.

## Factory Dashboard

Cards:

```txt
Build Jobs
Successful Builds
Failed Builds
Pending Scans
Images Awaiting Push
Last Sync
Factory Agent Status
```

## Factory Jobs

Table:

```txt
Job ID
Image
Version
Source
Status
Started
Duration
Scan Result
Artifact
Actions
```

Statuses:

```txt
Queued
Building
Testing
Scanning
Signed
Ready to Push
Pushed
Failed
Quarantined
```

## Push to Capper

The UI needs a clear flow:

```txt
Select image artifact
Validate manifest
Verify SBOM/provenance
Run final scan
Choose target registry
Choose visibility
Push to Capper
Confirm available in Images/Marketplace
```

Recommended API:

```txt
POST /api/v1/factory/images/:id/push
POST /api/v1/factory/images/:id/rescan
GET  /api/v1/factory/jobs
GET  /api/v1/factory/jobs/:id
GET  /api/v1/factory/sync/status
```

## Factory Sync Screen

Show:

```txt
Factory endpoint
Authentication status
Last successful sync
Pending artifacts
Failed transfers
Target registry
Storage bucket
```

This screen should make it obvious whether the factory and main Capper control plane are connected.

# Storage UI

Capper already has object storage buckets, object commands, volumes, volume attachment, and an S3-compatible server. The S3 server supports bucket list/create/delete/head plus object put/get/head/delete/list, and uses SigV4 authentication when credentials are configured. 

## Storage Dashboard

Cards:

```txt
Buckets
Objects
Volumes
Used Capacity
Quota Alerts
S3 Endpoint Status
```

## Buckets

Columns:

```txt
Name
Created
Objects
Size
Versioning
Encrypted
Quota
Public Access
Actions
```

Actions:

```txt
Open
Create
Delete
Force Delete
Copy S3 Endpoint
Create Access Key
```

## Bucket Detail

Tabs:

```txt
Objects
Settings
Access
Lifecycle
S3 Credentials
Events
```

Object browser:

```txt
Folder-like prefix navigation
Upload
Download
Delete
Copy key
View metadata
```

Since object listing supports prefix and delimiter behavior, the UI can present buckets as folder trees even though the backend stores S3-style keys. 

## Volumes

Columns:

```txt
Name
Size
Attached Instance
Mount Path
Created
Status
Actions
```

Actions:

```txt
Create
Attach
Detach
Snapshot
Delete
```

# Network UI

## Network List

Columns:

```txt
Name
CIDR
Bridge
Gateway
NAT
Instances
DNS Zone
Status
Actions
```

## Network Detail

Tabs:

```txt
Overview
Instances
Routes
Firewall
DNS
Events
Advanced
```

Visual diagram:

```txt
Network: app-net
CIDR: 10.42.0.0/24

[Instance web-01] 10.42.0.10
[Instance api-01] 10.42.0.11
[Instance db-01]  10.42.0.12
        |
     capper0 bridge
        |
      NAT / Host
```

Advanced should show:

```txt
Bridge name
iptables masquerade status
veth pairs
namespace names
```

# DNS UI

Capper has DNS command support for zones, records, service discovery, queries, and an embedded DNS daemon. The WebUI should expose that as internal DNS management for Capper networks. 

Screens:

```txt
Zones
Records
Service Discovery
Query Tester
DNS Daemon Status
```

Record types:

```txt
A
AAAA
CNAME
TXT
MX
SRV
```

Query tester:

```txt
FQDN: api.dev.capper.local
Type: A
Result:
10.42.0.11
```

# CapInit UI

CapInit should become a first-class area.

## CapInit Dashboard

Cards:

```txt
Metadata Service Status
Templates
Instances Using CapInit
Failed Initializations
Recent Metadata Requests
```

## Metadata Service

Capper server should expose a metadata endpoint reachable from instances by a fixed IP, like cloud metadata services.

Example:

```txt
http://169.254.169.254/capper/v1/meta-data
http://169.254.169.254/capper/v1/user-data
http://169.254.169.254/capper/v1/instance-id
http://169.254.169.254/capper/v1/hostname
http://169.254.169.254/capper/v1/public-keys
```

UI should show:

```txt
Metadata IP
Enabled/disabled
Allowed networks
Request audit log
Per-instance metadata
Template inheritance
```

## Template Editor

Use Monaco.

Template types:

```txt
Base Linux
Web Server
Database
AI Worker
Storage Node
Development Sandbox
```

Each template should support:

```txt
Variables
Validation schema
Preview rendered output
Assigned images
Assigned capsule types
```

# IAM UI

Capper already has IAM concepts: users, groups, roles, policies, and authorization checks in the controller.  

Screens:

```txt
Users
Groups
Roles
Policies
Access Review
API Keys
```

Policy editor should support actions like:

```txt
instance:run
instance:stop
instance:delete
image:list
image:delete
marketplace:publish
marketplace:approve
storage:bucket:create
storage:object:read
network:create
iam:user:create
```

Nice feature: every dangerous UI button should show the IAM action it requires.

Example:

```txt
Delete Image
Requires: image:delete
```

# Audit Log

Audit everything.

Columns:

```txt
Time
Actor
Action
Resource
Result
Source IP
Message
```

Examples:

```txt
rick image:publish image/alpine-web:v1 allowed
factory marketplace:submit image/nginx-secure:v3 allowed
bob instance:delete instance/prod-db denied
```

# API Contract Needed for the WebUI

The current code is CLI/control-plane heavy. The WebUI needs a REST API layer over the existing controller/managers.

Recommended base:

```txt
/api/v1
```

## Health

```txt
GET /api/v1/health
GET /api/v1/version
GET /api/v1/daemon/status
GET /api/v1/events
```

## Instances

```txt
GET    /api/v1/instances
POST   /api/v1/instances
GET    /api/v1/instances/:id
POST   /api/v1/instances/:id/start
POST   /api/v1/instances/:id/stop
POST   /api/v1/instances/:id/restart
DELETE /api/v1/instances/:id
GET    /api/v1/instances/:id/logs
GET    /api/v1/instances/:id/logs/stdout
GET    /api/v1/instances/:id/logs/stderr
GET    /api/v1/instances/:id/events
WS     /api/v1/instances/:id/terminal
```

## Images

```txt
GET    /api/v1/images
POST   /api/v1/images/import
POST   /api/v1/images/upload
GET    /api/v1/images/:name
DELETE /api/v1/images/:name
POST   /api/v1/images/:name/scan
POST   /api/v1/images/:name/sbom
POST   /api/v1/images/:name/provenance
POST   /api/v1/images/:name/publish
```

## Capsule Types

```txt
GET    /api/v1/capsule-types
POST   /api/v1/capsule-types
GET    /api/v1/capsule-types/:name
POST   /api/v1/capsule-types/:name/deprecate
DELETE /api/v1/capsule-types/:name
```

## Marketplace

```txt
GET  /api/v1/marketplace/images
GET  /api/v1/marketplace/images/:id
POST /api/v1/marketplace/images/:id/install
POST /api/v1/marketplace/images/:id/approve
POST /api/v1/marketplace/images/:id/reject
POST /api/v1/marketplace/images/:id/quarantine
```

## Factory

```txt
GET  /api/v1/factory/status
GET  /api/v1/factory/jobs
GET  /api/v1/factory/jobs/:id
GET  /api/v1/factory/images
POST /api/v1/factory/images/:id/push
POST /api/v1/factory/images/:id/rescan
```

## Storage

```txt
GET    /api/v1/storage/buckets
POST   /api/v1/storage/buckets
GET    /api/v1/storage/buckets/:bucket
DELETE /api/v1/storage/buckets/:bucket

GET    /api/v1/storage/buckets/:bucket/objects
POST   /api/v1/storage/buckets/:bucket/objects
GET    /api/v1/storage/buckets/:bucket/objects/:key
DELETE /api/v1/storage/buckets/:bucket/objects/:key

GET    /api/v1/storage/volumes
POST   /api/v1/storage/volumes
POST   /api/v1/storage/volumes/:name/attach
POST   /api/v1/storage/volumes/:name/detach
DELETE /api/v1/storage/volumes/:name
```

## Networks

```txt
GET    /api/v1/networks
POST   /api/v1/networks
GET    /api/v1/networks/:name
DELETE /api/v1/networks/:name
POST   /api/v1/networks/:name/attach/:instance
POST   /api/v1/networks/:name/detach/:instance
```

## DNS

```txt
GET    /api/v1/dns/zones
POST   /api/v1/dns/zones
GET    /api/v1/dns/zones/:zone
DELETE /api/v1/dns/zones/:zone
POST   /api/v1/dns/zones/:zone/records
DELETE /api/v1/dns/zones/:zone/records/:id
POST   /api/v1/dns/query
```

## CapInit

```txt
GET    /api/v1/capinit/status
GET    /api/v1/capinit/templates
POST   /api/v1/capinit/templates
GET    /api/v1/capinit/templates/:id
PUT    /api/v1/capinit/templates/:id
DELETE /api/v1/capinit/templates/:id
POST   /api/v1/capinit/render
GET    /api/v1/instances/:id/metadata
PUT    /api/v1/instances/:id/metadata
```

## IAM

```txt
GET    /api/v1/iam/users
POST   /api/v1/iam/users
DELETE /api/v1/iam/users/:name

GET    /api/v1/iam/groups
POST   /api/v1/iam/groups
POST   /api/v1/iam/groups/:group/members
DELETE /api/v1/iam/groups/:group/members/:user

GET    /api/v1/iam/roles
POST   /api/v1/iam/roles

GET    /api/v1/iam/policies
POST   /api/v1/iam/policies
POST   /api/v1/iam/simulate
```

# Frontend Type Models

Example TypeScript types:

```ts
export type InstanceState =
  | "running"
  | "stopped"
  | "failed"
  | "starting"
  | "stopping"
  | "unknown";

export interface CapperInstance {
  id: string;
  name: string;
  image: string;
  imageDigest: string;
  state: InstanceState;
  pid?: number;
  runtimeMode: "auto" | "bwrap" | "chroot" | "crun" | "runc";
  capsuleType: string;
  hostname?: string;
  network?: {
    name: string;
    ipAddress?: string;
  };
  resources: {
    cpuCores: number;
    memoryBytes: number;
    diskBytes?: number;
    gpuEnabled?: boolean;
    gpuCount?: number;
    maxProcesses?: number;
  };
  createdAt: string;
  startedAt?: string;
  owner: string;
}

export interface CapperImage {
  name: string;
  version?: string;
  digest: string;
  sizeBytes: number;
  source: "local" | "factory" | "marketplace" | "uploaded";
  signed: boolean;
  sbomAvailable: boolean;
  provenanceAvailable: boolean;
  scanStatus: "none" | "pending" | "passed" | "failed" | "quarantined";
  createdAt?: string;
}

export interface CapsuleType {
  name: string;
  version: string;
  description?: string;
  cpuCores: number;
  memoryBytes: number;
  diskBytes?: number;
  gpu: {
    enabled: boolean;
    passthrough: boolean;
    count: number;
  };
  maxProcesses: number;
  allowedRuntimes: string[];
  deprecated: boolean;
}
```

# Example React Routes

```tsx
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { InstanceList } from "@/pages/instances/InstanceList";
import { InstanceDetail } from "@/pages/instances/InstanceDetail";
import { CreateInstance } from "@/pages/instances/CreateInstance";
import { ImageList } from "@/pages/images/ImageList";
import { Marketplace } from "@/pages/marketplace/Marketplace";
import { FactoryDashboard } from "@/pages/factory/FactoryDashboard";
import { NetworkList } from "@/pages/networks/NetworkList";
import { StorageDashboard } from "@/pages/storage/StorageDashboard";
import { CapInitDashboard } from "@/pages/capinit/CapInitDashboard";
import { Users } from "@/pages/iam/Users";
import { Settings } from "@/pages/settings/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "instances", element: <InstanceList /> },
      { path: "instances/new", element: <CreateInstance /> },
      { path: "instances/:id", element: <InstanceDetail /> },
      { path: "images", element: <ImageList /> },
      { path: "marketplace", element: <Marketplace /> },
      { path: "factory", element: <FactoryDashboard /> },
      { path: "networks", element: <NetworkList /> },
      { path: "storage", element: <StorageDashboard /> },
      { path: "capinit", element: <CapInitDashboard /> },
      { path: "iam/users", element: <Users /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
```

# API Client

```ts
const API_BASE = import.meta.env.VITE_CAPPER_API_URL ?? "/api/v1";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
```

# Instance List Hook

```ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { CapperInstance } from "@/types/capper";

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: () => apiFetch<CapperInstance[]>("/instances"),
    refetchInterval: 5000,
  });
}
```

# Instance Actions

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export function useInstanceActions(id: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["instances"] });
    qc.invalidateQueries({ queryKey: ["instances", id] });
  };

  return {
    start: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/start`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    stop: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/stop`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    restart: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}/restart`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: () => apiFetch(`/instances/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}
```

# Example Instance Table

```tsx
import { useInstances } from "@/api/instances";
import { StatusBadge } from "@/components/common/StatusBadge";

export function InstanceList() {
  const { data, isLoading, error } = useInstances();

  if (isLoading) return <div>Loading instances...</div>;
  if (error) return <div>Failed to load instances.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Instances</h1>
        <p className="text-muted-foreground">
          Run, inspect, connect to, and manage Capper capsule instances.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Name</th>
              <th className="p-3">State</th>
              <th className="p-3">Image</th>
              <th className="p-3">Capsule</th>
              <th className="p-3">CPU</th>
              <th className="p-3">Memory</th>
              <th className="p-3">Network</th>
              <th className="p-3">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((inst) => (
              <tr key={inst.id} className="border-b hover:bg-muted/40">
                <td className="p-3 font-medium">{inst.name}</td>
                <td className="p-3">
                  <StatusBadge status={inst.state} />
                </td>
                <td className="p-3">{inst.image}</td>
                <td className="p-3">{inst.capsuleType}</td>
                <td className="p-3">{inst.resources.cpuCores}</td>
                <td className="p-3">
                  {Math.round(inst.resources.memoryBytes / 1024 / 1024)} MB
                </td>
                <td className="p-3">{inst.network?.ipAddress ?? "none"}</td>
                <td className="p-3">{inst.startedAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

# WebUI Permission Model

The frontend should never decide final authorization. It should ask the backend.

But it should improve UX by hiding/greying actions based on returned capabilities.

Every major resource response should include:

```json
{
  "capabilities": {
    "canStart": true,
    "canStop": true,
    "canDelete": false,
    "canPublish": false
  }
}
```

For IAM simulation:

```txt
POST /api/v1/iam/simulate
```

Payload:

```json
{
  "action": "instance:delete",
  "resource": "instance/inst_abc123"
}
```

Response:

```json
{
  "allowed": false,
  "reason": "missing role: instance-admin"
}
```

# What I Would Build First

Do this in phases.

## Phase 1: Core Control Plane UI

```txt
Dashboard
Instance list
Instance detail
Start/stop/delete
Image list
Image detail
Basic logs
Daemon health
```

## Phase 2: Storage + Networking

```txt
Buckets
Object browser
Volumes
Networks
DNS query tester
```

## Phase 3: CapInit

```txt
Metadata templates
Cloud-init-style editor
Per-instance metadata
Metadata request logs
```

## Phase 4: Marketplace + Factory

```txt
Factory jobs
Image scan status
Push image to main Capper
Public/private marketplace
Approval workflow
Quarantine
```

## Phase 5: IAM + Audit

```txt
Users
Groups
Roles
Policies
Access simulation
Audit log
```

# Critical Backend Additions Needed

To make the WebUI real, Capper needs these backend pieces:

```txt
1. REST API daemon wrapping existing Controller
2. WebSocket terminal endpoint
3. Log streaming endpoint
4. Event/audit store
5. Capsule type registry
6. Marketplace metadata store
7. Factory sync API
8. CapInit metadata service
9. Browser session authentication
10. CORS/CSRF protections if served separately
```

The good news: a lot of the actual capability already exists in the codebase. The missing piece is mostly the **HTTP control-plane API** and a polished WebUI on top of it.

My direct recommendation: build the frontend as `webui/`, but serve the built static assets from the Capper daemon in production. During development, Vite proxies `/api` to the local Capper API daemon. That gives you a clean dev loop and a single deployable Capper server later.
