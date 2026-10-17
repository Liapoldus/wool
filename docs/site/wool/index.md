# Liapoldus Wool

Control plane: Studio → CLI → Core → Service SDK REST. Независимые Services
общаются через Wool в data plane; StudioPlugins — только расширения редактора.
Go module: `github.com/Liapoldus/wool/v3`; Service SDK:
`github.com/Liapoldus/service-sdk/v2`. Wire namespace остаётся
`liapoldus.peer.v1`. [Карта breaking-перехода](/wool/migration).

`wool` — независимая Go-библиотека для generic коммуникации между
сервисами. Потребитель сам регистрирует методы, payloads и их прикладной смысл;
библиотека предоставляет только registration/invocation, listener и stream
primitives, транспорт и сетевую защиту.

## Четыре слоя

- `domain/` — transport-independent models и interfaces;
- `application/` — generic registration и управление вызовами/streams;
- `infrastructure/` — carrier, connections, deadlines, cancellation, flow
  control, identity и transport security;
- `presentation/` — публичный Go facade библиотеки.

Application API не меняется при выборе физического carrier или security
profile. Production carrier matrix — TCP/QUIC для remote, Unix sockets для
Linux/macOS и named pipes для Windows; каждый проходит один и тот же
набор conformance, поэтому смена carrier не ослабляет peer authentication,
encryption, authorization, cancellation, deadlines, flow control или stream
семантику. Единый wire contract — `liapoldus.peer.v1`; он переносит только opaque
method name и opaque payload. `wool` владеет TLS/mTLS handshake,
проверкой peer identity и revocation; services выбирают профиль и передают
credentials через API библиотеки, не реализуя TLS самостоятельно. Remote- и
production-соединения требуют mTLS. Явный plaintext разрешён только для TCP
loopback в development и не удостоверяет peer. QUIC всегда шифрует трафик и
требует взаимную аутентификацию. Ошибка secure-соединения никогда не вызывает
автоматический plaintext fallback. Так как payload opaque и библиотека не
может определить наличие в нём секретов, вызывающий service обязан использовать
plaintext только для несекретного локального development-трафика; sensitive
payloads передаются исключительно по соединению с mTLS.

## Использование

Публичная поверхность — один пакет `presentation/peer`: регистрация методов,
`Listen`/`Sessions`, `Dial`, `Call`, `OpenStream`, выбор carrier и security
profile. Пошаговый разбор для потребителя — в
[Руководство потребителя](/wool/consumer-guide); каждый пример там продублирован
компилируемым fixture, который выполняет conformance suite.

## Явно вне владения библиотеки

Библиотека не знает Core, service lifecycle, settings, `Reload`, config pull,
rollback, Manifest, health/readiness, logging/metrics endpoints и capabilities
или contracts конкретных продуктов. Core↔service REST lifecycle и общие
инструменты сервиса принадлежат отдельному `service-sdk/`. Product methods,
schemas, ошибки и conformance vectors принадлежат репозиториям сервисов.

Подробный backlog и критерий готовности находятся в [TODO.md](https://github.com/Liapoldus/wool/blob/main/TODO.md).

Потребитель, который использовал удалённые lifecycle, grant или gRPC API,
начинает миграцию с [карты миграции](/wool/migration): там перечислены
удалённые package paths и exported API по capability и владельцу замены.
