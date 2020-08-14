# Architecture

The extractor uses an event-based architecture, with RxJS Observables as
the basic mechanism, and structures called Targets as the basic form of
data.

All Targets must have a URL, but all other properties depend on the type
of Target.

There are two fundamental functions which deal with Targets: Sources and
Sinks. Sources generate Targets which are then consumed by Sinks. An
additional emergent type which is sufficiently fundamental to mention
is Parsers. Parsers are just a special form of Sink which also act
as Sources, they use the data loaded from the Target to generate new
Targets.

A Pipeline is a set of Sources and Sinks, with an event-stream
connecting them. In order to write a Pipeline in this framework, one
needs to use the `connect` function to hook up Sources and Sinks. The
resulting Pipeline object can be started by calling `.start()`.
