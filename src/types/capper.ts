export type InstanceState =
  | "created"
  | "pending"
  | "running"
  | "stopped"
  | "stopping"
  | "shutting-down"
  | "terminated"
  | "rebooting"
  | "failed"
  | "error"
  | "starting"
  | "unknown";

export interface ResourceLimits {
  memoryBytes?: number;
  cpuTimeSecs?: number;
  maxProcesses?: number;
  fileSizeBytes?: number;
  diskBytes?: number;
}

export interface CapperInstance {
  id: string;
  name: string;
  image: string;
  imageId?: string;
  imageDigest: string;
  status: InstanceState;
  pid: number;
  runtimeMode?: string;
  instanceType?: string;
  capsuleType?: string;
  hostname?: string;
  networkId?: string;
  networkIp?: string;
  vpcId?: string;
  subnetId?: string;
  primaryEniId?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  securityGroupIds?: string[];
  keyName?: string;
  terminationProtection?: boolean;
  shutdownBehavior?: string;
  resources?: ResourceLimits;
  createdAt: string;
  startedAt?: string;
  stoppedAt?: string | null;
  labels?: Record<string, string>;
  tags?: Record<string, string>;
  entrypoint?: string[];
  restartPolicy?: string;
  realmId?: string;
  regionId?: string;
  zoneId?: string;
  nodeId?: string;
}

export interface CapperImage {
  id: string;
  name: string;
  version?: string;
  digest: string;
  sizeBytes: number;
  source?: "local" | "factory" | "marketplace" | "uploaded";
  createdAt?: string;
  missing?: boolean;
}

export interface CapsuleType {
  id: string;
  name: string;
  family: string;
  cpuCount: number;
  memoryBytes: number;
  diskBytes?: number;
  pidLimit: number;
  gpuEligible: boolean;
  gpuCount: number;
  description?: string;
  locked?: boolean;
  deprecated?: boolean;
}

export interface Network {
  id: string;
  name: string;
  subnet: string;
  gateway: string;
  bridge: string;
  mode: string;
  status: string;
  error?: string;
  project?: string;
}

export interface Bucket {
  id: string;
  name: string;
  sizeBytes?: number;
  versioning: boolean;
  encrypted: boolean;
  createdAt: string;
}

export interface Volume {
  id: string;
  name: string;
  sizeBytes: number;
  attachedInstanceId?: string;
  attachedPath?: string;
  createdAt: string;
}

export interface StorageObject {
  key: string;
  sizeBytes: number;
  digest: string;
  createdAt: string;
}

export interface DNSZone {
  id: string;
  name: string;
  type: string;
  networkId?: string;
  defaultTtl: number;
}

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  values: string[];
  ttl: number;
}

export interface ResourceEvent {
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  principalType: string;
  principalId: string;
  timestamp: string;
}

export interface DaemonStatus {
  status: string;
  online: boolean;
  supervisorStats?: Record<string, number>;
}

export interface IAMUser {
  id: string;
  name: string;
  localUser?: string;
  createdAt: string;
}

export interface IAMPolicy {
  id: string;
  name: string;
  statements: Array<{
    effect: string;
    actions: string[];
    resources: string[];
  }>;
}

export interface IAMToken {
  id: string;
  name: string;
  principalType: string;
  principalId: string;
  expiresAt: string;
  createdAt: string;
}

export interface IAMGroup {
  id: string;
  name: string;
  members?: string[];
  createdAt: string;
}

export interface IAMRole {
  id: string;
  name: string;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  name: string;
  version?: string;
  description?: string;
  digest?: string;
  status: string;
  labels?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
  scanStatus?: "pass" | "warn" | "fail";
  scanFindings?: number;
  scanSeverities?: Record<string, number>;
  scanScannedAt?: string;
  sbomDigest?: string;
}

export interface FactoryStatus {
  connected: boolean;
  message?: string;
  deferred?: boolean;
}

export interface FactorySyncStatus {
  connected: boolean;
  lastSync?: string;
  pendingArtifacts?: number;
  failedTransfers?: number;
  message?: string;
}

export interface AuditRecord {
  id: string;
  principalType: string;
  principalId: string;
  action: string;
  resource: string;
  decision: string;
  timestamp: string;
}

export interface CapInitTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstanceCapabilities {
  canStart?: boolean;
  canStop?: boolean;
  canRestart?: boolean;
  canDelete?: boolean;
  canConnect?: boolean;
  canLogs?: boolean;
}

export interface ApiEnvelope<T> {
  data?: T;
  capabilities?: InstanceCapabilities;
  error?: string;
}

// Load Balancers
export interface LoadBalancer {
  id: string;
  name: string;
  scheme?: "internal" | "internet-facing";
  type?: "application" | "network";
  vpcId?: string;
  subnetId?: string;
  vipAddress?: string;
  routableIpId?: string;
  dnsName?: string;
  mode: "tcp" | "http" | "https";
  listenAddr: string;
  status: string;
  algorithm: string;
  selector: string;
  tlsCertName?: string;
  networkId?: string;
}

export interface LBListener {
  id: string;
  loadBalancerId: string;
  targetGroupId: string;
  protocol: string;
  port: number;
  certificateId?: string;
  createdAt?: string;
}

export interface LBTargetGroup {
  id: string;
  name: string;
  loadBalancerId?: string;
  vpcId?: string;
  protocol: string;
  port: number;
  healthPath?: string;
}

export interface LBTarget {
  id: string;
  targetGroupId: string;
  address: string;
  weight?: number;
}

export interface LBBackend {
  id: string;
  address: string;
  port?: number;
  weight?: number;
  status?: string;
}

export interface LBDetail {
  lb: LoadBalancer;
  listeners?: LBListener[];
  targetGroups?: LBTargetGroup[];
  targets?: LBTarget[];
  backends?: LBBackend[];
}

// Firewalls
export interface Firewall {
  id: string;
  name: string;
  network: string;
  rulesCount: number;
  status: string;
}

export interface FirewallRule {
  id: string;
  direction: "inbound" | "outbound";
  protocol: string;
  portRange: string;
  source: string;
  action: "allow" | "deny";
  priority: number;
}

// Health Checks
export interface HealthCheckResult {
  instanceId: string;
  status: "healthy" | "unhealthy";
  message: string;
  checkedAt: string;
}

// Stacks
export interface StackResource {
  type: string;
  name: string;
  id: string;
}

export interface Stack {
  id: string;
  name: string;
  status: string;
  resources: StackResource[];
  updatedAt: string;
}

// Databases
export type DBEngine = "postgres" | "redis" | "mariadb" | "capdb";

export interface Database {
  id: string;
  name: string;
  engine: DBEngine;
  version?: string;
  status: string;
  port?: number;
  instanceId?: string;
  networkId?: string;
  createdAt: string;
}

// AI Control Plane
export interface AIAgent {
  id: string;
  name: string;
  model: string;
  owner: string;
  role: string;
}

export interface AISession {
  sessionId: string;
  agent: string;
  principalUser: string;
  status: string;
  startedAt: string;
}

export interface MCPServer {
  id: string;
  name: string;
  endpoint: string;
  iamAction: string;
}

// Backups
export interface Backup {
  id: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export interface BackupPolicy {
  id: string;
  name: string;
  type: string;
  interval: string;
  retention: number;
}

// Quotas
export interface Quota {
  resource: string;
  limit: number;
  used: number;
}

// VPC / Networking
export type SubnetKind = "private" | "public" | "edge" | "lb" | "service" | "isolated" | "storage";

export interface VPC {
  id: string;
  name: string;
  slug?: string;
  cidr?: string;
  primaryIpv4Cidr?: string;
  description?: string;
  dnsDomain?: string;
  status?: string;
  enableFlowLogs?: boolean;
  mainRouteTableId?: string;
  createdAt?: string;
}

export interface Subnet {
  id: string;
  vpcId?: string;
  name: string;
  cidr: string;
  kind?: SubnetKind;
  subnetType?: SubnetKind;
  zone?: string;
  zoneId?: string;
  availableIpCount?: number;
  status?: string;
}

export interface RouteTable {
  id: string;
  vpcId?: string;
  name: string;
  isMain?: boolean;
}

export interface Route {
  id: string;
  routeTableId?: string;
  destinationCidr?: string;
  destination?: string;
  targetType: string;
  targetId: string;
}

export interface SecurityGroup {
  id: string;
  vpcId?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface SecurityGroupRule {
  id: string;
  securityGroupId?: string;
  direction: "ingress" | "egress";
  protocol: string;
  fromPort?: number;
  toPort?: number;
  cidr?: string;
  cidrIpv4?: string;
  action?: string;
}

export interface NetworkACL {
  id: string;
  vpcId?: string;
  name: string;
  isDefault?: boolean;
}

export interface NetworkACLEntry {
  ruleNumber: number;
  direction: string;
  action: string;
  protocol: string;
  cidr: string;
  fromPort?: number;
  toPort?: number;
}

export interface InternetGateway {
  id: string;
  vpcId?: string;
  name: string;
  status?: string;
}

export interface NATGateway {
  id: string;
  vpcId?: string;
  subnetId: string;
  name: string;
  publicIp?: string;
  status?: string;
}

export interface VPCDependencies {
  vpcId: string;
  subnets?: string[];
  instances?: string[];
  enis?: string[];
  loadBalancers?: string[];
  natGateways?: string[];
  dnsZones?: string[];
  blocked?: boolean;
}

export interface SubnetDependencies {
  subnetId: string;
  enis?: string[];
  instances?: string[];
  loadBalancers?: string[];
  natGateways?: string[];
  blocked?: boolean;
}

export interface VPCDetail {
  vpc: VPC;
  subnets: Subnet[];
  routeTables: { routeTable: RouteTable; routes: Route[] }[];
  securityGroups: { securityGroup: SecurityGroup; rules: SecurityGroupRule[] }[];
  networkAcls: { networkAcl: NetworkACL; entries: NetworkACLEntry[] }[];
  internetGateways: InternetGateway[];
  natGateways: NATGateway[];
  dependencies: VPCDependencies;
}

// Posture / Security
export type PostureSeverity = "critical" | "high" | "medium" | "low";

export interface PostureFinding {
  id: string;
  severity: PostureSeverity;
  type: string;
  detail: string;
  path?: string;
  pid?: number;
  scannedAt: string;
}
