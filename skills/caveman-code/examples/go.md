# Go

## Boolean soup → typed state + table
```go
// before
type Conn struct {
	connecting, connected, closed bool
	retries                       int
}
```
```go
// after
type State int

const (
	Disconnected State = iota
	Connecting
	Connected
	Closed
)

type Event int

const (
	Dial Event = iota
	Ok
	Drop
	Close
)

var transitions = map[State]map[Event]State{
	Disconnected: {Dial: Connecting, Close: Closed},
	Connecting:   {Ok: Connected, Drop: Disconnected, Close: Closed},
	Connected:    {Drop: Disconnected, Close: Closed},
}

func Transition(s State, e Event) (State, error) {
	next, ok := transitions[s][e]
	if !ok {
		return s, fmt.Errorf("invalid event %v in state %v", e, s)
	}
	return next, nil
}
```

## Switch ladder → map of handlers
```go
var handlers = map[string]http.HandlerFunc{
	"/health": health,
	"/users":  listUsers,
}
```
