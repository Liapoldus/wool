# Wool: breaking migration

## Nomenclature migration — 2026-10-13

| Consumer surface | Previous name | Required name |
| --- | --- | --- |
| Go module and every package import | `github.com/Liapoldus/pluginprotocol/v3` | `github.com/Liapoldus/wool/v3` |
| Workspace directory and local replace target | `pluginprotocol/` | `wool/` |
| Canonical site source and route | `docs/site/pluginprotocol/`, `/pluginprotocol/` | `docs/site/wool/`, `/wool/` |
| Named release tag and source artifact | `pluginprotocol-v3.*`, `pluginprotocol-*.tar.gz` | `wool-v3.*`, `wool-*.tar.gz` |
| Runtime entities and independent lifecycle SDK | Plugins, Plugin SDK | Services, `github.com/Liapoldus/service-sdk/v2` |

Replace the module prefix in all peer packages, fixtures, generators and tests.
Keep the four layer/package suffixes and all neutral public API names unchanged:
`Identity`, `Call`, `Stream`, `Method`, registry methods and application-owned
method names are not renamed. Go module major remains v3. The only proto option
change is `go_package`; `liapoldus.peer.v1`, field numbers, messages, statuses,
framing and opaque payload bytes remain unchanged. The wire test pins the entire
descriptor excluding that Go option and exact method/payload encoding.

The control plane is Studio → CLI → Core → Service SDK REST. Independent Services
use Wool in the data plane. Wool neither imports the SDK nor owns REST lifecycle,
configuration generations, distribution, immutable generation bytes/digests or
Core policy. Only editor extensions are StudioPlugins. No aliases, old routes,
fallbacks or compatibility packages are shipped.

Consumer owners: `services/{server,forms-db,domain,runtime,echo}` update their
module dependencies, imports and local paths; SDK stays independent; Core uses
Service SDK REST for lifecycle. The documentation aggregator owner updates its
source map and sidebar to `/wool/`. Publication and source pins require the
owner's published revision and are outside this local, no-commit/no-push change.
See the [current consumer guide](consumer-guide.md).

## Historical removal record

The following record retains the exact removed symbols, old namespaces and dated
consumer reports. Its historical names are evidence, not supported aliases or
current consumer migration results.

Wool is the generic service-to-service library. Everything below
no longer exists here, and no compatibility shim, alias or fallback is provided: a
consumer either uses the replacement surface or stops using this module for that
capability.

Nothing in this document invents an API for another module. Where a capability has
an owner outside this repository, the owner is named and the contract stays with
them.

## 1. Who owns what now

| Capability | Owner | This module |
| --- | --- | --- |
| Service↔Core REST lifecycle, `Reload`, config pull, `Rollback`, manifest/schema, health/readiness | independent `service-sdk/` module | not present, never owned |
| Peer registration, calls, listeners, bidirectional streams, carrier and security profiles | Wool `presentation/peer` | yes, see [consumer-guide.md](consumer-guide.md) |
| Product methods, schemas, error taxonomies, conformance vectors | the service that owns the product contract | absent by design |
| Desired service configuration, generation storage | Core (SQLite), delivered through the Service SDK REST boundary | absent by design |

## 2. Removed package paths

These import paths fail to resolve after this change:

- `domain` (legacy root) — generic models are now `domain/peer`
- `application` (legacy root) — registration/dispatch are now `application/peer`
- `contracts`, `contracts/http`, `contracts/protocol`, `contracts/admin-ui`, `contracts/embed.go` (`contracts.Files`)
- `infrastructure/contracts` — cookie and HTTP response-action helpers
- `infrastructure/grpc`, `infrastructure/transport`
- `pluginv1` — generated `liapoldus.plugin.v1` Go types and gRPC service stubs
- `presentation/sdk`
- `proto/liapoldus/plugin/`, `proto/liapoldus/control/`
- `tests/generated`, `tests/fixtures/*` except `peer-net` and `peer-router`

The only remaining wire contract is `liapoldus.peer.v1`, generated to
`infrastructure/peer/wire`. The plan to move the plugin transport to gRPC
(v1.1.0) was cancelled; see [CHANGELOG.md](../CHANGELOG.md).

## 3. Exact removed exported API, by capability

### 3.1 Service lifecycle and configuration — owned by the Service SDK

Removed gRPC service and its messages in `pluginv1`:

`Bootstrap`, `BootstrapRequest`, `BootstrapResult`, `Manifest`, `ManifestRequest`,
`ConfigSchema`, `ConfigSchemaRequest`, `ConfigApply`, `ConfigApplyRequest`,
`ConfigApplyResult`, `DispatchApply`, `DispatchApplyRequest`,
`DispatchApplyResponse`, `Shutdown`, `ShutdownRequest`, `ShutdownResult`,
`ConfigField`, `Descriptor`, `CapabilityDescriptor`,
`CapabilityDispatchScope`, `PluginServiceClient`, `PluginServiceServer`,
`RegisterPluginServiceServer`, `PluginService_ServiceDesc`,
`PluginService_*_FullMethodName`, `PluginService_StreamClient`,
`PluginService_StreamServer`, `UnimplementedPluginServiceServer`,
`UnsafePluginServiceServer`.

Removed lifecycle registry and models in the legacy `domain`/`application` roots:

`application.NewRegistry`, `Registry`, `RegisterCall`, `RegisterStream`,
`CallHandler`, `StreamHandler`, `HasCapability`, `CapabilityDescriptors`,
`ErrDuplicateHandler`, `ErrHandlerNotFound`, `ErrInvalidRegistration`,
`domain.ProtocolVersion`, `CallRequest`, `CallResponse`, `CallHandler`,
`StreamHandler`, `Stream`, `Stream*`, `PluginEvent`, `CapabilityDescriptor`.

Removed from `presentation/sdk`: `NewRegistry`, `Registry`, `RegisterCall`,
`RegisterStream`, `CallHandler`, `StreamHandler`, `Client`, `NewService`,
`Service`, `BootstrapLocalClient`, `ProtocolVersion`, `ContractFiles`.

Replace with: the Service SDK's REST contract for configuration and lifecycle, and
Wool `presentation/peer` for service-to-service calls. This module defines neither the
REST contract nor its types.

### 3.2 Grants, revocation and remote authorization — removed outright

`pluginv1`: `GrantBrokerClient`, `GrantBrokerServer`, `RegisterGrantBrokerServer`,
`NewGrantBrokerClient`, `RedeemGrant`, `RedeemGrantRequest`, `RedeemGrantResponse`,
`GrantBroker_ServiceDesc`, `GrantScope`, `GrantScope_*`,
`ActiveGrant`, `RemoteGrant*`.

`presentation/sdk` and `infrastructure/transport`:
`GrantClient`, `GrantServer`, `StartGrantBroker`, `NewGrantBrokerServer`,
`StartedGrantServer`, `NewRemoteGrantBrokerServer`, `Redeem`, `RedeemConfig`,
`RedeemGrant`, `GrantScopeCall`, `GrantScopeConfigApply`,
`RemoteAuthorization`, `RemoteRevocationState`, `NewRemoteRevocationState`,
`RemoteServerInterceptors`, `RemoteGrantClientIdentity`,
`RemoteGrantServerOptions`, `RemoteGrantTLSOptions`,
`DialGrantBrokerContext`, `DialGrantBrokerFromBootstrapContext`,
`DialRemoteGrantBrokerContext`.

Errors: `ErrGrantDenied`, `ErrGrantRejected`, `ErrRemoteAuthorizationDenied`,
`ErrRemoteRevocation`, `ErrCallRejected`, `ErrConfigApplyRejected`,
`ErrDispatchGenerationPrecondition`, `ErrInvalidRemoteAuthorization`,
`ErrInvalidRemoteListenerContract`, plus `DispatchGeneration`,
`NewDispatchGeneration`, `ErrInvalidDispatchGeneration`,
`ErrInvalidDispatchAcknowledgement`.

Replace with: the Service SDK's authorization boundary for Core↔service traffic. Peer
authorization inside this module is the consumer-supplied
`presentation/peer.Authorizer` (`RegistryBuilder.WithAuthorizer`, `AllowAll`),
enforced on the serving peer for calls and streams alike.

### 3.3 gRPC and the legacy TCP transport layer — removed, no replacement carrier

`infrastructure/grpc`: `NewService`, `Service`, `AdaptCallHandler`,
`AdaptStreamHandler`, `WireCallHandler`, `WireCallHandlerFromDomain`,
`WireStreamHandler`, `WireStreamHandlerFromDomain`, `Call`, `Stream`, `Open`,
`Recv`, `Send`, `Context`, `Manifest`, `Capability`,
`InvocationModeFromProto`, `InvocationModeToProto`.

`infrastructure/transport`: `Accept`, `AcceptLocalBootstrap`,
`AcceptInheritedLocalBootstrap`, `BootstrapAndHandshake`, `BootstrapLocalClient`,
`Handshake`, `NewServer`, `NewLocalServer`, `NewRemoteServer`, `ServerOptions`,
`LocalServerOptions`, `RemoteServerOptions`, `ListenLoopback`, `ListenRemoteTLS`,
`ListenInherited`, `LocalListener`, `RemoteListener`, `Serve`,
`ServeInheritedLocalSession`, `StartLocalSession`, `LocalSession`,
`LocalSessionOptions`, `InheritedListenerFileDescriptor`, `WrapListener`,
`DialContext`, `DialLocalContext`, `DialRemoteContext`, `ApplyConfiguration`,
`ApplyDispatch`, `CheckHealth`, `Shutdown`, `DefaultMaxMessageBytes`,
`MaxStreamMessageBytes`, `EncodeStreamOpenContext`, `RecvMsg`, `SendMsg`,
`ErrUnavailable`, `ErrInvalidEndpoint`, `ErrInvalidLocalSession`,
`ErrInvalidLocalTLS`, `ErrInvalidRemoteTLS`, `ErrInvalidRemoteServerOptions`,
`ErrProtocolViolation`.

Replace with: `presentation/peer.Listen`/`Dial` over the TCP or QUIC carrier. The
physical carrier is selected by the consumer; registered method names, payload
contracts and call sites do not change.

### 3.4 HTTP, cookie, SSE and WebSocket specifics — moved out of the protocol

`domain`: `HTTPRequestChunk`, `HTTPResponseChunk`, `HTTPResponseStart`,
`SSEEvent`, `WebSocketHandshakeResult`, `WebSocketMessage`,
`WebSocketMessageKind`, `WebSocketMessageKind_*`, `InvocationMode`,
`InvocationMode*`, `StreamTransport`, `StreamTransport_*`, `StreamDirection`,
`StreamClose`, `StreamCloseCode*`, `StreamOpen`, `StreamData`.

`infrastructure/contracts`: `CookiePolicy`, `CookiePair`, `CookieAction`,
`ParseCookieHeader`, `DecodeCookiePolicy`, `FilterCookiePairs`, `MatchString`,
`HTTPResponseAction`, `DecodeHTTPResponseAction`, `ErrCookiePolicyScope`,
`ErrInvalidCookiePolicy`, `ErrInvalidCookieRequest`,
`ErrInvalidHTTPResponseAction`.

`pluginv1` carried the same shapes over the wire as `StreamMessage_HttpRequestChunk`,
`StreamMessage_HttpResponseStart`, `StreamMessage_SseEvent`,
`StreamMessage_WebsocketHandshake`, `StreamMessage_WebsocketMessage`,
`GetHttpRequestChunk`, `GetHttpResponseStart`, `GetSseEvent`,
`GetWebsocketHandshake`, `GetWebsocketMessage`, `GetCookie`, `GetSubprotocol`.

Replace with: a plugin that actually speaks HTTP owns its own HTTP semantics and
translates them to and from the generic `Call`/`Stream` payload. The protocol
carries opaque payloads and knows nothing about HTTP, cookies, SSE or WebSocket.

## 4. Consumer status and handoff

The source migration and integrated workspace status was reconciled on 2026-10-10:

| Consumer | Status | Required action |
| --- | --- | --- |
| `core` | Uses Service SDK REST for service lifecycle; it must not import Wool for lifecycle. | Use Wool only for generic service peer calls/streams where required. |
| `services/server` | Uses Service SDK v2 and Wool `presentation/peer`. | Keep product contracts in the Server owner repository; no lifecycle surface belongs in Wool. |
| `services/forms-db` | Uses Service SDK v2 and Wool `presentation/peer`. | Keep product contracts in the forms-db owner repository; no lifecycle surface belongs in Wool. |
| `services/captcha`, `services/identity` | Frozen snapshots outside the active train. | Do not treat these snapshots as active consumers or restore compatibility exports without a new architecture decision. |
| Third-party consumers | Not inventoried by this workspace. | Owners migrate independently; no deprecation aliases are provided. |

The combined manual-process smoke was repeated on macOS and in a Linux/arm64
container. This does not claim a native Linux host run or independently prove
third-party interoperability; both remain outside this consumer migration
result.

Active consumers that use peer communication replace it with
`presentation/peer`: `NewRegistry` →
`RegisterCall`/`RegisterStream`/`WithAuthorizer`/`Build`,
`Listen(ServerConfig)`, `Dial(ctx, ClientConfig)`, and session methods
`Call(ctx, method, payload)` / `OpenStream(ctx, method)` /
`Recv`/`Send`/`CloseSend`/`Close`. Follow
[consumer-guide.md](consumer-guide.md). Product-specific methods, schemas and
error taxonomies belong in their owning service. There is no deprecation period
or alias for removed paths.

## 5. Verifying the removal from your side

- `go build ./...` in this module fails on any import of a removed path; the
  suite asserts the absence of the legacy roots and of the Plugin SDK import.
- `make check` runs the full behavioural suite over `tcp/loopback`, `tcp/mtls` and
  `quic/mtls` on real child processes, plus the generated-source check.
- This document is a record of what was removed. It is not a compatibility layer,
  and it does not describe a supported fallback.
